import { getSupabaseClient } from '../../../infra/supabase/client'
import { PL_ACCOUNT_BY_KEY, STANDARD_PL_ACCOUNTS } from '../model/plAccountDefinitions'
import type { CompareType, PlByDimensionFilter, PlVarianceFilter, SamplePlFilter } from '../model/types'
import { buildSampleAccountAmounts, orderedRows, sampleDimensions } from '../sample/samplePlData'

const req = async () => {
  const { data, error } = await getSupabaseClient().auth.getUser()
  if (error || !data.user) throw new Error(error?.message ?? 'Authentication required')
  return data.user.id
}

const REQUIRED_SAMPLE_ACCOUNTS = new Set(STANDARD_PL_ACCOUNTS.map((a) => a.accountKey))

export async function inspectSamplePlData() {
  const u = await req()
  const { data, error } = await getSupabaseClient()
    .from('pl_facts')
    .select('id,owner_user_id,version,target_month,account_key,amount,is_sample,created_at')
    .eq('owner_user_id', u)
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  const rows = data ?? []
  const sampleRows = rows.filter((r: any) => Boolean(r.is_sample))
  return {
    userId: u,
    factCount: sampleRows.length,
    firstRows: sampleRows.slice(0, 5),
    versions: Array.from(new Set(sampleRows.map((r: any) => String(r.version)))),
    accountKeys: Array.from(new Set(sampleRows.map((r: any) => String(r.account_key)))),
    targetMonths: Array.from(new Set(sampleRows.map((r: any) => String(r.target_month).slice(0, 10))))
  }
}

export async function hasSamplePlData() {
  const summary = await inspectSamplePlData()
  const accountSet = new Set(summary.accountKeys)
  const hasAllAccounts = Array.from(REQUIRED_SAMPLE_ACCOUNTS).every((key) => accountSet.has(key))
  const hasRequiredVersions = ['actual', 'budget', 'forecast'].every((v) => summary.versions.includes(v))
  const hasFirstHalf2026 = ['2026-01-01', '2026-02-01', '2026-03-01', '2026-04-01', '2026-05-01', '2026-06-01'].every((m) => summary.targetMonths.includes(m))
  return summary.factCount > 0 && hasAllAccounts && hasRequiredVersions && hasFirstHalf2026
}

export async function resetSamplePlData() {
  const u = await req()
  const supabase = getSupabaseClient()
  const { error: linkDeleteError } = await supabase.from('pl_fact_dimension_values').delete().eq('owner_user_id', u).eq('is_sample', true)
  if (linkDeleteError) throw new Error(`Failed to delete sample PL dimension links: ${linkDeleteError.message}`)
  const { error: factDeleteError } = await supabase.from('pl_facts').delete().eq('owner_user_id', u).eq('is_sample', true)
  if (factDeleteError) throw new Error(`Failed to delete sample PL facts: ${factDeleteError.message}`)
  const { error: valueDeleteError } = await supabase.from('analysis_dimension_values').delete().eq('owner_user_id', u).eq('is_sample', true)
  if (valueDeleteError) throw new Error(`Failed to delete sample dimension values: ${valueDeleteError.message}`)
  const { error: dimensionDeleteError } = await supabase.from('analysis_dimensions').delete().eq('owner_user_id', u).eq('is_sample', true)
  if (dimensionDeleteError) throw new Error(`Failed to delete sample dimensions: ${dimensionDeleteError.message}`)
  return loadSamplePlData()
}

function requireDimension(dimensions: any[], key: string) {
  const normalized = key.trim().toLowerCase()
  const found = dimensions.find((d: any) => String(d.key ?? '').trim().toLowerCase() === normalized)
  if (!found?.id) throw new Error(`Sample dimension not found: ${normalized}`)
  return found
}

function requireDimensionValue(values: any[], name: string) {
  const normalized = name.trim().toLowerCase()
  const found = values.find((v: any) => String(v.name ?? '').trim().toLowerCase() === normalized)
  if (!found?.id) throw new Error(`Sample dimension value not found: ${name}`)
  return found
}

