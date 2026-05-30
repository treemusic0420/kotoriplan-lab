import { useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { LearningNotes } from '../shared/LearningNotes'

type ScenarioPlanningInputs = {
  planningHorizon: number
  revenueGrowthBasePercent: number
  revenueGrowthBestPercent: number
  revenueGrowthWorstPercent: number
  currentRevenue: number
  currentHeadcount: number
  operatingMarginPercent: number
  annualCapEx: number
}

type ScenarioKey = 'worst' | 'base' | 'best'

type ScenarioDefinition = {
  key: ScenarioKey
  label: string
  growthPercent: number
  color: string
}

type ScenarioOutcome = ScenarioDefinition & {
  revenue: number
  operatingProfit: number
  revenueMultiple: number | null
  headcountNeed: number
  investmentRequirement: number
}

type ScenarioChartRow = {
  label: string
  year: number
  Worst: number
  Base: number
  Best: number
  worstProfit: number
  baseProfit: number
  bestProfit: number
}

const initialInputs: ScenarioPlanningInputs = {
  planningHorizon: 5,
  revenueGrowthBasePercent: 15,
  revenueGrowthBestPercent: 25,
  revenueGrowthWorstPercent: 5,
  currentRevenue: 10000000,
  currentHeadcount: 100,
  operatingMarginPercent: 18,
  annualCapEx: 1000000,
}

const moneyFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
const numberFormatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 })
const percentFormatter = new Intl.NumberFormat('en-US', { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 })

const formatMoney = (value: number) => moneyFormatter.format(value)
const formatNumber = (value: number) => numberFormatter.format(value)
const formatPercent = (value: number | null) => (value === null ? '—' : percentFormatter.format(value))
const formatMultiple = (value: number | null) => (value === null ? '—' : `${formatNumber(value)}x`)
const safeNumber = (value: number) => (Number.isFinite(value) ? value : 0)
const safeNonNegativeNumber = (value: number) => Math.max(0, safeNumber(value))
const toRate = (percent: number) => Math.max(-0.99, safeNumber(percent) / 100)

function getHorizon(value: number) {
  return Math.min(10, Math.max(1, Math.round(safeNonNegativeNumber(value))))
}

function calculateRevenue(currentRevenue: number, growthPercent: number, years: number) {
  return safeNonNegativeNumber(currentRevenue) * ((1 + toRate(growthPercent)) ** years)
}

function getScenarioDefinitions(inputs: ScenarioPlanningInputs): ScenarioDefinition[] {
  return [
    { key: 'worst', label: 'Worst Case', growthPercent: inputs.revenueGrowthWorstPercent, color: '#dc2626' },
    { key: 'base', label: 'Base Case', growthPercent: inputs.revenueGrowthBasePercent, color: '#2563eb' },
    { key: 'best', label: 'Best Case', growthPercent: inputs.revenueGrowthBestPercent, color: '#059669' },
  ]
}

function getManagementInsight(currentRevenue: number, worstRevenue: number, baseRevenue: number, bestRevenue: number, revenueSpread: number) {
  if (revenueSpread > currentRevenue) {
    return {
      label: 'High uncertainty. Strategic flexibility is important.',
      className: 'border-amber-200 bg-amber-50 text-amber-900',
    }
  }

  if (worstRevenue < currentRevenue) {
    return {
      label: 'Downside scenario suggests revenue contraction risk.',
      className: 'border-red-200 bg-red-50 text-red-900',
    }
  }

  if (bestRevenue > currentRevenue * 2) {
    return {
      label: 'Growth opportunity is significant if execution succeeds.',
      className: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    }
  }

  return {
    label: 'Scenario range appears manageable.',
    className: 'border-sky-200 bg-sky-50 text-sky-900',
  }
}

