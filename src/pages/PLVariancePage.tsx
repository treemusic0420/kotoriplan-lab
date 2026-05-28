import { Fragment, useEffect, useMemo, useState } from 'react'
import { listDimensions, listDimensionValues } from '../features/dimension/api/dimensionRepository'
import { accountMeta, aggregatePlVariance } from '../features/pl/api/plFactRepository'
import type { CompareType } from '../features/pl/model/types'
import { LearningNotes } from '../shared/LearningNotes'
import { BaseCompareLegend } from '../shared/ui/BaseCompareLegend'

const months = Array.from({ length: 12 }, (_, idx) => ({ value: idx + 1, label: `2026-${String(idx + 1).padStart(2, '0')}` }))
const SECTION_BY_ACCOUNT: Array<{ title: string, keys: string[] }> = [
  { title: 'REVENUE', keys: ['net_sales', 'sales_returns_discounts', 'total_revenue'] },
  { title: 'VARIABLE COSTS', keys: ['material_cost', 'purchase_cost', 'direct_labor_cost', 'outsourcing_cost', 'payment_processing_fee', 'shipping_fulfillment_cost', 'total_variable_cost'] },
  { title: 'GROSS / CONTRIBUTION', keys: ['gross_profit', 'contribution_margin'] },
  { title: 'OPERATING EXPENSES', keys: ['salaries_wages', 'rent', 'utilities', 'software_subscription', 'advertising_promotion', 'travel_transportation', 'communication_expense', 'professional_fees', 'depreciation', 'other_sga', 'total_fixed_cost', 'total_sga'] },
  { title: 'PROFIT', keys: ['operating_profit'] }
]

const revenueProfit = new Set(['net_sales', 'total_revenue', 'gross_profit', 'contribution_margin', 'operating_profit'])
const cost = new Set(['sales_returns_discounts', 'material_cost', 'purchase_cost', 'direct_labor_cost', 'outsourcing_cost', 'payment_processing_fee', 'shipping_fulfillment_cost', 'total_variable_cost', 'salaries_wages', 'rent', 'utilities', 'software_subscription', 'advertising_promotion', 'travel_transportation', 'communication_expense', 'professional_fees', 'depreciation', 'other_sga', 'total_fixed_cost', 'total_sga'])

const fmtAmount = (n: number, withSign = false) => {
  if (n === 0) return '—'
  const abs = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(Math.round(Math.abs(n)))
  if (withSign) return `${n > 0 ? '+' : '-'}${abs}`
  return `${n < 0 ? '-' : ''}${abs}`
}
const fmtRate = (n: number | null) => (n === null ? 'N/A' : `${n > 0 ? '+' : n < 0 ? '-' : ''}${Math.abs(n * 100).toFixed(1)}%`)
const emphasize = (key: string) => key === 'operating_profit' ? 'font-bold bg-slate-200' : (accountMeta(key)?.isTotal || accountMeta(key)?.isProfitLine) ? 'font-semibold bg-slate-50' : ''