async function ensureSampleDimensions(userId: string) {
  const supabase = getSupabaseClient()
  for (const d of sampleDimensions) {
    const { error } = await (supabase.from('analysis_dimensions') as any).upsert(
      { owner_user_id: userId, key: d.key, name: d.name, is_sample: true },
      { onConflict: 'owner_user_id,key' }
    )
    if (error) throw new Error(`Failed to ensure sample dimension ${d.key}: ${error.message}`)
  }
}

async function ensureDimensionValues(userId: string, dimensions: any[]) {
  const supabase = getSupabaseClient()
  for (const d of sampleDimensions) {
    const dimension = requireDimension(dimensions, d.key)
    const payload = d.values.map((name) => ({ owner_user_id: userId, analysis_dimension_id: dimension.id, name, is_sample: true }))
    const { error } = await (supabase.from('analysis_dimension_values') as any).upsert(payload, { onConflict: 'owner_user_id,analysis_dimension_id,name' })
    if (error) throw new Error(`Failed to ensure sample dimension values for ${d.key}: ${error.message}`)
  }
}

async function fetchDimensionsAndValues(userId: string) {
  const supabase = getSupabaseClient()
  const { data: dimensions, error: dimensionsError } = await supabase
    .from('analysis_dimensions')
    .select('id,key,name')
    .eq('owner_user_id', userId)
    .in('key', sampleDimensions.map((d) => d.key))
  if (dimensionsError) throw new Error(`Failed to load sample dimensions: ${dimensionsError.message}`)

  const dimensionIds = (dimensions ?? []).map((d: any) => d.id)
  const { data: values, error: valuesError } = await supabase
    .from('analysis_dimension_values')
    .select('id,analysis_dimension_id,name')
    .eq('owner_user_id', userId)
    .in('analysis_dimension_id', dimensionIds)
  if (valuesError) throw new Error(`Failed to load sample dimension values: ${valuesError.message}`)
  return { dimensions: dimensions ?? [], values: values ?? [] }
}

export async function loadSamplePlData() {
  const u = await req()
  const supabase = getSupabaseClient()
  await ensureSampleDimensions(u)
  let latest = await fetchDimensionsAndValues(u)
  await ensureDimensionValues(u, latest.dimensions)
  latest = await fetchDimensionsAndValues(u)

  const dimensionMap = new Map<string, any>()
  const valueMap = new Map<string, any[]>()
  for (const d of sampleDimensions) {
    const dimension = requireDimension(latest.dimensions, d.key)
    dimensionMap.set(d.key, dimension)
    const dimensionValues = latest.values.filter((v: any) => v.analysis_dimension_id === dimension.id)
    valueMap.set(d.key, dimensionValues)
  }

  for (let m = 1; m <= 6; m++) {
    for (const version of ['actual', 'budget', 'forecast'] as const) {
      for (let idx = 0; idx < 3; idx++) {
        const amounts = buildSampleAccountAmounts({ month: m, version, idx })
        const rows = orderedRows(STANDARD_PL_ACCOUNTS, amounts)
        for (const row of rows) {
          const { data: fact, error: factError } = await (supabase.from('pl_facts') as any)
            .insert({
              owner_user_id: u,
              organization_key: 'all',
              account_key: row.accountKey,
              account_name: row.accountName,
              account_type: row.accountType,
              sort_order: row.sortOrder,
              version,
              target_month: `2026-${String(m).padStart(2, '0')}-01`,
              amount: row.amount,
              is_sample: true
            })
            .select('*').single()
          if (factError) throw new Error(`Failed to insert sample PL fact: ${factError.message}`)
          if (!fact?.id) throw new Error(`Failed to insert sample PL fact: missing fact id (${row.accountKey}, ${version}, ${m})`)
          for (const [k, i] of [['product', idx], ['customer', idx], ['channel', idx], ['region', idx]] as const) {
            const dimension = dimensionMap.get(k)
            if (!dimension?.id) throw new Error(`Sample dimension not found: ${k}`)
            const value = requireDimensionValue(valueMap.get(k) ?? [], sampleDimensions.find((d) => d.key === k)?.values[i] ?? '')
            const { error: linkError } = await (supabase.from('pl_fact_dimension_values') as any).insert({
              owner_user_id: u,
              pl_fact_id: fact.id,
              analysis_dimension_id: dimension.id,
              analysis_dimension_value_id: value.id,
              is_sample: true
            })
            if (linkError) throw new Error(`Failed to insert PL fact dimension link (${k}): ${linkError.message}`)
          }
        }
      }
    }
  }
  const { count, error: countError } = await supabase.from('pl_facts').select('id', { count: 'exact', head: true }).eq('owner_user_id', u).eq('is_sample', true)
  if (countError) throw new Error(`Failed to count sample PL facts: ${countError.message}`)
  return { loadedFacts: count ?? 0 }
}