export function ScenarioPlanningPage() {
  const [inputs, setInputs] = useState<ScenarioPlanningInputs>(initialInputs)

  const horizon = getHorizon(inputs.planningHorizon)
  const currentRevenue = safeNonNegativeNumber(inputs.currentRevenue)
  const operatingMarginRate = toRate(inputs.operatingMarginPercent)
  const annualCapEx = safeNonNegativeNumber(inputs.annualCapEx)

  const scenarios = useMemo<ScenarioOutcome[]>(() => getScenarioDefinitions(inputs).map((scenario) => {
    const revenue = calculateRevenue(inputs.currentRevenue, scenario.growthPercent, horizon)
    const revenueMultiple = currentRevenue > 0 ? revenue / currentRevenue : null

    return {
      ...scenario,
      revenue,
      operatingProfit: revenue * operatingMarginRate,
      revenueMultiple,
      headcountNeed: revenueMultiple === null ? 0 : safeNonNegativeNumber(inputs.currentHeadcount) * revenueMultiple,
      investmentRequirement: annualCapEx * horizon,
    }
  }), [annualCapEx, currentRevenue, horizon, inputs, operatingMarginRate])

  const worstScenario = scenarios.find((scenario) => scenario.key === 'worst') ?? scenarios[0]
  const baseScenario = scenarios.find((scenario) => scenario.key === 'base') ?? scenarios[1]
  const bestScenario = scenarios.find((scenario) => scenario.key === 'best') ?? scenarios[2]
  const revenueSpread = bestScenario.revenue - worstScenario.revenue
  const downsideRisk = baseScenario.revenue > 0 ? (baseScenario.revenue - worstScenario.revenue) / baseScenario.revenue : null
  const managementInsight = getManagementInsight(currentRevenue, worstScenario.revenue, baseScenario.revenue, bestScenario.revenue, revenueSpread)

  const chartRows = useMemo<ScenarioChartRow[]>(() => Array.from({ length: horizon }, (_, index) => {
    const year = index + 1
    const worstRevenue = calculateRevenue(inputs.currentRevenue, inputs.revenueGrowthWorstPercent, year)
    const baseRevenue = calculateRevenue(inputs.currentRevenue, inputs.revenueGrowthBasePercent, year)
    const bestRevenue = calculateRevenue(inputs.currentRevenue, inputs.revenueGrowthBestPercent, year)

    return {
      label: `Year ${year}`,
      year,
      Worst: worstRevenue,
      Base: baseRevenue,
      Best: bestRevenue,
      worstProfit: worstRevenue * operatingMarginRate,
      baseProfit: baseRevenue * operatingMarginRate,
      bestProfit: bestRevenue * operatingMarginRate,
    }
  }), [horizon, inputs.currentRevenue, inputs.revenueGrowthBasePercent, inputs.revenueGrowthBestPercent, inputs.revenueGrowthWorstPercent, operatingMarginRate])

  const distributionRows = scenarios.map((scenario) => ({ name: scenario.label, revenue: scenario.revenue, color: scenario.color }))
  const waterfallRows = [
    { label: 'Current Revenue', value: currentRevenue, color: '#64748b' },
    ...scenarios.map((scenario) => ({ label: `${scenario.label} Revenue`, value: scenario.revenue, color: scenario.color })),
  ]

  const kpiCards = [
    { label: 'Worst Case Revenue', value: formatMoney(worstScenario.revenue) },
    { label: 'Base Case Revenue', value: formatMoney(baseScenario.revenue) },
    { label: 'Best Case Revenue', value: formatMoney(bestScenario.revenue) },
    { label: 'Worst Case Operating Profit', value: formatMoney(worstScenario.operatingProfit) },
    { label: 'Base Case Operating Profit', value: formatMoney(baseScenario.operatingProfit) },
    { label: 'Best Case Operating Profit', value: formatMoney(bestScenario.operatingProfit) },
    { label: 'Revenue Spread', value: formatMoney(revenueSpread), helper: 'Best - Worst' },
    { label: 'Downside Risk %', value: formatPercent(downsideRisk), helper: '(Base - Worst) / Base' },
  ]

  const onInputChange = (key: keyof ScenarioPlanningInputs, value: string) => {
    const numeric = Number(value)
    setInputs((prev) => ({ ...prev, [key]: Number.isFinite(numeric) ? numeric : 0 }))
  }

  return (
    <section className='rounded-xl bg-white p-6 shadow-sm'>
      <div className='flex flex-wrap items-start justify-between gap-3'>
        <div>
          <h2 className='text-lg font-medium text-slate-900'>Scenario Planning</h2>
          <p className='mt-1 text-sm text-slate-600'>Compare multiple future scenarios and understand how uncertainty impacts revenue, profit, workforce, and investment requirements.</p>
        </div>
        <div className='rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700'>Best / Base / Worst</div>
      </div>

      <LearningNotes
        title='Scenario Planning'
        purpose='Evaluate how different market conditions and execution outcomes affect long-term performance.'
        keyQuestion='What happens if growth is lower or higher than expected?'
        whenToUse={['Annual planning', 'Strategic planning', 'Board discussions', 'Risk assessment']}
        howToRead={['Compare revenue outcomes', 'Compare operating profit', 'Compare headcount needs', 'Compare investment requirements']}
        fpnaTips={[
          'Most forecasts are wrong.',
          'Scenarios prepare management for uncertainty.',
          'Good planning includes downside protection.',
        ]}
        nextAction={[
          'Step 1: Define Base Case',
          'Step 2: Create Best Case',
          'Step 3: Create Worst Case',
          'Step 4: Compare financial outcomes',
          'Step 5: Discuss risk and opportunity',
        ]}
        defaultOpen
      />

      <article className='mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4'>
        <h3 className='text-sm font-semibold text-slate-800'>Input Panel</h3>
        <p className='mt-1 text-xs text-slate-600'>Start from a base case, then widen the range to test upside opportunity and downside protection.</p>
        <div className='mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4'>
          <label className='text-sm font-medium text-slate-700'>Planning Horizon (Years)<input className='mt-1 w-full rounded border border-slate-300 bg-white px-2 py-2' type='number' min='1' max='10' value={inputs.planningHorizon} onChange={(event) => onInputChange('planningHorizon', event.target.value)} /></label>
          <label className='text-sm font-medium text-slate-700'>Revenue Growth Base %<input className='mt-1 w-full rounded border border-slate-300 bg-white px-2 py-2' type='number' value={inputs.revenueGrowthBasePercent} onChange={(event) => onInputChange('revenueGrowthBasePercent', event.target.value)} /></label>
          <label className='text-sm font-medium text-slate-700'>Revenue Growth Best %<input className='mt-1 w-full rounded border border-slate-300 bg-white px-2 py-2' type='number' value={inputs.revenueGrowthBestPercent} onChange={(event) => onInputChange('revenueGrowthBestPercent', event.target.value)} /></label>
          <label className='text-sm font-medium text-slate-700'>Revenue Growth Worst %<input className='mt-1 w-full rounded border border-slate-300 bg-white px-2 py-2' type='number' value={inputs.revenueGrowthWorstPercent} onChange={(event) => onInputChange('revenueGrowthWorstPercent', event.target.value)} /></label>
          <label className='text-sm font-medium text-slate-700'>Current Revenue<input className='mt-1 w-full rounded border border-slate-300 bg-white px-2 py-2' type='number' value={inputs.currentRevenue} onChange={(event) => onInputChange('currentRevenue', event.target.value)} /></label>
          <label className='text-sm font-medium text-slate-700'>Current Headcount<input className='mt-1 w-full rounded border border-slate-300 bg-white px-2 py-2' type='number' value={inputs.currentHeadcount} onChange={(event) => onInputChange('currentHeadcount', event.target.value)} /></label>
          <label className='text-sm font-medium text-slate-700'>Operating Margin %<input className='mt-1 w-full rounded border border-slate-300 bg-white px-2 py-2' type='number' value={inputs.operatingMarginPercent} onChange={(event) => onInputChange('operatingMarginPercent', event.target.value)} /></label>
          <label className='text-sm font-medium text-slate-700'>Annual CapEx<input className='mt-1 w-full rounded border border-slate-300 bg-white px-2 py-2' type='number' value={inputs.annualCapEx} onChange={(event) => onInputChange('annualCapEx', event.target.value)} /></label>
        </div>
      </article>

      <div className='mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4'>
        {kpiCards.map((card) => (
          <article key={card.label} className='rounded-lg border border-slate-200 bg-white p-4'>
            <div className='text-xs font-semibold uppercase tracking-wide text-slate-500'>{card.label}</div>
            <div className='mt-2 text-xl font-semibold text-slate-900'>{card.value}</div>
            {card.helper && <div className='mt-1 text-xs text-slate-500'>{card.helper}</div>}
          </article>
        ))}
      </div>

      <article className='mt-4 rounded-lg border border-slate-200 bg-white p-4'>
        <h3 className='text-sm font-semibold text-slate-800'>Scenario Comparison Table</h3>
        <p className='mt-1 text-xs text-slate-600'>Long Range Planning shows one future; Scenario Planning compares multiple futures using the same margin assumptions.</p>
        <div className='mt-3 overflow-x-auto'>
          <table className='min-w-full border-collapse text-sm'>
            <thead>
              <tr className='border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500'>
                <th className='px-3 py-2'>Scenario</th>
                <th className='px-3 py-2 text-right'>Growth %</th>
                <th className='px-3 py-2 text-right'>Year {horizon} Revenue</th>
                <th className='px-3 py-2 text-right'>Year {horizon} Operating Profit</th>
                <th className='px-3 py-2 text-right'>Revenue Multiple</th>
              </tr>
            </thead>
            <tbody>
              {scenarios.map((scenario) => (
                <tr key={scenario.key} className='border-b border-slate-100 last:border-0'>
                  <th className='px-3 py-3 text-left font-medium text-slate-800'>{scenario.label}</th>
                  <td className='px-3 py-3 text-right text-slate-700'>{formatPercent(scenario.growthPercent / 100)}</td>
                  <td className='px-3 py-3 text-right text-slate-700'>{formatMoney(scenario.revenue)}</td>
                  <td className='px-3 py-3 text-right text-slate-700'>{formatMoney(scenario.operatingProfit)}</td>
                  <td className='px-3 py-3 text-right text-slate-700'>{formatMultiple(scenario.revenueMultiple)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>

      <article className='mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4'>
        <h3 className='text-sm font-semibold text-slate-800'>Scenario Waterfall</h3>
        <div className='mt-3 grid gap-3 md:grid-cols-4'>
          {waterfallRows.map((row, index) => (
            <div key={row.label} className='relative rounded-lg border border-slate-200 bg-white p-4'>
              {index > 0 && <div className='absolute -left-3 top-1/2 hidden -translate-y-1/2 text-slate-400 md:block'>→</div>}
              <div className='text-xs font-semibold uppercase tracking-wide text-slate-500'>{row.label}</div>
              <div className='mt-2 text-lg font-semibold' style={{ color: row.color }}>{formatMoney(row.value)}</div>
            </div>
          ))}
        </div>
      </article>

      <div className='mt-4 grid gap-4 lg:grid-cols-2'>
        <article className='rounded-lg border border-slate-200 bg-white p-4'>
          <h3 className='text-sm font-semibold text-slate-800'>Revenue Scenario Chart</h3>
          <div className='mt-3 h-64'>
            <ResponsiveContainer width='100%' height='100%'>
              <LineChart data={chartRows}>
                <CartesianGrid strokeDasharray='3 3' />
                <XAxis dataKey='label' />
                <YAxis tickFormatter={(value) => `$${Number(value) / 1000000}M`} />
                <Tooltip formatter={(value) => formatMoney(Number(value))} />
                <Line type='monotone' dataKey='Worst' name='Worst' stroke={worstScenario.color} strokeWidth={2} />
                <Line type='monotone' dataKey='Base' name='Base' stroke={baseScenario.color} strokeWidth={2} />
                <Line type='monotone' dataKey='Best' name='Best' stroke={bestScenario.color} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className='rounded-lg border border-slate-200 bg-white p-4'>
          <h3 className='text-sm font-semibold text-slate-800'>Operating Profit Scenario Chart</h3>
          <div className='mt-3 h-64'>
            <ResponsiveContainer width='100%' height='100%'>
              <LineChart data={chartRows}>
                <CartesianGrid strokeDasharray='3 3' />
                <XAxis dataKey='label' />
                <YAxis tickFormatter={(value) => `$${Number(value) / 1000000}M`} />
                <Tooltip formatter={(value) => formatMoney(Number(value))} />
                <Line type='monotone' dataKey='worstProfit' name='Worst' stroke={worstScenario.color} strokeWidth={2} />
                <Line type='monotone' dataKey='baseProfit' name='Base' stroke={baseScenario.color} strokeWidth={2} />
                <Line type='monotone' dataKey='bestProfit' name='Best' stroke={bestScenario.color} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </article>
      </div>

      <div className='mt-4 grid gap-4 lg:grid-cols-2'>
        <article className='rounded-lg border border-slate-200 bg-white p-4'>
          <h3 className='text-sm font-semibold text-slate-800'>Revenue Distribution View</h3>
          <div className='mt-3 h-56'>
            <ResponsiveContainer width='100%' height='100%'>
              <BarChart data={distributionRows} layout='vertical' margin={{ left: 24 }}>
                <CartesianGrid strokeDasharray='3 3' />
                <XAxis type='number' tickFormatter={(value) => `$${Number(value) / 1000000}M`} />
                <YAxis dataKey='name' type='category' width={86} />
                <Tooltip formatter={(value) => formatMoney(Number(value))} />
                <Bar dataKey='revenue' name='Revenue'>
                  {distributionRows.map((row) => <Cell key={row.name} fill={row.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className='rounded-lg border border-slate-200 bg-slate-50 p-4'>
          <h3 className='text-sm font-semibold text-slate-800'>Workforce & Investment Requirements</h3>
          <div className='mt-3 grid gap-3'>
            {scenarios.map((scenario) => (
              <div key={scenario.key} className='rounded-lg border border-slate-200 bg-white p-3'>
                <div className='flex items-center justify-between gap-3'>
                  <div>
                    <div className='text-sm font-semibold text-slate-800'>{scenario.label}</div>
                    <div className='text-xs text-slate-500'>Headcount scales with revenue multiple; CapEx uses annual requirement × horizon.</div>
                  </div>
                  <div className='text-right text-sm text-slate-700'>
                    <div>{formatNumber(scenario.headcountNeed)} HC</div>
                    <div>{formatMoney(scenario.investmentRequirement)} CapEx</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </article>
      </div>

      <article className={`mt-4 rounded-lg border p-4 ${managementInsight.className}`}>
        <h3 className='text-sm font-semibold'>Management Insight</h3>
        <div className='mt-1 text-lg font-semibold'>{managementInsight.label}</div>
        <p className='mt-1 text-sm'>The year {horizon} spread is {formatMoney(revenueSpread)}, and downside risk is {formatPercent(downsideRisk)}. Use this range to align management on risk, opportunity, and contingency actions.</p>
      </article>

      <article className='mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4'>
        <h3 className='text-sm font-semibold text-slate-800'>Learning Flow</h3>
        <ol className='mt-3 grid gap-2 text-sm text-slate-700 md:grid-cols-5'>
          {[
            'Define Base Case',
            'Create Best Case',
            'Create Worst Case',
            'Compare financial outcomes',
            'Discuss risk and opportunity',
          ].map((step, index) => (
            <li key={step} className='rounded-lg border border-slate-200 bg-white p-3'>
              <div className='text-xs font-semibold uppercase tracking-wide text-slate-500'>Step {index + 1}</div>
              <div className='mt-1 font-medium text-slate-900'>{step}</div>
            </li>
          ))}
        </ol>
      </article>
    </section>
  )
}
