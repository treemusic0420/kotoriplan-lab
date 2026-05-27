import { useEffect, useMemo, useState } from 'react'
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar } from 'recharts'
import { listDimensions, listDimensionValues } from '../features/dimension/api/dimensionRepository'
import { fetchPlBridge } from '../features/pl/api/plBridgeRepository'
import type { CompareType } from '../features/pl/model/types'
import { WhenToUseCard } from '../shared/ui/WhenToUseCard'

const months = Array.from({ length: 12 }, (_, idx) => ({ value: idx + 1, label: `2026-${String(idx + 1).padStart(2, '0')}` }))
const compareTypeOptions: Array<{ value: CompareType; label: string }> = [
  { value: 'actual_vs_budget', label: 'Actual vs Budget' },
  { value: 'actual_vs_forecast', label: 'Actual vs Forecast' },
  { value: 'forecast_vs_budget', label: 'Forecast vs Budget' }
]

const fmtAmount = (n: number, withSign = false) => {
  if (n === 0) return '—'
  const abs = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(Math.round(Math.abs(n)))
  if (withSign) return `${n > 0 ? '+' : '-'}${abs}`
  return `${n < 0 ? '-' : ''}${abs}`
}

export function PLBridgePage() {
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
    void fetchPlBridge({ compareType, year, month, organizationKey: organization, analysisDimensionId: dimId || undefined, analysisDimensionValueId: valueId || undefined })
      .then((r) => { setData(r); setError(null) })
      .catch((e) => setError(e instanceof Error ? e.message : 'Unknown error'))
  }, [compareType, year, month, organization, dimId, valueId])

  const baseOpLabel = useMemo(() => (compareType === 'actual_vs_forecast' ? 'Forecast Operating Profit' : 'Budget Operating Profit'), [compareType])
  const compareOpLabel = useMemo(() => (compareType === 'forecast_vs_budget' ? 'Forecast Operating Profit' : 'Actual Operating Profit'), [compareType])

  const tableRows = useMemo(() => ([
    { step: 'Base Operating Profit', amount: data?.baseOperatingProfit ?? 0, explanation: 'Starting point from the base version.' },
    { step: 'Revenue Impact', amount: data?.revenueImpact ?? 0, explanation: 'Profit impact from the change in total revenue.' },
    { step: 'Variable Cost Impact', amount: data?.variableCostImpact ?? 0, explanation: 'Profit impact from the change in variable costs. Higher costs reduce profit.' },
    { step: 'Fixed Cost Impact', amount: data?.fixedCostImpact ?? 0, explanation: 'Profit impact from the change in fixed costs / SG&A. Higher costs reduce profit.' },
    { step: 'Compare Operating Profit', amount: data?.compareOperatingProfit ?? 0, explanation: 'Ending point from the compare version.' },
    { step: 'Total Variance', amount: data?.actualTotalVariance ?? 0, explanation: 'Difference between compare operating profit and base operating profit.' }
  ]), [data])

  const chartRows = useMemo(() => ([
    { name: 'Base OP', amount: data?.baseOperatingProfit ?? 0 },
    { name: 'Revenue Impact', amount: data?.revenueImpact ?? 0 },
    { name: 'Variable Cost Impact', amount: data?.variableCostImpact ?? 0 },
    { name: 'Fixed Cost Impact', amount: data?.fixedCostImpact ?? 0 },
    { name: 'Compare OP', amount: data?.compareOperatingProfit ?? 0 }
  ]), [data])

  return <section className='rounded-xl bg-white p-6 shadow-sm'>
    <h2 className='text-lg font-medium'>PL Bridge</h2>
    <p className='mt-1 text-sm text-slate-600'>Explain operating profit variance by separating revenue impact, variable cost impact, and fixed cost impact.</p>

    <div className='mt-3 grid gap-3 md:grid-cols-3'>
      <label>Compare Type<select className='w-full rounded border px-2 py-1' value={compareType} onChange={(e) => setCompareType(e.target.value as CompareType)}>{compareTypeOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></label>
      <label>Year<input className='w-full rounded border px-2 py-1' value={year} onChange={(e) => setYear(Number(e.target.value) || 2026)} /></label>
      <label>Month<select className='w-full rounded border px-2 py-1' value={month} onChange={(e) => setMonth(Number(e.target.value))}>{months.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}</select></label>
      <label>Organization<select className='w-full rounded border px-2 py-1'><option>All</option></select></label>
      <label>Analysis Dimension<select className='w-full rounded border px-2 py-1' value={dimId} onChange={(e) => setDimId(e.target.value)}><option value=''>All</option>{dims.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select></label>
      <label>Dimension Value<select className='w-full rounded border px-2 py-1' value={valueId} onChange={(e) => setValueId(e.target.value)} disabled={!dimId}><option value=''>All</option>{values.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}</select></label>
    </div>
    <WhenToUseCard bullets={[
      'Use this view when management asks why operating profit changed versus budget or forecast.',
      'Instead of only saying “Operating profit is up/down,” this bridge separates the movement into revenue impact, variable cost impact, and fixed cost impact.',
      'In practice, FP&A teams use this type of view in monthly business reviews, budget variance meetings, forecast updates, and management reporting.',
      'It helps explain whether profit changed because sales volume/pricing improved, variable costs worsened, or fixed costs increased.'
    ]} note='Positive revenue impact improves profit. Higher variable or fixed costs reduce profit. Lower costs create favorable profit impact.' />

    <div className='mt-4 grid gap-3 md:grid-cols-3 text-sm'>
      <div className='rounded-lg border bg-slate-50 p-3'><div className='text-slate-500'>Base Operating Profit</div><div className='font-semibold'>{fmtAmount(data?.baseOperatingProfit ?? 0)}</div></div>
      <div className='rounded-lg border bg-slate-50 p-3'><div className='text-slate-500'>Revenue Impact</div><div className='font-semibold'>{fmtAmount(data?.revenueImpact ?? 0, true)}</div></div>
      <div className='rounded-lg border bg-slate-50 p-3'><div className='text-slate-500'>Variable Cost Impact</div><div className='font-semibold'>{fmtAmount(data?.variableCostImpact ?? 0, true)}</div></div>
      <div className='rounded-lg border bg-slate-50 p-3'><div className='text-slate-500'>Fixed Cost Impact</div><div className='font-semibold'>{fmtAmount(data?.fixedCostImpact ?? 0, true)}</div></div>
      <div className='rounded-lg border bg-slate-50 p-3'><div className='text-slate-500'>Compare Operating Profit</div><div className='font-semibold'>{fmtAmount(data?.compareOperatingProfit ?? 0)}</div></div>
      <div className='rounded-lg border bg-slate-50 p-3'><div className='text-slate-500'>Total Variance</div><div className='font-semibold'>{fmtAmount(data?.actualTotalVariance ?? 0, true)}</div></div>
    </div>

    {error && <p className='mt-3 text-rose-600'>Failed to load PL bridge: {error}</p>}
    {data && data.rawCount === 0 && <p className='mt-3 text-sm text-slate-600'>No PL facts found. Load sample PL data first.</p>}
    {data && data.rawCount > 0 && (!data.hasBase || !data.hasCompare) && <p className='mt-3 text-sm text-slate-600'>No bridge data found for selected filters.</p>}

    {data?.rawCount > 0 && <p className='mt-2 text-xs text-slate-500'>Reconciliation difference (Actual OP variance - Calculated impacts): {fmtAmount(data.reconciliationDifference, true)}</p>}

    <div className='mt-4 overflow-x-auto'>
      <table className='min-w-full text-sm'>
        <thead><tr><th className='text-left'>Step</th><th className='text-right'>Amount</th><th className='text-left'>Explanation</th></tr></thead>
        <tbody>
          {tableRows.map((row) => <tr key={row.step} className='border-t'><td className='py-2'>{row.step}</td><td className='py-2 text-right'>{fmtAmount(row.amount, row.step.includes('Impact') || row.step === 'Total Variance')}</td><td className='py-2'>{row.explanation}</td></tr>)}
        </tbody>
      </table>
    </div>

    <div className='mt-6'>
      <h3 className='text-base font-medium'>Bridge Flow ({baseOpLabel} → Impacts → {compareOpLabel})</h3>
      <div className='mt-2 h-72 rounded-lg border bg-white p-2'>
        <ResponsiveContainer width='100%' height='100%'>
          <BarChart data={chartRows}>
            <CartesianGrid strokeDasharray='3 3' />
            <XAxis dataKey='name' />
            <YAxis tickFormatter={(v) => fmtAmount(Number(v))} />
            <Tooltip formatter={(v: any) => fmtAmount(Number(v), true)} />
            <Bar dataKey='amount' fill='#334155' />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  </section>
}