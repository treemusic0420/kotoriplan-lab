import { getSupabaseClient } from '../../../infra/supabase/client'
import { fetchAccounts, fetchOrganizations, fetchVersions } from '../../master/api/masterRepository'
import type { Organization, Version } from '../../master/model/types'
import type { PLRow } from '../model/types'

type FetchPLRowsInput = {
  organizationId: string
  versionId: string
  year: number
}

type ScenarioLineItemAmountRow = {
  account_id: string
  target_year_month: string
  amount: string | number
}

const toYearMonth = (value: string): string => String(value).slice(0, 7)

const accountTypeOrder: Record<PLRow['accountType'], number> = {
  revenue: 0,
  variable_cost: 1,
  fixed_cost: 2,
  metric: 3,
}

const requireUserId = async () => {
  const { data, error } = await getSupabaseClient().auth.getUser()
  if (error) throw new Error(`Failed to read auth user: ${error.message}`)
  if (!data.user) throw new Error('Authentication required')
  return data.user.id
}

export async function fetchPLBaseData(): Promise<{
  organizations: Organization[]
  versions: Version[]
  availableYears: number[]
}> {
  const [organizations, versions, availableYears] = await Promise.all([
    fetchOrganizations(),
    fetchVersions(),
    fetchAvailableYears(),
  ])

  return { organizations, versions, availableYears }
}

async function fetchAvailableYears(): Promise<number[]> {
  const supabase = getSupabaseClient()
  const ownerUserId = await requireUserId()
  const { data, error } = await supabase
    .from('scenario_line_items')
    .select('target_year_month')
    .eq('owner_user_id', ownerUserId)
    .returns<{ target_year_month: string }[]>()

  if (error) throw new Error(`Failed to fetch PL years: ${error.message}`)

  const yearSet = new Set<number>()
  for (const row of data ?? []) {
    const year = Number(String(row.target_year_month).slice(0, 4))
    if (Number.isFinite(year)) yearSet.add(year)
  }
  return Array.from(yearSet).sort((a, b) => a - b)
}

export async function fetchPLRows({ organizationId, versionId, year }: FetchPLRowsInput): Promise<PLRow[]> {
  const supabase = getSupabaseClient()
  const ownerUserId = await requireUserId()
  const [accounts, lineItemsResult] = await Promise.all([
    fetchAccounts(),
    supabase
      .from('scenario_line_items')
      .select('account_id, target_year_month, amount')
      .eq('owner_user_id', ownerUserId)
      .eq('organization_id', organizationId)
      .eq('version_id', versionId)
      .gte('target_year_month', `${year}-01-01`)
      .lte('target_year_month', `${year}-12-31`),
  ])

  if (lineItemsResult.error) throw new Error(`Failed to fetch PL rows: ${lineItemsResult.error.message}`)

  const lineItems = (lineItemsResult.data ?? []) as ScenarioLineItemAmountRow[]
  const sums = new Map<string, number>()

  for (const item of lineItems) {
    const key = `${item.account_id}::${toYearMonth(item.target_year_month)}`
    const amount = Number(item.amount)
    sums.set(key, (sums.get(key) ?? 0) + amount)
  }

  const months = Array.from({ length: 12 }, (_, index) => `${year}-${String(index + 1).padStart(2, '0')}`)

  const sortedAccounts = [...accounts].sort((a, b) => {
    const typeDiff = accountTypeOrder[a.accountType] - accountTypeOrder[b.accountType]
    if (typeDiff !== 0) return typeDiff
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder
    return a.code.localeCompare(b.code)
  })

  return sortedAccounts.map((account) => ({
    accountId: account.id,
    accountCode: account.code,
    accountName: account.name,
    accountType: account.accountType,
    cells: months.map((yearMonth) => ({
      yearMonth,
      amount: sums.get(`${account.id}::${yearMonth}`) ?? null,
    })),
  }))
}

