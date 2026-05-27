import { getSupabaseClient } from '../../../infra/supabase/client'
import type { CompareType } from '../model/types'

export type VarianceAnalysisAxis = 'product' | 'customer' | 'channel' | 'region' | 'all_axes'

export type VarianceDriverFilter = {
  compareType: CompareType
  year: number
  month: number
  metricAccountKey: string
  analysisAxis: VarianceAnalysisAxis
}

type DriverRow = {
  axisKey: 'product' | 'customer' | 'channel' | 'region'
  axisName: string
  valueId: string
  valueName: string
  compareAmount: number
  baseAmount: number
  variance: number
  varianceRate: number | null
  fu: 'F' | 'U' | '—'
}

const AXIS_ORDER: Array<{ key: DriverRow['axisKey']; name: string }> = [
  { key: 'product', name: 'Product' },
  { key: 'customer', name: 'Customer' },
  { key: 'channel', name: 'Channel' },
  { key: 'region', name: 'Region' }
]

const FAVORABLE_WHEN_HIGHER = new Set(['total_revenue', 'gross_profit', 'contribution_margin', 'operating_profit'])

const requireUserId = async () => {
  const { data, error } = await getSupabaseClient().auth.getUser()
  if (error || !data.user) throw new Error(error?.message ?? 'Authentication required')
  return data.user.id
}

const versionsForCompare = (compareType: CompareType) => {
  if (compareType === 'actual_vs_forecast') return { compareVersion: 'actual', baseVersion: 'forecast', compareLabel: 'Actual', baseLabel: 'Forecast' }
  if (compareType === 'forecast_vs_budget') return { compareVersion: 'forecast', baseVersion: 'budget', compareLabel: 'Forecast', baseLabel: 'Budget' }
  return { compareVersion: 'actual', baseVersion: 'budget', compareLabel: 'Actual', baseLabel: 'Budget' }
}

const calcFu = (metricKey: string, variance: number): DriverRow['fu'] => {
  if (variance === 0) return '—'
  if (FAVORABLE_WHEN_HIGHER.has(metricKey)) return variance > 0 ? 'F' : 'U'
  return variance < 0 ? 'F' : 'U'
}

export async function fetchVarianceDrivers(filters: VarianceDriverFilter) {
  const ownerUserId = await requireUserId()
  const { compareVersion, baseVersion, compareLabel, baseLabel } = versionsForCompare(filters.compareType)
  const month = `${filters.year}-${String(filters.month).padStart(2, '0')}-01`

  const axisKeys = filters.analysisAxis === 'all_axes' ? AXIS_ORDER.map((x) => x.key) : [filters.analysisAxis]

  const { data: dimensions, error: dimError } = await getSupabaseClient()
    .from('analysis_dimensions')
    .select('id,key,name')
    .eq('owner_user_id', ownerUserId)
    .in('key', axisKeys)
  if (dimError) throw new Error(`Failed to load dimensions: ${dimError.message}`)
  const dimById = new Map((dimensions ?? []).map((d: any) => [d.id, d]))
  const dimIds = Array.from(dimById.keys())
  if (dimIds.length === 0) return { rows: [], topFavorable: [], topUnfavorable: [], summary: null, compareLabel, baseLabel, rawCount: 0 }

  const { data, error } = await getSupabaseClient()
    .from('pl_fact_dimension_values')
    .select('analysis_dimension_id,analysis_dimension_value_id,analysis_dimension_values(name),pl_facts!inner(id,account_key,version,amount)')
    .eq('owner_user_id', ownerUserId)
    .eq('is_sample', true)
    .in('analysis_dimension_id', dimIds)
    .eq('pl_facts.owner_user_id', ownerUserId)
    .eq('pl_facts.is_sample', true)
    .eq('pl_facts.account_key', filters.metricAccountKey)
    .eq('pl_facts.target_month', month)
    .in('pl_facts.version', [compareVersion, baseVersion])
  if (error) throw new Error(`Failed to load variance drivers: ${error.message}`)

  const grouped = new Map<string, DriverRow>()
  for (const row of data ?? []) {
    const dim: any = dimById.get((row as any).analysis_dimension_id)
    const axisKey = (dim?.key ?? '') as DriverRow['axisKey']
    if (!axisKey) continue
    const axisName = dim.name ?? axisKey
    const valueId = String((row as any).analysis_dimension_value_id)
    const valueName = String((row as any).analysis_dimension_values?.name ?? 'Unknown')
    const key = `${axisKey}::${valueId}`
    const existing = grouped.get(key) ?? { axisKey, axisName, valueId, valueName, compareAmount: 0, baseAmount: 0, variance: 0, varianceRate: 0, fu: '—' }
    const fact: any = (row as any).pl_facts
    const amount = Number(fact?.amount ?? 0)
    if (fact?.version === compareVersion) existing.compareAmount += amount
    if (fact?.version === baseVersion) existing.baseAmount += amount
    grouped.set(key, existing)
  }

  const rows: DriverRow[] = Array.from(grouped.values()).map((r) => {
    const variance = r.compareAmount - r.baseAmount
    const varianceRate = r.baseAmount !== 0 ? variance / Math.abs(r.baseAmount) : r.compareAmount === 0 ? 0 : null
    return { ...r, variance, varianceRate, fu: calcFu(filters.metricAccountKey, variance) }
  })

  const topUnfavorable = rows
    .filter((r) => r.fu === 'U')
    .sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance))
    .slice(0, 10)
  const topFavorable = rows
    .filter((r) => r.fu === 'F')
    .sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance))
    .slice(0, 10)

  const selectedMetricVariance = rows.reduce((sum, r) => sum + r.variance, 0)
  const biggestUnfavorable = topUnfavorable[0] ?? null
  const biggestFavorable = topFavorable[0] ?? null

  return {
    rows: rows.sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance)),
    topUnfavorable,
    topFavorable,
    compareLabel,
    baseLabel,
    rawCount: (data ?? []).length,
    summary: {
      selectedMetricVariance,
      biggestUnfavorable,
      biggestFavorable,
      unfavorableDriverCount: rows.filter((r) => r.fu === 'U').length
    }
  }
}
