import type { PlAccountDefinition } from '../model/plAccountDefinitions'

export const sampleDimensions = [
  { key: 'product', name: 'Product', values: ['Product A', 'Product B', 'Product C'] },
  { key: 'customer', name: 'Customer', values: ['ABC Trading', 'XYZ Foods', 'Sakura Retail'] },
  { key: 'channel', name: 'Channel', values: ['Online', 'Store', 'Partner'] },
  { key: 'region', name: 'Region', values: ['Tokyo', 'Osaka', 'Bangkok'] }
]

type Ctx = { month: number; version: 'actual' | 'budget' | 'forecast'; idx: number }

const monthSeasonality = [0.94, 0.96, 0.99, 1.02, 1.05, 1.1]
const versionScale = { actual: 1, budget: 1.04, forecast: 0.98 }
const productSales = [150000, 105000, 70000]
const channelFactor = [1.06, 1, 0.92]
const regionFactor = [1.1, 1, 0.95]

const calc = (v: number) => Math.round(v * 100) / 100

export function buildSampleAccountAmounts(ctx: Ctx) {
  const seasonality = monthSeasonality[ctx.month - 1] ?? 1
  const baseSales = productSales[ctx.idx] * seasonality * versionScale[ctx.version] * channelFactor[ctx.idx] * regionFactor[ctx.idx]

  const returnsRate = [0.035, 0.045, 0.05][ctx.idx]
  const netSales = calc(baseSales)
  const salesReturnsDiscounts = calc(netSales * returnsRate)
  const totalRevenue = calc(netSales - salesReturnsDiscounts)

  const variableRates = [
    { k: 'material_cost', r: 0.2 },
    { k: 'purchase_cost', r: 0.08 },
    { k: 'direct_labor_cost', r: 0.09 },
    { k: 'outsourcing_cost', r: 0.05 },
    { k: 'payment_processing_fee', r: 0.018 },
    { k: 'shipping_fulfillment_cost', r: 0.028 }
  ] as const
  const profileMultiplier = [0.9, 1.2, 1.05][ctx.idx]
  const variable = Object.fromEntries(variableRates.map((x) => [x.k, calc(totalRevenue * x.r * profileMultiplier)])) as Record<string, number>
  const totalVariableCost = calc(Object.values(variable).reduce((s, n) => s + n, 0))
  const grossProfit = calc(totalRevenue - totalVariableCost)
  const contributionMargin = grossProfit

  const fixedRates = [
    { k: 'salaries_wages', r: 0.12 },
    { k: 'rent', r: 0.045 },
    { k: 'utilities', r: 0.012 },
    { k: 'software_subscription', r: 0.008 },
    { k: 'advertising_promotion', r: 0.03 },
    { k: 'travel_transportation', r: 0.01 },
    { k: 'communication_expense', r: 0.006 },
    { k: 'professional_fees', r: 0.008 },
    { k: 'depreciation', r: 0.009 },
    { k: 'other_sga', r: 0.012 }
  ] as const
  const fixed = Object.fromEntries(fixedRates.map((x) => [x.k, calc(totalRevenue * x.r)])) as Record<string, number>
  const totalFixedCost = calc(Object.values(fixed).reduce((s, n) => s + n, 0))
  const totalSga = totalFixedCost
  const operatingProfit = calc(contributionMargin - totalSga)

  return {
    net_sales: netSales,
    sales_returns_discounts: salesReturnsDiscounts,
    total_revenue: totalRevenue,
    ...variable,
    total_variable_cost: totalVariableCost,
    gross_profit: grossProfit,
    contribution_margin: contributionMargin,
    ...fixed,
    total_fixed_cost: totalFixedCost,
    total_sga: totalSga,
    operating_profit: operatingProfit
  }
}

export function orderedRows(defs: PlAccountDefinition[], amountMap: Record<string, number>) {
  return defs.map((d) => ({ ...d, amount: amountMap[d.accountKey] ?? 0 }))
}
