import { getSupabaseClient } from '../../../infra/supabase/client'

export type PlRatioFilters = {
  version: 'actual' | 'budget' | 'forecast'
  year: number
  month: string
  organizationKey: string
  analysisDimensionKey: string
  analysisDimensionValueId: string
}

type FactRow = { id: string; account_key: string; amount: number; target_month: string }

const req = async () => {
  const { data, error } = await getSupabaseClient().auth.getUser()
  if (error || !data.user) throw new Error(error?.message ?? 'Authentication required')
  return data.user.id
}

const sumKeys = (rows: FactRow[], key: string) => rows.filter((r) => r.account_key === key).reduce((s, r) => s + Number(r.amount), 0)
const ratio = (n: number, d: number) => (d === 0 ? null : n / d)

function buildMetrics(rows: FactRow[]) {
  const totalRevenue = sumKeys(rows, 'sales')
  const totalVariableCost = sumKeys(rows, 'variable_cost')
  const grossProfit = sumKeys(rows, 'contribution_margin')
  const contributionMargin = grossProfit
  const totalSga = sumKeys(rows, 'fixed_cost')
  const operatingProfit = sumKeys(rows, 'operating_profit')
  return {
    totalRevenue, totalVariableCost, grossProfit, contributionMargin, totalSga, operatingProfit,
    grossMarginPct: ratio(grossProfit, totalRevenue),
    contributionMarginPct: ratio(contributionMargin, totalRevenue),
    variableCostRatio: ratio(totalVariableCost, totalRevenue),
    sgaRatio: ratio(totalSga, totalRevenue),
    operatingMarginPct: ratio(operatingProfit, totalRevenue)
  }
}

async function resolveDimensionId(ownerUserId: string, analysisDimensionKey: string) {
  if (analysisDimensionKey === 'all') return null
  const { data, error } = await getSupabaseClient().from('analysis_dimensions').select('id,key').eq('owner_user_id', ownerUserId)
  if (error) throw new Error(`Failed to load analysis dimensions: ${error.message}`)
  const matched = ((data ?? []) as any[]).find((d: any) => String(d.key).toLowerCase() === analysisDimensionKey)
  return matched?.id ?? null
}

async function fetchFacts(filters: PlRatioFilters, ownerUserId: string) {
  let q: any = getSupabaseClient().from('pl_facts').select('id,account_key,amount,target_month').eq('owner_user_id', ownerUserId).eq('is_sample', true).eq('version', filters.version).eq('organization_key', filters.organizationKey)

  if (filters.month === 'all') q = q.gte('target_month', `${filters.year}-01-01`).lte('target_month', `${filters.year}-12-31`)
  else q = q.eq('target_month', `${filters.month}-01`)

  const dimId = await resolveDimensionId(ownerUserId, filters.analysisDimensionKey)
  if (dimId) {
    let linkQuery: any = getSupabaseClient().from('pl_fact_dimension_values').select('pl_fact_id').eq('owner_user_id', ownerUserId).eq('analysis_dimension_id', dimId)
    if (filters.analysisDimensionValueId !== 'all') linkQuery = linkQuery.eq('analysis_dimension_value_id', filters.analysisDimensionValueId)
    const { data: links, error: linkError } = await linkQuery
    if (linkError) throw new Error(`Failed to load ratio dimension filters: ${linkError.message}`)
    const ids = Array.from(new Set((links ?? []).map((x: any) => x.pl_fact_id)))
    if (ids.length === 0) return []
    q = q.in('id', ids)
  }

  const { data, error } = await q
  if (error) throw new Error(`Failed to load ratio facts: ${error.message}`)
  return (data ?? []) as FactRow[]
}

export async function fetchPlRatios(filters: PlRatioFilters) {
  const userId = await req()
  const rows = await fetchFacts(filters, userId)
  return { rowCount: rows.length, ...buildMetrics(rows) }
}

export async function fetchPlRatioTrend(filters: PlRatioFilters) {
  const userId = await req()
  const rows = await fetchFacts({ ...filters, month: 'all' }, userId)
  const grouped = new Map<string, FactRow[]>()
  for (const row of rows) {
    const ym = row.target_month.slice(0, 7)
    grouped.set(ym, [...(grouped.get(ym) ?? []), row])
  }
  return Array.from(grouped.keys()).sort().map((month) => ({ month, ...buildMetrics(grouped.get(month) ?? []) }))
}

export async function fetchPlRatioRanking(filters: PlRatioFilters) {
  const userId = await req()
  const dimId = await resolveDimensionId(userId, filters.analysisDimensionKey)
  if (!dimId) return []

  let linkQuery: any = getSupabaseClient().from('pl_fact_dimension_values').select('pl_fact_id,analysis_dimension_value_id,analysis_dimension_values(name)').eq('owner_user_id', userId).eq('analysis_dimension_id', dimId)
  if (filters.analysisDimensionValueId !== 'all') linkQuery = linkQuery.eq('analysis_dimension_value_id', filters.analysisDimensionValueId)
  const { data: links, error: linksError } = await linkQuery
  if (linksError) throw new Error(`Failed to load ratio ranking: ${linksError.message}`)
  const linkRows = (links ?? []) as any[]
  if (linkRows.length === 0) return []

  const facts = await fetchFacts(filters, userId)
  const factMap = new Map(facts.map((f) => [f.id, f]))
  const byValue = new Map<string, { name: string; rows: FactRow[] }>()
  for (const l of linkRows) {
    const fact = factMap.get(l.pl_fact_id)
    if (!fact) continue
    const id = l.analysis_dimension_value_id
    const name = l.analysis_dimension_values?.name ?? 'Unknown'
    const current: { name: string; rows: FactRow[] } = byValue.get(id) ?? { name, rows: [] as FactRow[] }
    current.rows.push(fact)
    byValue.set(id, current)
  }

  return Array.from(byValue.entries()).map(([id, v]) => ({ dimensionValueId: id, dimensionValueName: v.name, ...buildMetrics(v.rows) })).sort((a, b) => (b.operatingMarginPct ?? -999) - (a.operatingMarginPct ?? -999))
}
