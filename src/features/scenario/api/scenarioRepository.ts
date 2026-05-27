import { getSupabaseClient } from '../../../infra/supabase/client'
import { mapFormToInsertPayload, mapScenarioRowToModel, type ScenarioRow } from '../model/scenarioMapper'
import type { FixedCostInputItem, FixedCostItem, Scenario, ScenarioFormValues, ScenarioListItem } from '../model/types'
import { ensureScenarioLineItems, deleteScenarioLineItemsByScenarioId } from './scenarioLineItemRepository'

const SCENARIO_SELECT =
  'id, product_name, name, target_year_month, unit_price, quantity, variable_cost_per_unit, fixed_cost, note, status, created_at, updated_at, owner_user_id'

type FixedCostItemRow = {
  id: string
  scenario_id: string
  owner_user_id: string
  name: string
  amount: number | string
  sort_order: number
  created_at: string
  updated_at: string
}

const formatSupabaseError = (
  operation: string,
  status: number,
  error: { message: string; code?: string; details?: string | null },
) => `Supabase ${operation} failed (status ${status}): ${error.message}`

export const requireUserId = async () => {
  const { data, error } = await getSupabaseClient().auth.getUser()
  if (error) throw new Error(`Failed to read auth user: ${error.message}`)
  if (!data.user) throw new Error('Authentication required')
  return data.user.id
}

const sumFixedCostItems = (items: FixedCostInputItem[]) => items.reduce((acc, item) => acc + (Number.isFinite(item.amount) ? item.amount : 0), 0)

const sanitizeFixedCostInputItems = (items?: FixedCostInputItem[]) =>
  (items ?? [])
    .map((item, idx) => ({ name: item.name.trim(), amount: Number(item.amount), sortOrder: item.sortOrder ?? idx }))
    .filter((item) => item.name.length > 0)

const mapFixedCostRow = (row: FixedCostItemRow): FixedCostItem => ({
  id: row.id,
  scenarioId: row.scenario_id,
  ownerUserId: row.owner_user_id,
  name: row.name,
  amount: Number(row.amount),
  sortOrder: row.sort_order,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
})

export function calculateFixedCostTotal(scenario: Pick<Scenario, 'fixedCost' | 'fixedCostItems'>): number {
  if (scenario.fixedCostItems && scenario.fixedCostItems.length > 0) return scenario.fixedCostItems.reduce((acc, item) => acc + item.amount, 0)
  return scenario.fixedCost
}

async function fetchFixedCostTotalsByScenarioIds(scenarioIds: string[], userId: string): Promise<Map<string, number>> {
  if (scenarioIds.length === 0) return new Map()
  const { data, error, status } = await getSupabaseClient()
    .from('fixed_cost_items')
    .select('scenario_id, amount')
    .eq('owner_user_id', userId)
    .in('scenario_id', scenarioIds)
    .returns<Array<{ scenario_id: string; amount: number | string }>>()
  if (error) throw new Error(formatSupabaseError('fixed_cost_items list', status, error))
  const totals = new Map<string, number>()
  for (const row of data ?? []) totals.set(row.scenario_id, (totals.get(row.scenario_id) ?? 0) + Number(row.amount))
  return totals
}

export async function listFixedCostItems(scenarioId: string, userId: string): Promise<FixedCostItem[]> {
  const { data, error, status } = await getSupabaseClient().from('fixed_cost_items').select('*').eq('scenario_id', scenarioId).eq('owner_user_id', userId).order('sort_order', { ascending: true }).returns<FixedCostItemRow[]>()
  if (error) throw new Error(formatSupabaseError('fixed_cost_items list', status, error))
  return (data ?? []).map(mapFixedCostRow)
}

export async function deleteFixedCostItems(scenarioId: string, userId: string): Promise<void> {
  const { error, status } = await getSupabaseClient().from('fixed_cost_items').delete().eq('scenario_id', scenarioId).eq('owner_user_id', userId)
  if (error) throw new Error(formatSupabaseError('fixed_cost_items delete', status, error))
}

export async function upsertFixedCostItems(scenarioId: string, items: FixedCostInputItem[], userId: string): Promise<FixedCostItem[]> {
  await deleteFixedCostItems(scenarioId, userId)
  if (items.length === 0) return []
  const payload = items.map((item) => ({ scenario_id: scenarioId, owner_user_id: userId, name: item.name, amount: item.amount, sort_order: item.sortOrder }))
  const { data, error, status } = await (getSupabaseClient().from('fixed_cost_items') as any).insert(payload).select('*')
  if (error) throw new Error(formatSupabaseError('fixed_cost_items insert', status, error))
  return ((data ?? []) as FixedCostItemRow[]).map(mapFixedCostRow)
}

export async function duplicateFixedCostItems(sourceScenarioId: string, newScenarioId: string, userId: string): Promise<void> {
  const source = await listFixedCostItems(sourceScenarioId, userId)
  if (source.length === 0) return
  const payload = source.map((item) => ({ name: item.name, amount: item.amount, sortOrder: item.sortOrder }))
  await upsertFixedCostItems(newScenarioId, payload, userId)
}

