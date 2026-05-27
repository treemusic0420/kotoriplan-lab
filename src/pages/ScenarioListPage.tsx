import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { calculateCvp } from '../domain/cvp/formulas'
import { ensureMasterData } from '../features/master/api/masterRepository'
import { calculateScenarioSummary } from '../features/scenario/model/scenarioSummary'
import { deleteScenario, duplicateScenario, fetchScenarios } from '../features/scenario/api/scenarioRepository'
import type { ScenarioListItem } from '../features/scenario/model/types'

const c = (n: number | null) => (n === null || Number.isNaN(n) ? '—' : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(n))
const p = (n: number | null) => (n === null || Number.isNaN(n) ? '—' : `${(n * 100).toFixed(2)}%`)
const qf = (n: number) => new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(n)

export function ScenarioListPage() {
  const navigate = useNavigate()
  const [items, setItems] = useState<ScenarioListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [q, setQ] = useState('')
  const [status, setStatus] = useState<'all' | 'draft' | 'final'>('all')
  const [month, setMonth] = useState<'all' | string>('all')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null)

  const reload = async () => { setLoading(true); setError(null); try { await ensureMasterData(); setItems(await fetchScenarios()) } catch (e) { setError(`Failed to load scenarios: ${e instanceof Error ? e.message : 'Unknown error'}`) } finally { setLoading(false) } }
  useEffect(() => { void reload() }, [])

  const monthOptions = useMemo(() => Array.from(new Set(items.map((i) => i.targetYearMonth))).sort((a, b) => b.localeCompare(a)), [items])
  const filtered = useMemo(() => items.filter((it) => it.name.toLowerCase().includes(q.toLowerCase()) && (status === 'all' || it.status === status) && (month === 'all' || it.targetYearMonth === month)).sort((a, b) => (b.createdAt.localeCompare(a.createdAt) || b.targetYearMonth.localeCompare(a.targetYearMonth))), [items, q, status, month])
  const summary = useMemo(() => calculateScenarioSummary(items), [items])

  return <section className='rounded-xl bg-white p-6 shadow-sm'><div className='mb-4 flex items-center justify-between'><h2 className='text-lg font-medium'>Scenario Dashboard</h2><div className='flex gap-2'><button disabled={items.length < 2} onClick={() => navigate('/scenarios/compare')} className='rounded-md border px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50'>Compare Scenarios</button><Link to='/scenarios/new' className='rounded-md bg-slate-900 px-3 py-2 text-sm text-white'>New Scenario</Link></div></div>
    <div className='mb-4 grid gap-3 md:grid-cols-5'>{[['Total Scenarios',String(summary.totalScenarios)],['Best Operating Profit',summary.bestOperatingProfit?`${c(summary.bestOperatingProfit.value)} / ${summary.bestOperatingProfit.name}`:'—'],['Worst Operating Profit',summary.worstOperatingProfit?`${c(summary.worstOperatingProfit.value)} / ${summary.worstOperatingProfit.name}`:'—'],['Average CM Ratio',summary.averageContributionMarginRatio===null?'—':p(summary.averageContributionMarginRatio)],['Latest Scenario',summary.latestScenario?`${summary.latestScenario.name} / ${summary.latestScenario.targetYearMonth}`:'—']].map(([label,val])=><div key={label} className='rounded-xl border bg-slate-50 p-3'><p className='text-xs text-slate-500'>{label}</p><p className='mt-1 text-sm font-medium'>{val}</p></div>)}</div>
    {!loading && !error && items.length === 0 && <p className='mb-3 text-sm text-slate-600'>Create your first scenario to start CVP analysis.</p>}
    <div className='mb-4 grid gap-2 md:grid-cols-3'><input className='rounded-md border px-3 py-2 text-sm' placeholder='Search scenario name' value={q} onChange={(e)=>setQ(e.target.value)} /><select className='rounded-md border px-3 py-2 text-sm' value={status} onChange={(e)=>setStatus(e.target.value as any)}><option value='all'>all</option><option value='draft'>draft</option><option value='final'>final</option></select><select className='rounded-md border px-3 py-2 text-sm' value={month} onChange={(e)=>setMonth(e.target.value)}><option value='all'>all months</option>{monthOptions.map((m)=><option key={m} value={m}>{m}</option>)}</select></div>
    <div className='mb-3 text-xs text-slate-600'>Draft: {summary.draftCount} / Final: {summary.finalCount}</div>
    {deletingId && <p className='mb-2 text-sm text-slate-600'>Deleting...</p>}{duplicatingId && <p className='mb-2 text-sm text-slate-600'>Duplicating...</p>}
    {loading && <p className='text-sm text-slate-600'>Loading scenarios...</p>}
    {error && <p className='rounded-md bg-rose-50 p-3 text-sm text-rose-700'>{error}</p>}
    {actionError && <p className='rounded-md bg-rose-50 p-3 text-sm text-rose-700'>{actionError}</p>}
    {!loading && !error && items.length === 0 && <p className='text-sm text-slate-600'>No scenarios found for your account.</p>}
    {!loading && !error && items.length > 0 && filtered.length === 0 && <p className='text-sm text-slate-600'>No scenarios match your filters.</p>}
    {!loading && !error && filtered.length > 0 && <div className='overflow-x-auto'><table className='min-w-[1800px] text-left text-sm'><thead><tr className='border-b text-slate-600'><th className='py-2'>Scenario name</th><th>Target month</th><th>Status</th><th>Unit Price</th><th>Quantity</th><th>Sales</th><th>Variable Cost</th><th>Contribution Margin</th><th>Contribution Margin Ratio</th><th>Fixed Cost</th><th>Operating Profit</th><th>Break-even Sales</th><th>Margin of Safety Ratio</th><th>Created at</th><th>Actions</th></tr></thead><tbody>{filtered.map((i)=>{const cvp=calculateCvp(i);return <tr key={i.id} className='border-b'><td className='py-2 font-medium'>{i.name}</td><td>{i.targetYearMonth}</td><td>{i.status}</td><td>{c(i.unitPrice)}</td><td>{qf(i.quantity)}</td><td>{c(cvp.sales)}</td><td>{c(cvp.variableCost)}</td><td>{c(cvp.contributionMargin)}</td><td>{p(cvp.contributionMarginRatio)}</td><td>{c(i.fixedCost)}</td><td>{c(cvp.operatingProfit)}</td><td>{c(cvp.breakEvenSales)}</td><td>{p(cvp.marginOfSafetyRatio)}</td><td>{new Date(i.createdAt).toLocaleString('en-US')}</td><td><div className='flex gap-2'><Link className='text-blue-600 hover:underline' to={`/scenarios/${i.id}`}>Detail</Link><Link className='text-blue-600 hover:underline' to={`/scenarios/${i.id}/edit`}>Edit</Link><button className='text-blue-600 hover:underline' onClick={async()=>{setActionError(null);setDuplicatingId(i.id);try{const d=await duplicateScenario(i.id);await reload();navigate(`/scenarios/${d.id}/edit`)}catch(e){setActionError(`Duplicate failed: ${e instanceof Error ? e.message : 'Unknown error'}`)}finally{setDuplicatingId(null)}}}>Duplicate</button><button className='text-rose-600 hover:underline' onClick={async()=>{setActionError(null);setDeletingId(i.id);try{await deleteScenario(i.id);await reload()}catch(e){setActionError(`Delete failed: ${e instanceof Error ? e.message : 'Unknown error'}`)}finally{setDeletingId(null)}}}>Delete</button></div></td></tr>})}</tbody></table></div>}
  </section>
}
