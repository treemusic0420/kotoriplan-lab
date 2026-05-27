import type { ScenarioInput, ScenarioStatus } from '../../../domain/cvp/types'

export type Scenario = ScenarioInput & {
  id: string
  createdAt: string
  updatedAt: string
}

export type ScenarioListItem = Pick<
  Scenario,
  'id' | 'name' | 'targetYearMonth' | 'unitPrice' | 'quantity' | 'fixedCost' | 'status' | 'createdAt'
>

export type ScenarioFormValues = Omit<ScenarioInput, 'targetYearMonth' | 'tags'> & {
  targetYearMonth: string
}

export const SCENARIO_STATUS_OPTIONS: ScenarioStatus[] = ['draft', 'final']
