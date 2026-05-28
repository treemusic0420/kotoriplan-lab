import { useEffect, useMemo, useState } from 'react'
import { fetchVarianceDrivers, type VarianceAnalysisAxis } from '../features/pl/api/plVarianceDriverRepository'
import type { CompareType } from '../features/pl/model/types'
import { LearningNotes } from '../shared/LearningNotes'
import { BaseCompareLegend } from '../shared/ui/BaseCompareLegend'

const months = Array.from({ length: 12 }, (_, idx) => ({ value: idx + 1, label: `2026-${String(idx + 1).padStart(2, '0')}` }))
const metricOptions = [
  { key: 'total_revenue', label: 'Total Revenue' },
  { key: 'total_variable_cost', label: 'Total Variable Cost' },
  { key: 'gross_profit', label: 'Gross Profit' },
  { key: 'contribution_margin', label: 'Contribution Margin' },
  { key: 'total_fixed_cost', label: 'Total Fixed Cost' },
  { key: 'total_sga', label: 'Total SG&A' },
  { key: 'operating_profit', label: 'Operating Profit' }
]
const axisOptions: Array<{ value: VarianceAnalysisAxis; label: string }> = [
  { value: 'all_axes', label: 'All Axes' },
  { value: 'product', label: 'Product' },
  { value: 'customer', label: 'Customer' },
  { value: 'channel', label: 'Channel' },
  { value: 'region', label: 'Region' }
]

const fmtAmount = (n: number, withSign = false) => {
  if (n === 0) return '—'
  const abs = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(Math.round(Math.abs(n)))
  if (withSign) return `${n > 0 ? '+' : '-'}${abs}`
  return `${n < 0 ? '-' : ''}${abs}`
}
const fmtRate = (n: number | null) => (n === null ? 'N/A' : `${n > 0 ? '+' : n < 0 ? '-' : ''}${Math.abs(n * 100).toFixed(1)}%`)

