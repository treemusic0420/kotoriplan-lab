import { getSupabaseClient } from '../../../infra/supabase/client'
import { PL_ACCOUNT_BY_KEY, STANDARD_PL_ACCOUNTS } from '../model/plAccountDefinitions'
import type { PlByDimensionFilter, SamplePlFilter } from '../model/types'
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
  await getSupabaseClient().from('pl_fact_dimension_values').delete().eq('owner_user_id', u).eq('is_sample', true)
  await getSupabaseClient().from('pl_facts').delete().eq('owner_user_id', u).eq('is_sample', true)
  await getSupabaseClient().from('analysis_dimension_values').delete().eq('owner_user_id', u).eq('is_sample', true)
  await getSupabaseClient().from('analysis_dimensions').delete().eq('owner_user_id', u).eq('is_sample', true)
}

export async function loadSamplePlData() {
  if (!(await hasSamplePlData())) await resetSamplePlData()
  else return
  const u = await req()
  const dimMap = new Map<string, string>()
  const valMap = new Map<string, string[]>()
  for (const d of sampleDimensions) {
    const { data } = await (getSupabaseClient().from('analysis_dimensions') as any)
      .insert({ owner_user_id: u, key: d.key, name: d.name, is_sample: true })
      .select('*').single()
    dimMap.set(d.key, data.id)
    const ids: string[] = []
    for (const v of d.values) {
      const { data: dv } = await (getSupabaseClient().from('analysis_dimension_values') as any)
        .insert({ owner_user_id: u, analysis_dimension_id: data.id, name: v, is_sample: true })
        .select('*').single()
      ids.push(dv.id)
    }
    valMap.set(d.key, ids)
  }

  for (let m = 1; m <= 6; m++) {
    for (const version of ['actual', 'budget', 'forecast'] as const) {
      for (let idx = 0; idx < 3; idx++) {
        const amounts = buildSampleAccountAmounts({ month: m, version, idx })
        const rows = orderedRows(STANDARD_PL_ACCOUNTS, amounts)
        for (const row of rows) {
          const { data: fact } = await (getSupabaseClient().from('pl_facts') as any)
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
          for (const [k, i] of [['product', idx], ['customer', idx], ['channel', idx], ['region', idx]] as const) {
            await (getSupabaseClient().from('pl_fact_dimension_values') as any).insert({
              owner_user_id: u,
              pl_fact_id: fact.id,
              analysis_dimension_id: dimMap.get(k),
              analysis_dimension_value_id: valMap.get(k)?.[i],
              is_sample: true
            })
          }
        }
      }
    }
  }
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
