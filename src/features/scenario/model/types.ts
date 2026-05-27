import type { ScenarioInput, ScenarioStatus } from '../../../domain/cvp/types'
import type { VersionType } from '../../master/model/types'

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

export type ScenarioLineItem = {
  id: string
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
  createdAt: string
  updatedAt: string
  account: { id: string; code: string; name: string } | null
  organization: { id: string; code: string | null; name: string } | null
  version: { id: string; name: string; versionType: VersionType; isDefault: boolean } | null
}

export const SCENARIO_STATUS_OPTIONS: ScenarioStatus[] = ['draft', 'final']
