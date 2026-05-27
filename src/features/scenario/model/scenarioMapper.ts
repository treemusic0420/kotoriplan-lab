import type { Scenario, ScenarioFormValues } from '../model/types'

export type ScenarioRow = {
  id: string
  name: string
  product_name: string | null
  target_year_month: string
  unit_price: number | string
  quantity: number | string
  variable_cost_per_unit: number | string
  fixed_cost: number | string
  note: string | null
  status: 'draft' | 'final'
  created_at: string
  updated_at: string
  owner_user_id: string | null
}

const toNumber = (value: string | number): number => Number(value)

export const toMonthInput = (targetYearMonthDate: string): string => targetYearMonthDate.slice(0, 7)

export const toDbTargetYearMonth = (monthValue: string): string => `${monthValue}-01`

export const mapScenarioRowToModel = (row: ScenarioRow): Scenario => ({
  id: row.id,
  name: row.name,
  productName: row.product_name?.trim() || 'General',
  targetYearMonth: toMonthInput(row.target_year_month),
  unitPrice: toNumber(row.unit_price),
  quantity: toNumber(row.quantity),
  variableCostPerUnit: toNumber(row.variable_cost_per_unit),
  fixedCost: toNumber(row.fixed_cost),
  note: row.note ?? '',
  tags: [],
  status: row.status,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
})

export const mapFormToInsertPayload = (values: ScenarioFormValues) => ({
  name: values.name.trim(),
  product_name: values.productName?.trim() ? values.productName.trim() : null,
  target_year_month: toDbTargetYearMonth(values.targetYearMonth),
  unit_price: values.unitPrice,
  quantity: values.quantity,
  variable_cost_per_unit: values.variableCostPerUnit,
  fixed_cost: values.fixedCost,
  note: values.note?.trim() ? values.note.trim() : null,
  status: values.status,
})
