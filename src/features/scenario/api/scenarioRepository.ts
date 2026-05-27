import { getSupabaseClient } from '../../../infra/supabase/client'
import { mapFormToInsertPayload, mapScenarioRowToModel, type ScenarioRow } from './mappers'
import type { Scenario, ScenarioFormValues, ScenarioListItem } from '../model/types'

const SCENARIO_SELECT =
  'id, name, target_year_month, unit_price, quantity, variable_cost_per_unit, fixed_cost, note, status, created_at, updated_at'

export async function createScenario(values: ScenarioFormValues): Promise<Scenario> {
  const supabase = getSupabaseClient()
  const payload = mapFormToInsertPayload(values)

  const { data, error } = await supabase
    .from('scenarios')
    .insert(payload)
    .select(SCENARIO_SELECT)
    .single<ScenarioRow>()

  if (error) {
    throw new Error(error.message)
  }

  return mapScenarioRowToModel(data)
}

export async function fetchScenarios(): Promise<ScenarioListItem[]> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('scenarios')
    .select(SCENARIO_SELECT)
    .order('created_at', { ascending: false })
    .returns<ScenarioRow[]>()

  if (error) {
    throw new Error(error.message)
  }

  return data.map((row) => mapScenarioRowToModel(row))
}

export async function fetchScenarioById(id: string): Promise<Scenario | null> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase.from('scenarios').select(SCENARIO_SELECT).eq('id', id).maybeSingle<ScenarioRow>()

  if (error) {
    throw new Error(error.message)
  }

  if (!data) {
    return null
  }

  return mapScenarioRowToModel(data)
}
