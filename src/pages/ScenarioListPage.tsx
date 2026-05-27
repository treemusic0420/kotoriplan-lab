import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { calculateCvp } from '../domain/cvp/formulas'
import { ensureMasterData } from '../features/master/api/masterRepository'
import { fetchScenarios } from '../features/scenario/api/scenarioRepository'
import type { ScenarioListItem } from '../features/scenario/model/types'

const c = (n: number | null) => (n === null ? '—' : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(n))
const p = (n: number | null) => (n === null ? '—' : `${(n * 100).toFixed(2)}%`)

export function ScenarioListPage() {
  const [items, setItems] = useState<ScenarioListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [q, setQ] = useState('')
  const [status, setStatus] = useState<'all' | 'draft' | 'final'>('all')

  useEffect(() => { void (async () => { setLoading(true); setError(null); try { await ensureMasterData(); setItems(await fetchScenarios()) } catch (e) { setError(`Failed to load scenarios: ${e instanceof Error ? e.message : 'Unknown error'}`) } finally { setLoading(false) } })() }, [])

  const filtered = useMemo(() => items.filter((it) => it.name.toLowerCase().includes(q.toLowerCase()) && (status === 'all' || it.status === status)).sort((a, b) => b.targetYearMonth.localeCompare(a.targetYearMonth)), [items, q, status])

  return <section className="rounded-xl bg-white p-6 shadow-sm"><div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-medium">Scenario List</h2><div className='flex gap-2'><Link to="/scenarios/compare" className="rounded-md border px-3 py-2 text-sm">Compare</Link><Link to="/scenarios/new" className="rounded-md bg-slate-900 px-3 py-2 text-sm text-white">New Scenario</Link></div></div>
  <div className='mb-4 grid gap-2 md:grid-cols-2'><input className='rounded-md border px-3 py-2 text-sm' placeholder='Search scenario name' value={q} onChange={(e)=>setQ(e.target.value)} /><select className='rounded-md border px-3 py-2 text-sm' value={status} onChange={(e)=>setStatus(e.target.value as any)}><option value='all'>All status</option><option value='draft'>draft</option><option value='final'>final</option></select></div>
  {loading && <p className="text-sm text-slate-600">Loading scenarios...</p>}
  {error && <p className="rounded-md bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
  {!loading && !error && items.length === 0 && <p className='text-sm text-slate-600'>No scenarios found for your account. If you created scenarios before signing in, they may not be linked to your user account.</p>}
  {!loading && !error && filtered.length > 0 && <div className='overflow-x-auto'><table className='w-full text-left text-sm'><thead><tr className='border-b text-slate-600'><th className='py-2'>Scenario name</th><th>Target month</th><th>Status</th><th>Sales</th><th>Variable Cost</th><th>Contribution Margin</th><th>Contribution Margin Ratio</th><th>Operating Profit</th><th>Created at</th><th>Detail</th></tr></thead><tbody>{filtered.map((i)=>{const cvp=calculateCvp({unitPrice:i.unitPrice,quantity:i.quantity,variableCostPerUnit:i.variableCostPerUnit,fixedCost:i.fixedCost});return <tr key={i.id} className='border-b'><td className='py-2'>{i.name}</td><td>{i.targetYearMonth}</td><td>{i.status}</td><td>{c(cvp.sales)}</td><td>{c(cvp.variableCost)}</td><td>{c(cvp.contributionMargin)}</td><td>{p(cvp.contributionMarginRatio)}</td><td>{c(cvp.operatingProfit)}</td><td>{new Date(i.createdAt).toLocaleString('en-US')}</td><td><Link className='text-blue-600 hover:underline' to={`/scenarios/${i.id}`}>View</Link></td></tr>})}</tbody></table></div>}
  </section>
}
