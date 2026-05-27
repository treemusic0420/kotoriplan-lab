import { useEffect, useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { calculateCvp } from '../domain/cvp/formulas'
import { fetchScenariosForCompare } from '../features/scenario/api/scenarioRepository'
import type { Scenario } from '../features/scenario/model/types'

const c = (n: number | null) => (n === null || Number.isNaN(n) ? '—' : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n))
const pct = (n: number | null) => (n === null || Number.isNaN(n) ? '—' : `${(n * 100).toFixed(2)}%`)
const signed = (n: number | null, isPct = false) => (n === null ? '—' : `${n > 0 ? '+' : ''}${isPct ? `${(n * 100).toFixed(2)}%` : c(n)}`)

export function ScenarioComparePage() {
  const [items, setItems] = useState<Scenario[]>([]); const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true); const [error, setError] = useState<string | null>(null); const [limitMsg, setLimitMsg] = useState('')
  useEffect(() => { void (async () => { setLoading(true); setError(null); try { setItems(await fetchScenariosForCompare()) } catch (e) { setError(`Failed to load scenarios: ${e instanceof Error ? e.message : 'Unknown error'}`) } finally { setLoading(false) } })() }, [])
  const selected = useMemo(() => selectedIds.map((id) => items.find((i) => i.id === id)).filter(Boolean) as Scenario[], [items, selectedIds])
  const rows = selected.map((s) => ({ s, cvp: calculateCvp({ unitPrice: s.unitPrice, quantity: s.quantity, variableCostPerUnit: s.variableCostPerUnit, fixedCost: s.fixedCost }) }))
  const base = rows[0]
  const toggle = (id: string) => setSelectedIds((p) => { if (p.includes(id)) return p.filter((v) => v !== id); if (p.length >= 3) { setLimitMsg('You can compare up to 3 scenarios.'); return p } setLimitMsg(''); return [...p, id] })
  return <section className='rounded-xl bg-white p-6 shadow-sm'><h2 className='text-lg font-medium'>Scenario Compare</h2>
  <div className='mt-4 rounded-lg border bg-slate-50 p-4'>{loading && <p className='text-sm text-slate-600'>Loading scenarios...</p>}{error && <p className='rounded-md bg-rose-50 p-2 text-sm text-rose-700'>{error}</p>}
  {!loading && !error && items.length===0 && <p className='text-sm text-slate-600'>No scenarios available. Create scenarios first to compare.</p>}
  {!loading && !error && items.length===1 && <p className='text-sm text-slate-600'>At least two scenarios are required for comparison.</p>}
  <div className='mt-3 grid gap-2 md:grid-cols-2'>{items.map((i)=>{const checked=selectedIds.includes(i.id);return <label key={i.id} className='flex gap-2 rounded-md border bg-white p-3'><input type='checkbox' checked={checked} onChange={()=>toggle(i.id)} /><span className='text-sm'><b>{i.name}</b><br/>{i.targetYearMonth} / {i.status}</span></label>})}</div>{limitMsg && <p className='mt-2 text-xs text-amber-700'>{limitMsg}</p>}</div>
  {selected.length<2 && !loading && !error && <p className='mt-4 text-sm text-slate-600'>Select at least two scenarios to show comparison.</p>}
  {selected.length>=2 && <><div className='mt-5 overflow-x-auto'><table className='min-w-full border text-sm'><thead><tr className='bg-slate-100'><th className='px-3 py-2 text-left'>Metric</th>{rows.map((r)=> <th key={r.s.id} className='px-3 py-2 text-left'>{r.s.name}</th>)}</tr></thead><tbody>{([{label:'Sales',fn:(r:any)=>c(r.cvp.sales)},{label:'Variable Cost',fn:(r:any)=>c(r.cvp.variableCost)},{label:'Contribution Margin',fn:(r:any)=>c(r.cvp.contributionMargin)},{label:'Contribution Margin Ratio',fn:(r:any)=>pct(r.cvp.contributionMarginRatio)},{label:'Fixed Cost',fn:(r:any)=>c(r.s.fixedCost)},{label:'Operating Profit',fn:(r:any)=>c(r.cvp.operatingProfit)},{label:'Break-even Sales',fn:(r:any)=>c(r.cvp.breakEvenSales)},{label:'Break-even Quantity',fn:(r:any)=>r.cvp.breakEvenQuantity===null?'—':r.cvp.breakEvenQuantity.toFixed(2)},{label:'Margin of Safety Ratio',fn:(r:any)=>pct(r.cvp.marginOfSafetyRatio)}]).map((m)=><tr key={m.label} className='border-t'><th className='px-3 py-2 text-left font-medium'>{m.label}</th>{rows.map((r)=> <td key={r.s.id} className='px-3 py-2'>{m.fn(r)}</td>)}</tr>)}
  {base && rows.length>1 && ([{label:'Sales difference',fn:(r:any)=>signed(r.cvp.sales-base.cvp.sales)},{label:'Operating Profit difference',fn:(r:any)=>signed(r.cvp.operatingProfit-base.cvp.operatingProfit)},{label:'Contribution Margin Ratio difference',fn:(r:any)=>signed(r.cvp.contributionMarginRatio-base.cvp.contributionMarginRatio,true)},{label:'Break-even Sales difference',fn:(r:any)=>signed(r.cvp.breakEvenSales===null||base.cvp.breakEvenSales===null?null:r.cvp.breakEvenSales-base.cvp.breakEvenSales)}]).map((m)=><tr key={m.label} className='border-t bg-slate-50'><th className='px-3 py-2 text-left'>{m.label}</th>{rows.map((r,idx)=> <td key={r.s.id} className='px-3 py-2'>{idx===0?'Base':m.fn(r)}</td>)}</tr>)}
  </tbody></table></div>
  <div className='mt-6 h-72 rounded-lg border p-3'><ResponsiveContainer width='100%' height='100%'><BarChart data={rows.map((r)=>({name:r.s.name,Sales:r.cvp.sales,'Variable Cost':r.cvp.variableCost,'Fixed Cost':r.s.fixedCost,'Operating Profit':r.cvp.operatingProfit}))}><CartesianGrid strokeDasharray='3 3'/><XAxis dataKey='name'/><YAxis/><Tooltip/><Legend/><Bar dataKey='Sales' fill='#0f172a'/><Bar dataKey='Variable Cost' fill='#64748b'/><Bar dataKey='Fixed Cost' fill='#94a3b8'/><Bar dataKey='Operating Profit' fill='#16a34a'/></BarChart></ResponsiveContainer></div>
  </>}
  </section>
}
