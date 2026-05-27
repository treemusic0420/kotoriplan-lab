import { getSupabaseClient } from '../../../infra/supabase/client'
import { mapFormToInsertPayload, mapScenarioRowToModel, type ScenarioRow } from './mappers'
import type { Scenario, ScenarioFormValues, ScenarioListItem } from '../model/types'

const SCENARIO_SELECT =
  'id, name, target_year_month, unit_price, quantity, variable_cost_per_unit, fixed_cost, note, status, created_at, updated_at'

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

export async function createScenario(values: ScenarioFormValues): Promise<Scenario> {
  const supabase = getSupabaseClient()
  const payload = mapFormToInsertPayload(values)

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
  const { data, error, status } = await supabase
    .from('scenarios')
    .select(SCENARIO_SELECT)
    .order('created_at', { ascending: false })
    .returns<ScenarioRow[]>()

  if (error) {
    throw new Error(formatSupabaseError('list', status, error))
  }

  return data.map((row) => mapScenarioRowToModel(row))
}

export async function fetchScenarioById(id: string): Promise<Scenario | null> {
  const supabase = getSupabaseClient()
  const { data, error, status } = await supabase.from('scenarios').select(SCENARIO_SELECT).eq('id', id).maybeSingle<ScenarioRow>()

  if (error) {
    throw new Error(formatSupabaseError('get', status, error))
  }

  if (!data) {
    return null
  }

  return mapScenarioRowToModel(data)
}
