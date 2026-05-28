import { useEffect, useMemo, useState } from 'react'
import { Line, LineChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { listDimensions, listDimensionValues } from '../features/dimension/api/dimensionRepository'
import { fetchPlRatioRanking, fetchPlRatios, fetchPlRatioTrend } from '../features/pl/api/plRatioRepository'
import { LearningNotes } from '../shared/LearningNotes'
import { AnalysisContextCard } from '../shared/ui/AnalysisContextCard'

const versions = ['actual', 'budget', 'forecast'] as const
const months = [{ value: 'all', label: 'All Months' }, ...Array.from({ length: 12 }, (_, i) => ({ value: `2026-${String(i + 1).padStart(2, '0')}`, label: `2026-${String(i + 1).padStart(2, '0')}` }))]
const dimensionOptions = [{ key: 'all', name: 'All' }, { key: 'product', name: 'Product' }, { key: 'customer', name: 'Customer' }, { key: 'channel', name: 'Channel' }, { key: 'region', name: 'Region' }]
const fmtAmount = (n: number) => (n === 0 ? '—' : new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(Math.round(n)))
const fmtPct = (n: number | null) => (n === null ? 'N/A' : `${(n * 100).toFixed(1)}%`)

export function PLRatioAnalysisPage() {
  const [version, setVersion] = useState<(typeof versions)[number]>('actual')
  const [year] = useState(2026)
  const [month, setMonth] = useState('2026-01')
  const [organizationKey] = useState('all')
  const [analysisDimensionKey, setAnalysisDimensionKey] = useState('all')
  const [analysisDimensionValueId, setAnalysisDimensionValueId] = useState('all')
  const [dimensionId, setDimensionId] = useState('')
  const [dimensionValues, setDimensionValues] = useState<any[]>([])
  const [summary, setSummary] = useState<any>(null)
  const [trend, setTrend] = useState<any[]>([])
  const [ranking, setRanking] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (analysisDimensionKey === 'all') { setDimensionId(''); setDimensionValues([]); setAnalysisDimensionValueId('all'); return }
    void listDimensions().then((dims) => {
      const found = dims.find((d) => d.key === analysisDimensionKey)
      if (!found) { setDimensionId(''); setDimensionValues([]); return }
      setDimensionId(found.id)
      void listDimensionValues(found.id).then((values) => {
        setDimensionValues(values)
        setAnalysisDimensionValueId('all')
      })
    })
  }, [analysisDimensionKey])

  useEffect(() => {
    const filters = { version, year, month, organizationKey, analysisDimensionKey, analysisDimensionValueId }
    void Promise.all([fetchPlRatios(filters), fetchPlRatioTrend(filters), fetchPlRatioRanking(filters)])
      .then(([s, t, r]) => { setSummary(s); setTrend(t); setRanking(r); setError(null) })
      .catch((e) => setError(e instanceof Error ? e.message : 'Unknown error'))
  }, [version, year, month, organizationKey, analysisDimensionKey, analysisDimensionValueId])

  const selectedDimensionName = useMemo(() => dimensionOptions.find((d) => d.key === analysisDimensionKey)?.name ?? 'All dimensions', [analysisDimensionKey])
  const selectedValueName = useMemo(() => analysisDimensionValueId === 'all' ? 'All values' : (dimensionValues.find((v) => v.id === analysisDimensionValueId)?.name ?? 'Selected value'), [analysisDimensionValueId, dimensionValues])
  const analysisPeriod = month === 'all' ? `${year} All Months` : month
  const analysisScope = analysisDimensionKey === 'all' ? 'All organization / All dimensions' : `${selectedDimensionName} / ${selectedValueName}`

  const rows = useMemo(() => [
    ['Total Revenue', summary?.totalRevenue, 'Revenue after returns and discounts. This is the denominator for most profitability ratios.'],
    ['Total Variable Cost', summary?.totalVariableCost, 'Total variable costs tied to sales volume.'],
    ['Gross Profit', summary?.grossProfit, 'Revenue minus variable costs.'],
    ['Contribution Margin', summary?.contributionMargin, 'Revenue available to cover fixed costs and profit.'],
    ['Total SG&A', summary?.totalSga, 'Fixed costs and operating expenses.'],
    ['Operating Profit', summary?.operatingProfit, 'Contribution margin minus SG&A.'],
    ['Gross Margin %', summary?.grossMarginPct, 'Gross profit divided by total revenue. It shows how much profit remains after variable costs.'],
    ['Contribution Margin %', summary?.contributionMarginPct, 'Contribution margin divided by total revenue. It shows how much revenue is available to cover fixed costs and profit.'],
    ['Variable Cost Ratio', summary?.variableCostRatio, 'Total variable cost divided by total revenue. A higher ratio means variable costs consume more revenue.'],
    ['SG&A Ratio', summary?.sgaRatio, 'Total SG&A divided by total revenue. A higher ratio means fixed operating expenses consume more revenue.'],
    ['Operating Margin %', summary?.operatingMarginPct, 'Operating profit divided by total revenue. It shows final operating profitability after variable and fixed costs.']
  ], [summary])

  return <section className='rounded-xl bg-white p-6 shadow-sm'>
    <h2 className='text-lg font-medium'>Ratio Analysis</h2>
    <p className='mt-1 text-sm text-slate-600'>Review profitability and cost structure using margin and cost ratios.</p>

    <div className='mt-3 grid gap-3 md:grid-cols-3'>
      <label>Version<select className='w-full rounded border px-2 py-1' value={version} onChange={(e) => setVersion(e.target.value as any)}>{versions.map((v) => <option key={v}>{v}</option>)}</select></label>
      <label>Year<input className='w-full rounded border px-2 py-1' value={year} disabled /></label>
      <label>Month<select className='w-full rounded border px-2 py-1' value={month} onChange={(e) => setMonth(e.target.value)}>{months.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}</select></label>
      <label>Organization<select className='w-full rounded border px-2 py-1' disabled><option>All</option></select></label>
      <label>Analysis Dimension<select className='w-full rounded border px-2 py-1' value={analysisDimensionKey} onChange={(e) => setAnalysisDimensionKey(e.target.value)}>{dimensionOptions.map((d) => <option key={d.key} value={d.key}>{d.name}</option>)}</select></label>
      <label>Dimension Value<select className='w-full rounded border px-2 py-1' value={analysisDimensionValueId} onChange={(e) => setAnalysisDimensionValueId(e.target.value)} disabled={analysisDimensionKey === 'all' || !dimensionId}><option value='all'>All</option>{dimensionValues.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}</select></label>
    </div>

    <LearningNotes title='Ratio Analysis' purpose='Review profitability and cost structure using margin and cost ratios.' whenToUse={['When revenue size differs across months or segments.', 'When you want to evaluate efficiency rather than absolute amount.']} howToRead={['Check gross margin and contribution margin.', 'Then check variable cost ratio, SG&A ratio, and operating margin.', 'Look for ratio trends rather than one-time values.']} fpnaTips={['Ratios tell you how efficiently the business converts revenue into profit.']} />

    <div className='mt-4 grid gap-3 md:grid-cols-3 text-sm'>
      {['Total Revenue','Gross Margin %','Contribution Margin %','Operating Margin %','Variable Cost Ratio','SG&A Ratio'].map((k) => <div key={k} className='rounded-lg border bg-slate-50 p-3'><div className='text-slate-500'>{k}</div><div className='text-right font-semibold'>{k==='Total Revenue'?fmtAmount(summary?.totalRevenue ?? 0):fmtPct(summary?.[k==='Gross Margin %'?'grossMarginPct':k==='Contribution Margin %'?'contributionMarginPct':k==='Operating Margin %'?'operatingMarginPct':k==='Variable Cost Ratio'?'variableCostRatio':'sgaRatio'] ?? null)}</div></div>)}
    </div>

    {error && <p className='mt-3 text-rose-600'>Failed to load ratio analysis: {error}</p>}
    {summary && summary.rowCount === 0 && <p className='mt-3 text-sm text-slate-600'>No PL facts found. Load sample PL data first.</p>}
    {summary && summary.rowCount > 0 && summary.totalRevenue === 0 && <p className='mt-3 text-sm text-slate-600'>No ratio data found for selected filters.</p>}

    <div className='mt-4 overflow-x-auto'>
      <table className='min-w-full text-sm'><thead><tr><th className='text-left'>KPI</th><th className='text-right'>Value</th><th className='text-left'>Explanation</th></tr></thead><tbody>
        {rows.map(([name, value, exp]) => <tr key={String(name)} className='border-t'><td className='py-2'>{name}</td><td className='py-2 text-right'>{String(name).includes('%') || String(name).includes('Ratio') ? fmtPct((value as number | null) ?? null) : fmtAmount((value as number) ?? 0)}</td><td>{exp}</td></tr>)}
      </tbody></table>
    </div>

    <div className='mt-6'>
      <h3 className='text-base font-medium'>Monthly Ratio Trend (2026)</h3>
      <div className='mt-2 h-72 rounded-lg border bg-white p-2'>
        <ResponsiveContainer width='100%' height='100%'><LineChart data={trend}><CartesianGrid strokeDasharray='3 3' /><XAxis dataKey='month' /><YAxis tickFormatter={(v) => `${Number(v * 100).toFixed(0)}%`} /><Tooltip formatter={(v: any) => fmtPct(Number(v))} /><Line dataKey='grossMarginPct' name='Gross Margin %' stroke='#334155' /><Line dataKey='operatingMarginPct' name='Operating Margin %' stroke='#0f766e' /><Line dataKey='variableCostRatio' name='Variable Cost Ratio' stroke='#b45309' /><Line dataKey='sgaRatio' name='SG&A Ratio' stroke='#7c3aed' /></LineChart></ResponsiveContainer>
      </div>
    </div>

    {analysisDimensionKey !== 'all' && <div className='mt-6'>
      <h3 className='text-base font-medium'>Dimension Ratio Ranking</h3>
      <div className='mt-2 overflow-x-auto'>
        <table className='min-w-full text-sm'><thead><tr><th className='text-left'>Dimension Value</th><th className='text-right'>Total Revenue</th><th className='text-right'>Operating Profit</th><th className='text-right'>Gross Margin %</th><th className='text-right'>Operating Margin %</th></tr></thead><tbody>
          {ranking.map((r) => <tr className='border-t' key={r.dimensionValueId}><td className='py-2'>{r.dimensionValueName}</td><td className='py-2 text-right'>{fmtAmount(r.totalRevenue)}</td><td className='py-2 text-right'>{fmtAmount(r.operatingProfit)}</td><td className='py-2 text-right'>{fmtPct(r.grossMarginPct)}</td><td className='py-2 text-right'>{fmtPct(r.operatingMarginPct)}</td></tr>)}
        </tbody></table>
      </div>
    </div>}
  </section>
}
