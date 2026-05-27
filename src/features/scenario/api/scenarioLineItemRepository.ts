import { getSupabaseClient } from '../../../infra/supabase/client'
import type { VersionType } from '../../master/model/types'
import type { ScenarioLineItem } from '../model/types'
import { fetchScenarioById } from './scenarioRepository'

type ScenarioLineItemRow = {
  id: string
  owner_user_id: string
  scenario_id: string
  account_id: string
  organization_id: string
  version_id: string
  target_year_month: string
  amount: string | number
  quantity: string | number | null
  unit_price: string | number | null
  note: string | null
  created_at: string
  updated_at: string
  accounts: { id: string; code: string; name: string } | null
  organizations: { id: string; code: string | null; name: string } | null
  versions: { id: string; name: string; version_type: VersionType; is_default: boolean } | null
}

const SELECT_COLUMNS = `
  id, owner_user_id, scenario_id, account_id, organization_id, version_id,
  target_year_month, amount, quantity, unit_price, note, created_at, updated_at,
  accounts(id, code, name),
  organizations(id, code, name),
  versions(id, name, version_type, is_default)
`

const requireUserId = async () => {
  const { data, error } = await getSupabaseClient().auth.getUser()
  if (error) throw new Error(`Failed to read auth user: ${error.message}`)
  if (!data.user) throw new Error('Authentication required')
  return data.user.id
}

const toNumber = (value: string | number | null): number | null => {
  if (value === null) return null
  return Number(value)
}