export function PLVarianceDriversPage() {
  const [compareType, setCompareType] = useState<CompareType>('actual_vs_budget')
  const [year, setYear] = useState(2026)
  const [month, setMonth] = useState(1)
  const [metricAccountKey, setMetricAccountKey] = useState('operating_profit')
  const [analysisAxis, setAnalysisAxis] = useState<VarianceAnalysisAxis>('all_axes')
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void fetchVarianceDrivers({ compareType, year, month, metricAccountKey, analysisAxis })
      .then((r) => { setData(r); setError(null) })
      .catch((e) => setError(e instanceof Error ? e.message : 'Unknown error'))
  }, [compareType, year, month, metricAccountKey, analysisAxis])

  const metricLabel = useMemo(() => metricOptions.find((m) => m.key === metricAccountKey)?.label ?? metricAccountKey, [metricAccountKey])

  return <section className='rounded-xl bg-white p-6 shadow-sm'>
    <h2 className='text-lg font-medium'>Variance Driver Analysis</h2>
    <p className='mt-1 text-sm text-slate-600'>Identify which products, customers, channels, and regions drive favorable or unfavorable PL variance.</p>
    <LearningNotes title='Variance Drivers' purpose='Identify which dimension values are driving favorable or unfavorable variance.' whenToUse={['After finding a material variance in PL Variance.', 'When you need to know which product, customer, channel, or region caused the variance.']} howToRead={['Start with the biggest unfavorable drivers.', 'Then review favorable drivers.', 'Do not add values across independent dimensions.']} fpnaTips={['Driver analysis helps prioritize management actions.']} />

    <div className='mt-3 grid gap-3 md:grid-cols-5'>
      <label>Compare Type<select className='w-full rounded border px-2 py-1' value={compareType} onChange={(e) => setCompareType(e.target.value as CompareType)}><option value='actual_vs_budget'>Actual vs Budget</option><option value='actual_vs_forecast'>Actual vs Forecast</option><option value='forecast_vs_budget'>Forecast vs Budget</option></select></label>
      <label>Year<input className='w-full rounded border px-2 py-1' value={year} onChange={(e) => setYear(Number(e.target.value) || 2026)} /></label>
      <label>Month<select className='w-full rounded border px-2 py-1' value={month} onChange={(e) => setMonth(Number(e.target.value))}>{months.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}</select></label>
      <label>Metric<select className='w-full rounded border px-2 py-1' value={metricAccountKey} onChange={(e) => setMetricAccountKey(e.target.value)}>{metricOptions.map((m) => <option key={m.key} value={m.key}>{m.label}</option>)}</select></label>
      <label>Analysis Axis<select className='w-full rounded border px-2 py-1' value={analysisAxis} onChange={(e) => setAnalysisAxis(e.target.value as VarianceAnalysisAxis)}>{axisOptions.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}</select></label>
    </div>

    <BaseCompareLegend
      compareType={compareType}
      contextLabel='For this driver analysis:'
      formulaPrefix='Driver variance formula'
      formulaLabel='- (A)'
    />

    <div className='mt-4 grid gap-3 text-sm md:grid-cols-4'>
      <div className='rounded-lg border bg-slate-50 p-3'><div className='text-slate-500'>Selected Metric Variance: (B) - (A)</div><div className='font-semibold'>{metricLabel}: {fmtAmount(data?.summary?.selectedMetricVariance ?? 0, true)}</div></div>
      <div className='rounded-lg border bg-slate-50 p-3'><div className='text-slate-500'>Biggest Unfavorable Driver</div><div className='font-semibold'>{data?.summary?.biggestUnfavorable ? `${data.summary.biggestUnfavorable.axisName} / ${data.summary.biggestUnfavorable.valueName}: ${fmtAmount(data.summary.biggestUnfavorable.variance, true)}` : '—'}</div></div>
      <div className='rounded-lg border bg-slate-50 p-3'><div className='text-slate-500'>Biggest Favorable Driver</div><div className='font-semibold'>{data?.summary?.biggestFavorable ? `${data.summary.biggestFavorable.axisName} / ${data.summary.biggestFavorable.valueName}: ${fmtAmount(data.summary.biggestFavorable.variance, true)}` : '—'}</div></div>
      <div className='rounded-lg border bg-slate-50 p-3'><div className='text-slate-500'>Unfavorable Driver Count</div><div className='font-semibold'>{data?.summary?.unfavorableDriverCount ?? 0}</div></div>
    </div>

    {error && <p className='mt-3 text-rose-600'>Failed to load variance drivers: {error}</p>}
    {data && data.rawCount === 0 && <p className='mt-3 text-sm text-slate-600'>No PL facts found. Load sample PL data first.</p>}
    {data && data.rawCount > 0 && data.rows.length === 0 && <p className='mt-3 text-sm text-slate-600'>No variance drivers found for selected filters.</p>}
    {analysisAxis === 'all_axes' && <p className='mt-3 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900'>All Axes ranks each dimension independently. Values are not additive across axes.</p>}

    {[{ title: 'Top Unfavorable Drivers', rows: data?.topUnfavorable ?? [] }, { title: 'Top Favorable Drivers', rows: data?.topFavorable ?? [] }].map((section) => (
      <div className='mt-6' key={section.title}>
        <h3 className='text-base font-medium'>{section.title}</h3>
        <div className='mt-2 overflow-x-auto'>
          <table className='min-w-[980px] text-sm'>
            <thead><tr><th className='text-left'>Rank</th><th className='text-left'>Axis</th><th className='text-left'>Value</th><th className='text-right'>(B) {data?.compareLabel ?? 'Compare'}</th><th className='text-right'>(A) {data?.baseLabel ?? 'Base'}</th><th className='text-right'>Variance: (B) - (A)</th><th className='text-right'>Variance %</th><th className='text-right'>F/U</th></tr></thead>
            <tbody>
              {section.rows.map((row: any, idx: number) => (
                <tr key={`${section.title}-${row.axisKey}-${row.valueId}`} className='border-t'>
                  <td className='py-2'>{idx + 1}</td><td>{row.axisName}</td><td>{row.valueName}</td>
                  <td className='text-right'>{fmtAmount(row.compareAmount)}</td><td className='text-right'>{fmtAmount(row.baseAmount)}</td><td className='text-right'>{fmtAmount(row.variance, true)}</td><td className='text-right'>{fmtRate(row.varianceRate)}</td>
                  <td className='text-right'><span className='rounded border px-2 py-0.5 text-xs'>{row.fu}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    ))}
  </section>
}