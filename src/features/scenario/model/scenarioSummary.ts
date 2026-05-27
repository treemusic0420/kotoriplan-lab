import { calculateCvp } from '../../../domain/cvp/formulas'
import type { ScenarioListItem } from './types'

export type ScenarioSummary = {
  totalScenarios: number
  bestOperatingProfit: { name: string; value: number } | null
  worstOperatingProfit: { name: string; value: number } | null
  averageContributionMarginRatio: number | null
  latestScenario: { name: string; targetYearMonth: string } | null
  draftCount: number
  finalCount: number
}

export function calculateScenarioSummary(items: ScenarioListItem[]): ScenarioSummary {
  if (items.length === 0) return { totalScenarios: 0, bestOperatingProfit: null, worstOperatingProfit: null, averageContributionMarginRatio: null, latestScenario: null, draftCount: 0, finalCount: 0 }

  const metrics = items.map((s) => ({ s, cvp: calculateCvp(s) }))
  const byProfit = [...metrics].sort((a, b) => b.cvp.operatingProfit - a.cvp.operatingProfit)
  const avgCmr = metrics.reduce((acc, m) => acc + m.cvp.contributionMarginRatio, 0) / metrics.length
  const latest = [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]

  return {
    totalScenarios: items.length,
    bestOperatingProfit: { name: byProfit[0].s.name, value: byProfit[0].cvp.operatingProfit },
    worstOperatingProfit: { name: byProfit[byProfit.length - 1].s.name, value: byProfit[byProfit.length - 1].cvp.operatingProfit },
    averageContributionMarginRatio: avgCmr,
    latestScenario: { name: latest.name, targetYearMonth: latest.targetYearMonth },
    draftCount: items.filter((i) => i.status === 'draft').length,
    finalCount: items.filter((i) => i.status === 'final').length,
  }
}