export async function aggregateMonthlyPl(f: SamplePlFilter) {
  const u = await req()
  let q: any = getSupabaseClient()
    .from('pl_facts')
    .select('id,account_key,account_name,target_month,amount,sort_order')
    .eq('owner_user_id', u)
    .eq('is_sample', true)
    .eq('version', f.version)
    .eq('organization_key', f.organizationKey)
    .gte('target_month', `${f.year}-01-01`)
    .lte('target_month', `${f.year}-12-31`)
  if (f.analysisDimensionId) {
    let linkQuery: any = getSupabaseClient()
      .from('pl_fact_dimension_values')
      .select('pl_fact_id')
      .eq('owner_user_id', u)
      .eq('is_sample', true)
      .eq('analysis_dimension_id', f.analysisDimensionId)
    if (f.analysisDimensionValueId) linkQuery = linkQuery.eq('analysis_dimension_value_id', f.analysisDimensionValueId)
    const { data: links } = await linkQuery
    const ids = Array.from(new Set((links ?? []).map((x: any) => x.pl_fact_id)))
    if (ids.length === 0) return []
    q = q.in('id', ids)
  }
  const { data, error } = await q
  if (error) throw new Error(`Failed to load PL facts: ${error.message}`)
  return data ?? []
}

export async function aggregatePlByDimension(f: PlByDimensionFilter) {
  const u = await req()
  const { data, error } = await getSupabaseClient()
    .from('pl_fact_dimension_values')
    .select('analysis_dimension_value_id,analysis_dimension_values(name),pl_facts!inner(account_key,account_name,amount)')
    .eq('owner_user_id', u)
    .eq('is_sample', true)
    .eq('analysis_dimension_id', f.analysisDimensionId)
    .eq('pl_facts.owner_user_id', u)
    .eq('pl_facts.is_sample', true)
    .eq('pl_facts.version', f.version)
    .eq('pl_facts.organization_key', f.organizationKey)
    .eq('pl_facts.target_month', `${f.year}-${String(f.month).padStart(2, '0')}-01`)
  if (error) throw new Error(`Failed to load PL facts: ${error.message}`)
  return data ?? []
}

export function orderedAccountKeys() {
  return STANDARD_PL_ACCOUNTS.map((a) => a.accountKey)
}

export function accountMeta(key: string) {
  return PL_ACCOUNT_BY_KEY.get(key)
}

export function resolveCompareConfig(compareType: CompareType) {
  if (compareType === 'actual_vs_forecast') return { compareVersion: 'actual', baseVersion: 'forecast', compareLabel: 'Actual', baseLabel: 'Forecast' }
  if (compareType === 'forecast_vs_budget') return { compareVersion: 'forecast', baseVersion: 'budget', compareLabel: 'Forecast', baseLabel: 'Budget' }
  return { compareVersion: 'actual', baseVersion: 'budget', compareLabel: 'Actual', baseLabel: 'Budget' }
}

