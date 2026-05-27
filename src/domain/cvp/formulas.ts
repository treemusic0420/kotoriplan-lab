import type { CvpResult, ScenarioInput } from './types'

const round = (value: number, digits = 2): number => {
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}

export function calculateCvp(input: Pick<ScenarioInput, 'unitPrice' | 'quantity' | 'variableCostPerUnit' | 'fixedCost'>): CvpResult {
  const sales = input.unitPrice * input.quantity
  const variableCost = input.variableCostPerUnit * input.quantity
  const contributionMargin = sales - variableCost
  const contributionMarginRatio = sales === 0 ? 0 : contributionMargin / sales
  const operatingProfit = contributionMargin - input.fixedCost

  const perUnitContribution = input.unitPrice - input.variableCostPerUnit
  const breakEvenQuantity = perUnitContribution === 0 ? null : input.fixedCost / perUnitContribution
  const breakEvenSales = contributionMarginRatio === 0 ? null : input.fixedCost / contributionMarginRatio

  const marginOfSafetyRatio =
    sales === 0 || breakEvenSales === null ? 0 : (sales - breakEvenSales) / sales

  return {
    sales: round(sales),
    variableCost: round(variableCost),
    contributionMargin: round(contributionMargin),
    contributionMarginRatio: round(contributionMarginRatio, 4),
    operatingProfit: round(operatingProfit),
    breakEvenSales: breakEvenSales === null ? null : round(breakEvenSales),
    breakEvenQuantity: breakEvenQuantity === null ? null : round(breakEvenQuantity, 4),
    marginOfSafetyRatio: round(marginOfSafetyRatio, 4),
  }
}