export function PLVariancePage() {
  const [compareType, setCompareType] = useState<CompareType>('actual_vs_budget')
  const [year, setYear] = useState(2026)
  const [month, setMonth] = useState(1)
  const [organization] = useState('all')
  const [dims, setDims] = useState<any[]>([])
  const [dimId, setDimId] = useState('')
  const [values, setValues] = useState<any[]>([])
  const [valueId, setValueId] = useState('')
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { void listDimensions().then(setDims) }, [])
  useEffect(() => { setValueId(''); if (!dimId) { setValues([]); return }; void listDimensionValues(dimId).then(setValues) }, [dimId])
  useEffect(() => {
    void aggregatePlVariance({ compareType, year, month, organizationKey: organization, analysisDimensionId: dimId || undefined, analysisDimensionValueId: valueId || undefined })
      .then((r) => { setData(r); setError(null) })
      .catch((e) => setError(e instanceof Error ? e.message : 'Unknown error'))
  }, [compareType, year, month, organization, dimId, valueId])

  const card = useMemo(() => {
    const f = (k: string) => data?.lineItems?.find((x: any) => x.accountKey === k)
    const op = f('operating_profit')
    return { rev: f('total_revenue')?.variance ?? 0, gp: f('gross_profit')?.variance ?? 0, op: op?.variance ?? 0, opRate: op?.varianceRate ?? null }
  }, [data])

  const compareTypeOptions = [
    { value: 'actual_vs_budget', label: 'Actual vs Budget' },
    { value: 'actual_vs_forecast', label: 'Actual vs Forecast' },
    { value: 'forecast_vs_budget', label: 'Forecast vs Budget' }
  ]

  const judge = (key: string, variance: number) => {
    if (variance === 0) return '—'
    if (revenueProfit.has(key)) return variance > 0 ? 'F' : 'U'
    if (cost.has(key)) return variance < 0 ? 'F' : 'U'
    return '—'
  }

  return <section className='rounded-xl bg-white p-6 shadow-sm'>
    <h2 className='text-lg font-medium'>PL Variance</h2>
    <p className='mt-1 text-sm text-slate-600'>Compare actual, budget, and forecast PL to understand variance by account and analysis dimension.</p>
    <LearningNotes title='PL Variance' purpose='Compare two versions such as Actual vs Budget or Actual vs Forecast.' keyQuestion='Why did actual or forecast performance differ from the plan?' whenToUse={['During monthly budget review or forecast review.', 'When you need to explain why actual performance differs from plan.']} howToRead={['Check total variance first.', 'Separate favorable and unfavorable variances.', 'Review revenue, variable cost, fixed cost, and operating profit.']} fpnaTips={['A favorable revenue variance can be offset by unfavorable cost variance.']} nextAction={['Check whether the variance comes from revenue, variable cost, or fixed cost.', 'Use Variance Drivers to identify the responsible dimension values.']} />
    <div className='mt-3 grid gap-3 md:grid-cols-3'>
      <label>Compare Type<select className='w-full rounded border px-2 py-1' value={compareType} onChange={(e) => setCompareType(e.target.value as CompareType)}>{compareTypeOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></label>
      <label>Year<input className='w-full rounded border px-2 py-1' value={year} onChange={(e) => setYear(Number(e.target.value) || 2026)} /></label>
      <label>Month<select className='w-full rounded border px-2 py-1' value={month} onChange={(e) => setMonth(Number(e.target.value))}>{months.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}</select></label>
      <label>Organization<select className='w-full rounded border px-2 py-1'><option>All</option></select></label>
      <label>Analysis Dimension<select className='w-full rounded border px-2 py-1' value={dimId} onChange={(e) => setDimId(e.target.value)}><option value=''>All</option>{dims.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select></label>
      <label>Dimension Value<select className='w-full rounded border px-2 py-1' value={valueId} onChange={(e) => setValueId(e.target.value)} disabled={!dimId}><option value=''>All</option>{values.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}</select></label>
    </div>

    <BaseCompareLegend
      compareType={compareType}
      contextLabel='For this variance:'
      formulaPrefix='Variance formula'
      formulaLabel='- (A)'
      noteLines={[
        'F/U is judged from a profit perspective.',
        'For revenue and profit accounts, higher than base is favorable.',
        'For cost accounts, lower than base is favorable.'
      ]}
    />

    <div className='mt-4 grid gap-3 md:grid-cols-4 text-sm'>
      <div className='rounded-lg border bg-slate-50 p-3'><div className='text-slate-500'>Revenue Variance: (B) - (A)</div><div className='font-semibold'>{fmtAmount(card.rev, true)}</div></div>
      <div className='rounded-lg border bg-slate-50 p-3'><div className='text-slate-500'>Gross Profit Variance: (B) - (A)</div><div className='font-semibold'>{fmtAmount(card.gp, true)}</div></div>
      <div className='rounded-lg border bg-slate-50 p-3'><div className='text-slate-500'>Operating Profit Variance: (B) - (A)</div><div className='font-semibold'>{fmtAmount(card.op, true)}</div></div>
      <div className='rounded-lg border bg-slate-50 p-3'><div className='text-slate-500'>Operating Profit Variance %</div><div className='font-semibold'>{fmtRate(card.opRate)}</div></div>
    </div>

    {error && <p className='mt-3 text-rose-600'>Failed to load PL variance: {error}</p>}
    {data && data.rawCount === 0 && <p className='mt-3 text-sm text-slate-600'>No PL facts found. Load sample PL data first.</p>}
    {data && data.rawCount > 0 && (!data.hasBase || !data.hasCompare) && <p className='mt-3 text-sm text-slate-600'>No data found for selected comparison.</p>}

    {data?.lineItems?.length > 0 && <div className='mt-4 overflow-x-auto'><table className='min-w-[960px] text-sm'><thead><tr><th className='text-left'>Account</th><th className='text-right'>(B) {data.compareLabel}</th><th className='text-right'>(A) {data.baseLabel}</th><th className='text-right'>Variance: (B) - (A)</th><th className='text-right'>Variance %</th><th className='text-right'>F/U</th></tr></thead><tbody>{SECTION_BY_ACCOUNT.map((section) => <Fragment key={section.title}><tr className='bg-slate-100/80'><td colSpan={6} className='px-2 py-2 text-xs font-semibold tracking-wide text-slate-600'>{section.title}</td></tr>{section.keys.map((k) => { const r = data.lineItems.find((x: any) => x.accountKey === k); if (!r) return null; return <tr key={k} className={emphasize(k)}><td className='pl-4'>{r.accountName}</td><td className='text-right'>{fmtAmount(r.compareAmount)}</td><td className='text-right'>{fmtAmount(r.baseAmount)}</td><td className='text-right'>{fmtAmount(r.variance, true)}</td><td className='text-right'>{fmtRate(r.varianceRate)}</td><td className='text-right'><span className='rounded border px-2 py-0.5 text-xs'>{judge(k, r.variance)}</span></td></tr> })}</Fragment>)}</tbody></table></div>}
  </section>
}