export async function fetchPlVarianceRows(filters: PlVarianceFilter) {
  const u = await req()
  const { compareVersion, baseVersion } = resolveCompareConfig(filters.compareType)
  let q: any = getSupabaseClient()
    .from('pl_facts')
    .select('id,account_key,amount,version')
    .eq('owner_user_id', u)
    .eq('is_sample', true)
    .eq('organization_key', filters.organizationKey)
    .eq('target_month', `${filters.year}-${String(filters.month).padStart(2, '0')}-01`)
    .in('version', [compareVersion, baseVersion])
  if (filters.analysisDimensionId) {
    let linkQuery: any = getSupabaseClient()
      .from('pl_fact_dimension_values')
      .select('pl_fact_id')
      .eq('owner_user_id', u)
      .eq('is_sample', true)
      .eq('analysis_dimension_id', filters.analysisDimensionId)
    if (filters.analysisDimensionValueId) linkQuery = linkQuery.eq('analysis_dimension_value_id', filters.analysisDimensionValueId)
    const { data: links } = await linkQuery
    const ids = Array.from(new Set((links ?? []).map((x: any) => x.pl_fact_id)))
    if (ids.length === 0) return []
    q = q.in('id', ids)
  }
  const { data, error } = await q
  if (error) throw new Error(`Failed to load PL variance: ${error.message}`)
  return data ?? []
}

export async function aggregatePlVariance(filters: PlVarianceFilter) {
  const rows = await fetchPlVarianceRows(filters)
  const { compareVersion, baseVersion, compareLabel, baseLabel } = resolveCompareConfig(filters.compareType)
  const byAccount = new Map<string, { compareAmount: number; baseAmount: number }>()
  for (const accountKey of orderedAccountKeys()) byAccount.set(accountKey, { compareAmount: 0, baseAmount: 0 })
  rows.forEach((r: any) => {
    const bucket = byAccount.get(r.account_key) ?? { compareAmount: 0, baseAmount: 0 }
    const amount = Number(r.amount ?? 0)
    if (r.version === compareVersion) bucket.compareAmount += amount
    if (r.version === baseVersion) bucket.baseAmount += amount
    byAccount.set(r.account_key, bucket)
  })
  const hasCompare = rows.some((r: any) => r.version === compareVersion)
  const hasBase = rows.some((r: any) => r.version === baseVersion)
  const lineItems = orderedAccountKeys().map((accountKey) => {
    const meta = accountMeta(accountKey)
    const amounts = byAccount.get(accountKey) ?? { compareAmount: 0, baseAmount: 0 }
    const variance = amounts.compareAmount - amounts.baseAmount
    const varianceRate = amounts.baseAmount !== 0 ? variance / Math.abs(amounts.baseAmount) : amounts.compareAmount === 0 ? 0 : null
    return {
      accountKey,
      accountName: meta?.accountName ?? accountKey,
      compareAmount: amounts.compareAmount,
      baseAmount: amounts.baseAmount,
      variance,
      varianceRate,
      isTotal: Boolean(meta?.isTotal),
      isProfitLine: Boolean(meta?.isProfitLine)
    }
  })
  return { lineItems, compareLabel, baseLabel, hasCompare, hasBase, rawCount: rows.length }
}


export async function getSamplePlStatus() {
  const u = await req()
  const { count, error } = await getSupabaseClient().from('pl_facts').select('id', { count: 'exact', head: true }).eq('owner_user_id', u).eq('is_sample', true)
  if (error) throw new Error(error.message)
  const { data: latest, error: latestErr } = await getSupabaseClient()
    .from('pl_facts')
    .select('created_at')
    .eq('owner_user_id', u)
    .eq('is_sample', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (latestErr) throw new Error(latestErr.message)
  const latestRow: any = latest
  return { rows: count ?? 0, lastLoadedAt: latestRow?.created_at ?? null }
}
