import { getSupabaseClient } from '../../../infra/supabase/client'
import type { CompareType } from '../model/types'
import { resolveCompareConfig } from './plFactRepository'

export type PlBridgeFilter = {
  compareType: CompareType
  year: number
  month: number
  organizationKey: string
  analysisDimensionId?: string
  analysisDimensionValueId?: string
}

const req = async () => {
  const { data, error } = await getSupabaseClient().auth.getUser()
  if (error || !data.user) throw new Error(error?.message ?? 'Authentication required')
  return data.user.id
}

const amountByAccount = (rows: any[], version: string) => {
  const map = new Map<string, number>()
  rows.filter((r) => r.version === version).forEach((r) => {
    map.set(r.account_key, (map.get(r.account_key) ?? 0) + Number(r.amount ?? 0))
  })
  return map
}

export async function fetchPlBridge(filters: PlBridgeFilter, userId?: string) {
  const ownerUserId = userId ?? await req()
  const { compareVersion, baseVersion, compareLabel, baseLabel } = resolveCompareConfig(filters.compareType)
  let q: any = getSupabaseClient()
    .from('pl_facts')
    .select('id,account_key,amount,version')
    .eq('owner_user_id', ownerUserId)
    .eq('is_sample', true)
    .eq('organization_key', filters.organizationKey)
    .eq('target_month', `${filters.year}-${String(filters.month).padStart(2, '0')}-01`)
    .in('version', [compareVersion, baseVersion])
    .in('account_key', ['total_revenue', 'total_variable_cost', 'total_sga', 'operating_profit'])

  if (filters.analysisDimensionId) {
    let linkQuery: any = getSupabaseClient()
      .from('pl_fact_dimension_values')
      .select('pl_fact_id')
      .eq('owner_user_id', ownerUserId)
      .eq('is_sample', true)
      .eq('analysis_dimension_id', filters.analysisDimensionId)
    if (filters.analysisDimensionValueId) linkQuery = linkQuery.eq('analysis_dimension_value_id', filters.analysisDimensionValueId)
    const { data: links, error: linkError } = await linkQuery
    if (linkError) throw new Error(linkError.message)
    const ids = Array.from(new Set((links ?? []).map((x: any) => x.pl_fact_id)))
    if (ids.length === 0) return { rawCount: 0, hasBase: false, hasCompare: false, compareLabel, baseLabel }
    q = q.in('id', ids)
  }

  const { data, error } = await q
  if (error) throw new Error(error.message)
  const rows = data ?? []

  const base = amountByAccount(rows, baseVersion)
  const compare = amountByAccount(rows, compareVersion)

  const baseOperatingProfit = base.get('operating_profit') ?? 0
  const compareOperatingProfit = compare.get('operating_profit') ?? 0
  const revenueImpact = (compare.get('total_revenue') ?? 0) - (base.get('total_revenue') ?? 0)
  const variableCostImpact = -((compare.get('total_variable_cost') ?? 0) - (base.get('total_variable_cost') ?? 0))
  const fixedCostImpact = -((compare.get('total_sga') ?? 0) - (base.get('total_sga') ?? 0))
  const calculatedTotalVariance = revenueImpact + variableCostImpact + fixedCostImpact
  const actualTotalVariance = compareOperatingProfit - baseOperatingProfit
  const reconciliationDifference = actualTotalVariance - calculatedTotalVariance

  return {
    compareLabel,
    baseLabel,
    rawCount: rows.length,
    hasBase: rows.some((r: any) => r.version === baseVersion),
    hasCompare: rows.some((r: any) => r.version === compareVersion),
    baseOperatingProfit,
    compareOperatingProfit,
    revenueImpact,
    variableCostImpact,
    fixedCostImpact,
    calculatedTotalVariance,
    actualTotalVariance,
    reconciliationDifference
  }
}
