import { getSupabaseClient } from '../../../infra/supabase/client'
import { mapFormToInsertPayload, mapScenarioRowToModel, type ScenarioRow } from './mappers'
import type { Scenario, ScenarioFormValues, ScenarioListItem } from '../model/types'

const SCENARIO_SELECT =
  'id, name, target_year_month, unit_price, quantity, variable_cost_per_unit, fixed_cost, note, status, created_at, updated_at, owner_user_id'

const formatSupabaseError = (
  operation: string,
  status: number,
  error: { message: string; code?: string; details?: string | null },
) => {
  const details = [
    `operation=${operation}`,
    `status=${status}`,
    `message=${error.message}`,
    error.code ? `code=${error.code}` : null,
    error.details ? `details=${error.details}` : null,
  ]
    .filter(Boolean)
    .join(', ')

  console.error('[supabase] request failed', details)
  return `Supabase ${operation} failed (status ${status}): ${error.message}`
}

const requireUserId = async () => {
  const { data, error } = await getSupabaseClient().auth.getUser()
  if (error) throw new Error(`Failed to read auth user: ${error.message}`)
  if (!data.user) throw new Error('Authentication required')
  return data.user.id
}

export async function createScenario(values: ScenarioFormValues): Promise<Scenario> {
  const supabase = getSupabaseClient()
  const ownerUserId = await requireUserId()
  const payload = { ...mapFormToInsertPayload(values), owner_user_id: ownerUserId }

  const { data, error, status } = await (supabase.from('scenarios') as any)
    .insert(payload)
    .select(SCENARIO_SELECT)
    .single()

  if (error) {
    throw new Error(formatSupabaseError('insert', status, error))
  }

  return mapScenarioRowToModel(data as ScenarioRow)
}

export async function fetchScenarios(): Promise<ScenarioListItem[]> {
  const supabase = getSupabaseClient()
  const ownerUserId = await requireUserId()
  const { data, error, status } = await supabase
    .from('scenarios')
    .select(SCENARIO_SELECT)
    .eq('owner_user_id', ownerUserId)
    .order('created_at', { ascending: false })
    .returns<ScenarioRow[]>()

  if (error) {
    throw new Error(formatSupabaseError('list', status, error))
  }

  return data.map((row) => mapScenarioRowToModel(row))
}

export async function fetchScenarioById(id: string): Promise<Scenario | null> {
  const supabase = getSupabaseClient()
  const ownerUserId = await requireUserId()
  const { data, error, status } = await supabase
    .from('scenarios')
    .select(SCENARIO_SELECT)
    .eq('id', id)
    .eq('owner_user_id', ownerUserId)
    .maybeSingle<ScenarioRow>()

  if (error) {
    throw new Error(formatSupabaseError('get', status, error))
  }

  if (!data) {
    return null
  }

  return mapScenarioRowToModel(data)
}

export async function fetchScenariosForCompare(): Promise<Scenario[]> {
  const supabase = getSupabaseClient()
  const ownerUserId = await requireUserId()
  const { data, error, status } = await supabase
    .from('scenarios')
    .select(SCENARIO_SELECT)
    .eq('owner_user_id', ownerUserId)
    .order('created_at', { ascending: false })
    .returns<ScenarioRow[]>()

  if (error) {
    throw new Error(formatSupabaseError('list for compare', status, error))
  }

  return data.map((row) => mapScenarioRowToModel(row))
}
