import { getSupabaseClient } from '../../../infra/supabase/client'
import { fetchAccounts, fetchOrganizations, fetchVersions } from '../../master/api/masterRepository'
import type { Organization, Version } from '../../master/model/types'
import type { PLRow } from '../model/types'

type FetchPLRowsInput = { organizationId: string; versionId: string; year: number }
type ScenarioLineItemAmountRow = { account_id: string; target_year_month: string; amount: string | number }

const toYearMonth = (value: string): string => String(value).slice(0, 7)
const accountPriority: Record<string, number> = { SALES: 1, VARIABLE_COST: 2, CONTRIBUTION_MARGIN: 3, FIXED_COST: 4, OPERATING_PROFIT: 5 }

const requireUserId = async () => {
  const { data, error } = await getSupabaseClient().auth.getUser()
  if (error) throw new Error(`Failed to read auth user: ${error.message}`)
  if (!data.user) throw new Error('Authentication required')
  return data.user.id
}

export async function fetchPLBaseData(): Promise<{ organizations: Organization[]; versions: Version[]; availableYears: number[] }> {
  const [organizations, versions, availableYears] = await Promise.all([fetchOrganizations(), fetchVersions(), fetchAvailableYears()])
  return { organizations, versions, availableYears }
}

async function fetchAvailableYears(): Promise<number[]> {
  const ownerUserId = await requireUserId()
  const { data, error } = await getSupabaseClient().from('scenario_line_items').select('target_year_month').eq('owner_user_id', ownerUserId).returns<{ target_year_month: string }[]>()
  if (error) throw new Error(`Failed to fetch PL years: ${error.message}`)
  const years = new Set<number>(); for (const row of data ?? []) { const y = Number(String(row.target_year_month).slice(0, 4)); if (Number.isFinite(y)) years.add(y) }
  return Array.from(years).sort((a, b) => a - b)
}

export async function fetchPLRows({ organizationId, versionId, year }: FetchPLRowsInput): Promise<PLRow[]> {
  const ownerUserId = await requireUserId()
  const [accounts, lineItemsResult] = await Promise.all([
    fetchAccounts(),
    getSupabaseClient().from('scenario_line_items').select('account_id, target_year_month, amount').eq('owner_user_id', ownerUserId).eq('organization_id', organizationId).eq('version_id', versionId).gte('target_year_month', `${year}-01-01`).lte('target_year_month', `${year}-12-31`),
  ])
  if (lineItemsResult.error) throw new Error(`Failed to fetch PL rows: ${lineItemsResult.error.message}`)

  const sums = new Map<string, number>()
  for (const item of (lineItemsResult.data ?? []) as ScenarioLineItemAmountRow[]) {
    const key = `${item.account_id}::${toYearMonth(item.target_year_month)}`
    sums.set(key, (sums.get(key) ?? 0) + Number(item.amount))
  }

  const months = Array.from({ length: 12 }, (_, i) => `${year}-${String(i + 1).padStart(2, '0')}`)
  const byCode = new Map(accounts.map((a) => [a.code, a]))
  const get = (code: string, m: string) => { const a = byCode.get(code); if (!a) return null; return sums.get(`${a.id}::${m}`) ?? null }

  const baseRows: PLRow[] = accounts.map((a) => ({ accountId: a.id, accountCode: a.code, accountName: a.name, accountType: a.accountType, cells: months.map((m) => ({ yearMonth: m, amount: sums.get(`${a.id}::${m}`) ?? null })) }))
  const contribution: PLRow = { accountId: 'derived-contribution-margin', accountCode: 'CONTRIBUTION_MARGIN', accountName: 'Contribution Margin', accountType: 'revenue', cells: months.map((m) => ({ yearMonth: m, amount: get('SALES', m) === null || get('VARIABLE_COST', m) === null ? null : (get('SALES', m) as number) - (get('VARIABLE_COST', m) as number) })) }
  const profit: PLRow = { accountId: 'derived-operating-profit', accountCode: 'OPERATING_PROFIT', accountName: 'Operating Profit', accountType: 'revenue', cells: months.map((m) => ({ yearMonth: m, amount: get('SALES', m) === null || get('VARIABLE_COST', m) === null || get('FIXED_COST', m) === null ? null : (get('SALES', m) as number) - (get('VARIABLE_COST', m) as number) - (get('FIXED_COST', m) as number) })) }

  return [...baseRows, contribution, profit]
    .filter((r) => ['SALES', 'VARIABLE_COST', 'CONTRIBUTION_MARGIN', 'FIXED_COST', 'OPERATING_PROFIT'].includes(r.accountCode))
    .sort((a, b) => (accountPriority[a.accountCode] ?? 999) - (accountPriority[b.accountCode] ?? 999))
}
