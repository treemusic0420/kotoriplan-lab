import { useEffect, useMemo, useState } from 'react'
import { listDimensions } from '../features/dimension/api/dimensionRepository'
import { Fragment } from 'react'
import { accountMeta, aggregatePlByDimension } from '../features/pl/api/plFactRepository'
import { LearningNotes } from '../shared/LearningNotes'

const fmt = (n: number) => {
  if (n === 0) return '—'
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(Math.round(n))
}
const months = Array.from({ length: 12 }, (_, idx) => ({ value: idx + 1, label: `2026-${String(idx + 1).padStart(2, '0')}` }))
const SECTION_BY_ACCOUNT: Array<{ title: string, keys: string[] }> = [
  { title: 'Revenue', keys: ['net_sales', 'sales_returns_discounts', 'total_revenue'] },
  { title: 'Variable Costs', keys: ['material_cost', 'purchase_cost', 'direct_labor_cost', 'outsourcing_cost', 'payment_processing_fee', 'shipping_fulfillment_cost', 'total_variable_cost'] },
  { title: 'Gross / Contribution', keys: ['gross_profit', 'contribution_margin'] },
  { title: 'Operating Expenses', keys: ['salaries_wages', 'rent', 'utilities', 'software_subscription', 'advertising_promotion', 'travel_transportation', 'communication_expense', 'professional_fees', 'depreciation', 'other_sga', 'total_fixed_cost', 'total_sga'] },
  { title: 'Profit', keys: ['operating_profit'] }
]

export function PLByDimensionPage() {
  const [dims, setDims] = useState<any[]>([])
  const [dimId, setDimId] = useState('')
  const [version, setVersion] = useState<'actual' | 'budget' | 'forecast'>('actual')
  const [year, setYear] = useState(2026)
  const [month, setMonth] = useState(1)
  const [rows, setRows] = useState<any[]>([])
  useEffect(() => { void listDimensions().then((d) => { setDims(d); setDimId(d.find((v) => v.key === 'customer')?.id ?? d.find((v) => v.key === 'product')?.id ?? d[0]?.id ?? '') }) }, [])
  useEffect(() => { if (!dimId) return; void aggregatePlByDimension({ analysisDimensionId: dimId, version, year, month, organizationKey: 'all' }).then(setRows) }, [dimId, version, year, month])
  const cols = useMemo(() => { const m = new Map<string, string>(); rows.forEach((r: any) => m.set(r.analysis_dimension_value_id, r.analysis_dimension_values?.name ?? '')); return Array.from(m.entries()) }, [rows])
  const emphasize = (key: string) => key === 'operating_profit' ? 'font-bold bg-slate-200' : (accountMeta(key)?.isTotal || accountMeta(key)?.isProfitLine) ? 'font-semibold bg-slate-50' : ''
  return <section className='rounded-xl bg-white p-6 shadow-sm'><h2 className='text-lg font-medium'>PL by Dimension</h2>
  <LearningNotes title='PL by Dimension' purpose='Analyze PL performance by product, customer, channel, region, or other business dimensions.' keyQuestion='Which product, customer, channel, or region contributes most to revenue and profit?' whenToUse={['When you want to know which segment contributes most to revenue or profit.', 'When total PL changed and you need to identify where the change happened.']} howToRead={['Select an analysis dimension first.', 'Compare revenue, cost, and profit across dimension values.', 'Focus on both absolute amount and margin.']} fpnaTips={['Dimension analysis helps move from “what changed?” to “where did it change?”']} nextAction={['Investigate low-margin dimension values.', 'Compare dimension-level results with total PL.']} />
  <div className='mt-2 grid gap-3 md:grid-cols-4'><label>Version<select className='w-full rounded border px-2 py-1' value={version} onChange={e => setVersion(e.target.value as any)}><option value='actual'>actual</option><option value='budget'>budget</option><option value='forecast'>forecast</option></select></label><label>Year<input className='w-full rounded border px-2 py-1' value={year} onChange={e => setYear(Number(e.target.value) || 2026)} /></label><label>Month<select className='w-full rounded border px-2 py-1' value={month} onChange={e => setMonth(Number(e.target.value))}>{months.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}</select></label><label>Analysis Dimension<select className='w-full rounded border px-2 py-1' value={dimId} onChange={e => setDimId(e.target.value)}>{dims.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select></label></div><div className='mt-4 overflow-x-auto'><table className='min-w-[900px] text-sm'><thead><tr><th className='text-left'>Account</th>{cols.map(([id, n]) => <th key={id} className='text-right'>{n}</th>)}<th className='bg-slate-100 text-right font-bold'>Total</th></tr></thead><tbody>{SECTION_BY_ACCOUNT.map((section) => <Fragment key={section.title}><tr className='bg-slate-100/80'><td colSpan={cols.length + 2} className='px-2 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600'>{section.title}</td></tr>{section.keys.map((a) => { const by = cols.map(([id]) => rows.filter((r: any) => r.analysis_dimension_value_id === id && r.pl_facts.account_key === a).reduce((s: number, r: any) => s + Number(r.pl_facts.amount), 0)); const total = by.reduce((s, n) => s + n, 0); return <tr key={a} className={emphasize(a)}><td className='pl-4'>{accountMeta(a)?.accountName ?? a}</td>{by.map((n, i) => <td key={i} className={`text-right ${n < 0 ? 'text-rose-600' : ''}`}>{fmt(n)}</td>)}<td className={`bg-slate-50 text-right font-bold ${total < 0 ? 'text-rose-600' : ''}`}>{fmt(total)}</td></tr> })}</Fragment>)}</tbody></table></div></section>
}