const normalizeMonthToDate = (value: string | Date): string => {
  if (value instanceof Date) {
    const year = value.getUTCFullYear()
    const month = String(value.getUTCMonth() + 1).padStart(2, '0')
    const day = String(value.getUTCDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const raw = String(value).trim()
  if (/^\d{4}-\d{2}$/.test(raw)) return `${raw}-01`
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw

  const parsed = new Date(raw)
  if (!Number.isNaN(parsed.getTime())) {
    const year = parsed.getUTCFullYear()
    const month = String(parsed.getUTCMonth() + 1).padStart(2, '0')
    const day = String(parsed.getUTCDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  throw new Error(`Invalid targetYearMonth value: ${raw}`)
}

const toModel = (row: ScenarioLineItemRow): ScenarioLineItem => ({
  id: row.id,
  ownerUserId: row.owner_user_id,
  scenarioId: row.scenario_id,
  accountId: row.account_id,
  organizationId: row.organization_id,
  versionId: row.version_id,
  targetYearMonth: row.target_year_month,
  amount: Number(row.amount),
  quantity: toNumber(row.quantity),
  unitPrice: toNumber(row.unit_price),
  note: row.note,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  account: row.accounts ? { id: row.accounts.id, code: row.accounts.code, name: row.accounts.name } : null,
  organization: row.organizations ? { id: row.organizations.id, code: row.organizations.code, name: row.organizations.name } : null,
  version: row.versions
    ? { id: row.versions.id, name: row.versions.name, versionType: row.versions.version_type, isDefault: row.versions.is_default }
    : null,
})

export async function fetchScenarioLineItems(scenarioId: string): Promise<ScenarioLineItem[]> {
  const supabase = getSupabaseClient()
  const ownerUserId = await requireUserId()
  const { data, error } = await supabase
    .from('scenario_line_items')
    .select(SELECT_COLUMNS)
    .eq('scenario_id', scenarioId)
    .eq('owner_user_id', ownerUserId)
    .order('created_at', { ascending: true })

  if (error) throw new Error(`Failed to fetch scenario line items: ${error.message}`)

  return ((data ?? []) as ScenarioLineItemRow[]).map(toModel)
}

export async function ensureScenarioLineItems(scenarioId: string): Promise<void> {
  const existing = await fetchScenarioLineItems(scenarioId)
  if (existing.length > 0) return

  const [scenario, ownerUserId] = await Promise.all([fetchScenarioById(scenarioId), requireUserId()])
  if (!scenario) throw new Error('Scenario not found')

  const supabase = getSupabaseClient()
  const { data: accounts, error: accountsError } = await supabase
    .from('accounts')
    .select('id, code')
    .eq('owner_user_id', ownerUserId)
    .in('code', ['SALES', 'VARIABLE_COST', 'FIXED_COST', 'QUANTITY', 'UNIT_PRICE'])
  if (accountsError) throw new Error(`Failed to fetch accounts: ${accountsError.message}`)

  const accountByCode = new Map((accounts ?? []).map((row: { id: string; code: string }) => [row.code, row.id]))

  const { data: organization, error: orgError } = await supabase
    .from('organizations')
    .select('id')
    .eq('owner_user_id', ownerUserId)
    .eq('code', 'ALL')
    .single<{ id: string }>()
  if (orgError) throw new Error(`Failed to resolve ALL organization: ${orgError.message}`)

  const { data: defaultVersion } = await supabase
    .from('versions')
    .select('id')
    .eq('owner_user_id', ownerUserId)
    .eq('is_default', true)
    .limit(1)
    .maybeSingle<{ id: string }>()

  let versionId = defaultVersion?.id
  if (!versionId) {
    const { data: forecastVersion, error: forecastVersionError } = await supabase
      .from('versions')
      .select('id')
      .eq('owner_user_id', ownerUserId)
      .eq('version_type', 'forecast')
      .order('sort_order', { ascending: true })
      .limit(1)
      .maybeSingle<{ id: string }>()
    if (forecastVersionError) throw new Error(`Failed to resolve forecast version: ${forecastVersionError.message}`)
    versionId = forecastVersion?.id
  }

  if (!versionId) throw new Error('Default/forecast version not found')

  const quantity = scenario.quantity
  const unitPrice = scenario.unitPrice
  const rows = [
    { code: 'SALES', amount: unitPrice * quantity, quantity: null, unit_price: null },
    { code: 'VARIABLE_COST', amount: scenario.variableCostPerUnit * quantity, quantity: null, unit_price: null },
    { code: 'FIXED_COST', amount: scenario.fixedCost, quantity: null, unit_price: null },
    { code: 'QUANTITY', amount: quantity, quantity, unit_price: null },
    { code: 'UNIT_PRICE', amount: unitPrice, quantity: null, unit_price: unitPrice },
  ]

  const missing = rows.map((r) => r.code).filter((code) => !accountByCode.get(code))
  if (missing.length > 0) throw new Error(`Missing account masters: ${missing.join(', ')}`)

  await upsertScenarioLineItems(
    rows.map((row) => ({
      ownerUserId,
      scenarioId,
      accountId: accountByCode.get(row.code)!,
      organizationId: organization.id,
      versionId,
      targetYearMonth: normalizeMonthToDate(scenario.targetYearMonth),
      amount: row.amount,
      quantity: row.quantity,
      unitPrice: row.unit_price,
      note: null,
    })),
  )
}

type ScenarioLineItemUpsertInput = {
  id?: string
  ownerUserId: string
  scenarioId: string
  accountId: string
  organizationId: string
  versionId: string
  targetYearMonth: string
  amount: number
  quantity: number | null
  unitPrice: number | null
  note: string | null
}

export async function upsertScenarioLineItems(items: ScenarioLineItemUpsertInput[]): Promise<void> {
  if (items.length === 0) return
  const supabase = getSupabaseClient()
  const payload = items.map((item) => ({
    ...(item.id ? { id: item.id } : {}),
    owner_user_id: item.ownerUserId,
    scenario_id: item.scenarioId,
    account_id: item.accountId,
    organization_id: item.organizationId,
    version_id: item.versionId,
    target_year_month: normalizeMonthToDate(item.targetYearMonth),
    amount: item.amount,
    quantity: item.quantity,
    unit_price: item.unitPrice,
    note: item.note,
    updated_at: new Date().toISOString(),
  }))

  const { error } = await (supabase.from('scenario_line_items') as any).upsert(payload, {
    onConflict: 'scenario_id,account_id,organization_id,version_id,target_year_month',
  })

  if (error) {
    const details = [error.message, error.details, error.hint].filter(Boolean).join(' | ')
    console.error('Failed to upsert scenario line items', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
      payload,
    })
    throw new Error(`Failed to upsert scenario line items: ${details}`)
  }
}
