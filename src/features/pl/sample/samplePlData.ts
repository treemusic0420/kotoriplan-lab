import type { PlAccountDefinition } from '../model/plAccountDefinitions'

export const sampleDimensions = [
  { key: 'product', name: 'Product', values: ['Product A', 'Product B', 'Product C'] },
  { key: 'customer', name: 'Customer', values: ['ABC Trading', 'XYZ Foods', 'Sakura Retail'] },
  { key: 'channel', name: 'Channel', values: ['Online', 'Store', 'Partner'] },
  { key: 'region', name: 'Region', values: ['Tokyo', 'Osaka', 'Bangkok'] }
]

type Version = 'actual' | 'budget' | 'forecast'
type Ctx = { month: number; version: Version; idx: number }

const calc = (v: number) => Math.round(v * 100) / 100
const monthSeasonality = [0.95, 0.97, 1.0, 1.03, 1.06, 1.1]

// idx is shared across Product/Customer/Channel/Region in this sample dataset.
// 0 => Product A / ABC Trading / Online / Tokyo
// 1 => Product B / XYZ Foods / Store / Osaka
// 2 => Product C / Sakura Retail / Partner / Bangkok
const planProfile = [
  { baseSales: 190_000, returnsRate: 0.028, variableMult: 0.92, fixedMult: 0.94 },
  { baseSales: 160_000, returnsRate: 0.04, variableMult: 1.03, fixedMult: 1.0 },
  { baseSales: 120_000, returnsRate: 0.048, variableMult: 1.08, fixedMult: 1.12 }
] as const

const actualDelta = [
  { sales: 1.08, returnsBps: -0.004, variableMult: -0.03, fixedMult: -0.02 },
  { sales: 0.92, returnsBps: +0.007, variableMult: +0.09, fixedMult: +0.06 },
  { sales: 0.99, returnsBps: +0.001, variableMult: -0.04, fixedMult: +0.08 }
] as const

const forecastBlend = [
  { salesVsBudget: 1.05, returnsBps: -0.003, variableMult: -0.02, fixedMult: -0.01 },
  { salesVsBudget: 0.96, returnsBps: +0.004, variableMult: +0.05, fixedMult: +0.03 },
  { salesVsBudget: 1.01, returnsBps: 0, variableMult: -0.02, fixedMult: +0.03 }
] as const

function resolveProfile(ctx: Ctx) {
  const p = planProfile[ctx.idx]
  if (ctx.version === 'budget') return p
  if (ctx.version === 'actual') {
    const d = actualDelta[ctx.idx]
    return {
      baseSales: p.baseSales * d.sales,
      returnsRate: p.returnsRate + d.returnsBps,
      variableMult: p.variableMult * (1 + d.variableMult),
      fixedMult: p.fixedMult * (1 + d.fixedMult)
    }
  }
  const f = forecastBlend[ctx.idx]
  return {
    baseSales: p.baseSales * f.salesVsBudget,
    returnsRate: p.returnsRate + f.returnsBps,
    variableMult: p.variableMult * (1 + f.variableMult),
    fixedMult: p.fixedMult * (1 + f.fixedMult)
  }
}

export function buildSampleAccountAmounts(ctx: Ctx) {
  const profile = resolveProfile(ctx)
  const seasonality = monthSeasonality[ctx.month - 1] ?? 1
  const netSales = calc(profile.baseSales * seasonality)
  const salesReturnsDiscounts = calc(netSales * profile.returnsRate)
  const totalRevenue = calc(netSales - salesReturnsDiscounts)

  const variableRates = [
    { k: 'material_cost', r: 0.21 },
    { k: 'purchase_cost', r: 0.085 },
    { k: 'direct_labor_cost', r: 0.092 },
    { k: 'outsourcing_cost', r: 0.052 },
    { k: 'payment_processing_fee', r: 0.02 },
    { k: 'shipping_fulfillment_cost', r: 0.031 }
  ] as const
  const variable = Object.fromEntries(variableRates.map((x) => [x.k, calc(totalRevenue * x.r * profile.variableMult)])) as Record<string, number>
  const totalVariableCost = calc(Object.values(variable).reduce((s, n) => s + n, 0))
  const grossProfit = calc(totalRevenue - totalVariableCost)
  const contributionMargin = grossProfit

  const fixedRates = [
    { k: 'salaries_wages', r: 0.11 },
    { k: 'rent', r: 0.042 },
    { k: 'utilities', r: 0.013 },
    { k: 'software_subscription', r: 0.009 },
    { k: 'advertising_promotion', r: 0.028 },
    { k: 'travel_transportation', r: 0.011 },
    { k: 'communication_expense', r: 0.006 },
    { k: 'professional_fees', r: 0.009 },
    { k: 'depreciation', r: 0.011 },
    { k: 'other_sga', r: 0.012 }
  ] as const
  const fixed = Object.fromEntries(fixedRates.map((x) => [x.k, calc(totalRevenue * x.r * profile.fixedMult)])) as Record<string, number>
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