export async function listScenarios(userId: string): Promise<Scenario[]> {
  const supabase = getSupabaseClient()
  const { data, error, status } = await supabase
    .from('scenarios')
    .select(SCENARIO_SELECT)
    .eq('owner_user_id', userId)
    .order('created_at', { ascending: false })
    .returns<ScenarioRow[]>()
  if (error) throw new Error(formatSupabaseError('list', status, error))
  const scenarios = data.map(mapScenarioRowToModel)
  const totals = await fetchFixedCostTotalsByScenarioIds(scenarios.map((s) => s.id), userId)
  return scenarios.map((s) => ({ ...s, fixedCost: totals.has(s.id) ? totals.get(s.id)! : s.fixedCost }))
}

export async function getScenario(id: string, userId: string): Promise<Scenario | null> {
  const { data, error, status } = await getSupabaseClient()
    .from('scenarios')
    .select(SCENARIO_SELECT)
    .eq('id', id)
    .eq('owner_user_id', userId)
    .maybeSingle<ScenarioRow>()
  if (error) throw new Error(formatSupabaseError('get', status, error))
  if (!data) return null
  const mapped = mapScenarioRowToModel(data)
  const fixedCostItems = await listFixedCostItems(id, userId)
  return { ...mapped, fixedCostItems, fixedCost: fixedCostItems.length > 0 ? fixedCostItems.reduce((a, b) => a + b.amount, 0) : mapped.fixedCost }
}

export async function createScenario(input: ScenarioFormValues, userId?: string): Promise<Scenario> {
  const ownerUserId = userId ?? (await requireUserId())
  const sanitizedItems = sanitizeFixedCostInputItems(input.fixedCostItems)
  const computedFixedCost = sanitizedItems.length > 0 ? sumFixedCostItems(sanitizedItems) : input.fixedCost
  const payload = { ...mapFormToInsertPayload({ ...input, fixedCost: computedFixedCost }), owner_user_id: ownerUserId }
  const { data, error, status } = await (getSupabaseClient().from('scenarios') as any).insert(payload).select(SCENARIO_SELECT).single()
  if (error) throw new Error(formatSupabaseError('insert', status, error))
  const created = mapScenarioRowToModel(data as ScenarioRow)
  const fixedCostItems = await upsertFixedCostItems(created.id, sanitizedItems, ownerUserId)
  await ensureScenarioLineItems(created.id)
  return { ...created, fixedCostItems, fixedCost: fixedCostItems.length > 0 ? sumFixedCostItems(sanitizedItems) : created.fixedCost }
}

export async function updateScenario(id: string, input: ScenarioFormValues, userId?: string): Promise<Scenario> {
  const ownerUserId = userId ?? (await requireUserId())
  const sanitizedItems = sanitizeFixedCostInputItems(input.fixedCostItems)
  const computedFixedCost = sanitizedItems.length > 0 ? sumFixedCostItems(sanitizedItems) : input.fixedCost
  const payload = mapFormToInsertPayload({ ...input, fixedCost: computedFixedCost })
  const { data, error, status } = await (getSupabaseClient().from('scenarios') as any)
    .update(payload)
    .eq('id', id)
    .eq('owner_user_id', ownerUserId)
    .select(SCENARIO_SELECT)
    .single()
  if (error) throw new Error(formatSupabaseError('update', status, error))
  const fixedCostItems = await upsertFixedCostItems(id, sanitizedItems, ownerUserId)
  await ensureScenarioLineItems(id, computedFixedCost)
  return { ...mapScenarioRowToModel(data as ScenarioRow), fixedCostItems, fixedCost: computedFixedCost }
}

export async function deleteScenario(id: string, userId?: string): Promise<void> {
  const ownerUserId = userId ?? (await requireUserId())
  await deleteScenarioLineItemsByScenarioId(id, ownerUserId)
  const { error, status } = await getSupabaseClient().from('scenarios').delete().eq('id', id).eq('owner_user_id', ownerUserId)
  if (error) throw new Error(formatSupabaseError('delete', status, error))
}

export async function duplicateScenario(id: string, userId?: string): Promise<Scenario> {
  const ownerUserId = userId ?? (await requireUserId())
  const source = await getScenario(id, ownerUserId)
  if (!source) throw new Error('Scenario not found')
  const created = await createScenario({
    ...source,
    name: `${source.name} Copy`,
    status: 'draft',
    fixedCostItems: (source.fixedCostItems ?? []).map((item) => ({ name: item.name, amount: item.amount, sortOrder: item.sortOrder })),
  }, ownerUserId)
  await duplicateFixedCostItems(source.id, created.id, ownerUserId)
  await ensureScenarioLineItems(created.id, created.fixedCost)
  return created
}

export async function fetchScenarios(): Promise<ScenarioListItem[]> { return listScenarios(await requireUserId()) }
export async function fetchScenarioById(id: string): Promise<Scenario | null> { return getScenario(id, await requireUserId()) }
export async function fetchScenariosForCompare(): Promise<Scenario[]> { return listScenarios(await requireUserId()) }
