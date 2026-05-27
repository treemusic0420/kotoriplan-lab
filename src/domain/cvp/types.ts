export type ScenarioStatus = 'draft' | 'final'

export type ScenarioInput = {
  productName?: string
  name: string
  targetYearMonth: string
  unitPrice: number
  quantity: number
  variableCostPerUnit: number
  fixedCost: number
  tags: string[]
  note?: string
  status: ScenarioStatus
}

export type CvpResult = {
  sales: number
  variableCost: number
  contributionMargin: number
  contributionMarginRatio: number
  operatingProfit: number
  breakEvenSales: number | null
  breakEvenQuantity: number | null
  marginOfSafetyRatio: number
}
