import { useMemo, useState } from 'react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { LearningNotes } from '../shared/LearningNotes'

type LongRangeInputs = {
  planningHorizon: number
  currentRevenue: number
  revenueGrowthPercent: number
  currentHeadcount: number
  annualHeadcountGrowthPercent: number
  operatingMarginPercent: number
  annualCapEx: number
}

type PlanningYear = {
  year: number
  label: string
  story: string
  revenue: number
  growthPercent: number
  headcount: number
  operatingMarginPercent: number
  operatingProfit: number
  capex: number
}

type ScenarioPlan = {
  label: string
  revenueGrowthPercent: number
  yearFiveRevenue: number
  yearFiveOperatingProfit: number
  yearFiveHeadcount: number
  revenueMultiple: number | null
}

const initialInputs: LongRangeInputs = {
  planningHorizon: 5,
  currentRevenue: 10000000,
  revenueGrowthPercent: 15,
  currentHeadcount: 100,
  annualHeadcountGrowthPercent: 10,
  operatingMarginPercent: 18,
  annualCapEx: 1000000,
}

const growthStories = [
  'Starting Position',
  'Initial Scaling',
  'Growth Acceleration',
  'Operating Leverage Expansion',
  'Strategic Target State',
]

const moneyFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
const numberFormatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 })
const percentFormatter = new Intl.NumberFormat('en-US', { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 })

const formatMoney = (value: number) => moneyFormatter.format(value)
const formatNumber = (value: number) => numberFormatter.format(value)
const formatPercent = (value: number | null) => (value === null ? '—' : percentFormatter.format(value))
const formatMultiple = (value: number | null) => (value === null ? '—' : `${formatNumber(value)}x`)
const safeNumber = (value: number) => (Number.isFinite(value) ? Math.max(0, value) : 0)
const toRate = (percent: number) => safeNumber(percent) / 100

function buildPlan(inputs: LongRangeInputs, revenueGrowthPercent = inputs.revenueGrowthPercent): PlanningYear[] {
  const horizon = Math.min(5, Math.max(1, Math.round(safeNumber(inputs.planningHorizon))))
  const revenueGrowthRate = toRate(revenueGrowthPercent)
  const headcountGrowthRate = toRate(inputs.annualHeadcountGrowthPercent)
  const operatingMarginRate = toRate(inputs.operatingMarginPercent)

  return Array.from({ length: horizon }, (_, index) => {
    const year = index + 1
    const revenue = safeNumber(inputs.currentRevenue) * ((1 + revenueGrowthRate) ** index)
    const headcount = safeNumber(inputs.currentHeadcount) * ((1 + headcountGrowthRate) ** index)

    return {
      year,
      label: `Year ${year}`,
      story: growthStories[index] ?? `Year ${year} Scaling`,
      revenue,
      growthPercent: index === 0 ? 0 : revenueGrowthPercent,
      headcount,
      operatingMarginPercent: inputs.operatingMarginPercent,
      operatingProfit: revenue * operatingMarginRate,
      capex: safeNumber(inputs.annualCapEx),
    }
  })
}

function getManagementInsight(revenueMultiple: number | null) {
  if (revenueMultiple === null || revenueMultiple < 1.5) {
    return {
      label: 'Growth ambition may be too conservative.',
      className: 'border-amber-200 bg-amber-50 text-amber-900',
    }
  }

  if (revenueMultiple <= 2.0) {
    return {
      label: 'Balanced long-term growth profile.',
      className: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    }
  }

  return {
    label: 'Aggressive growth strategy requiring strong execution.',
    className: 'border-purple-200 bg-purple-50 text-purple-900',
  }
}

export function LongRangePlanningPage() {
  const [inputs, setInputs] = useState<LongRangeInputs>(initialInputs)

  const plan = useMemo(() => buildPlan(inputs), [inputs])
  const firstYear = plan[0]
  const finalYear = plan[plan.length - 1]
  const cagr = firstYear && finalYear && plan.length > 1 && firstYear.revenue > 0
    ? (finalYear.revenue / firstYear.revenue) ** (1 / (plan.length - 1)) - 1
    : null
  const revenueMultiple = firstYear && finalYear && firstYear.revenue > 0 ? finalYear.revenue / firstYear.revenue : null
  const totalCapEx = plan.reduce((sum, row) => sum + row.capex, 0)
  const totalRevenueCreated = plan.reduce((sum, row) => sum + row.revenue, 0)
  const totalOperatingProfitCreated = plan.reduce((sum, row) => sum + row.operatingProfit, 0)
  const managementInsight = getManagementInsight(revenueMultiple)

  const scenarioRows = useMemo<ScenarioPlan[]>(() => [
    { label: 'Conservative Plan', revenueGrowthPercent: 8 },
    { label: 'Base Plan', revenueGrowthPercent: 15 },
    { label: 'Aggressive Plan', revenueGrowthPercent: 25 },
  ].map((scenario) => {
    const scenarioPlan = buildPlan(inputs, scenario.revenueGrowthPercent)
    const scenarioFirstYear = scenarioPlan[0]
    const scenarioFinalYear = scenarioPlan[scenarioPlan.length - 1]

    return {
      ...scenario,
      yearFiveRevenue: scenarioFinalYear?.revenue ?? 0,
      yearFiveOperatingProfit: scenarioFinalYear?.operatingProfit ?? 0,
      yearFiveHeadcount: scenarioFinalYear?.headcount ?? 0,
      revenueMultiple: scenarioFirstYear && scenarioFinalYear && scenarioFirstYear.revenue > 0 ? scenarioFinalYear.revenue / scenarioFirstYear.revenue : null,
    }
  }), [inputs])

  const onInputChange = (key: keyof LongRangeInputs, value: string) => {
    const numeric = Number(value)
    setInputs((prev) => ({ ...prev, [key]: Number.isFinite(numeric) ? numeric : 0 }))
  }

  return (
    <section className='rounded-xl bg-white p-6 shadow-sm'>
      <div className='flex flex-wrap items-start justify-between gap-3'>
        <div>
          <h2 className='text-lg font-medium text-slate-900'>Long Range Planning</h2>
          <p className='mt-1 text-sm text-slate-600'>Build a multi-year financial outlook and connect strategic assumptions to revenue, profit, headcount, and investment needs.</p>
        </div>
        <div className='rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700'>Strategic Outlook</div>
      </div>

      <LearningNotes
        title='Long Range Planning'
        purpose='Build a multi-year financial outlook and understand how strategic decisions impact future growth.'
        keyQuestion='What does the company look like in 3–5 years if current strategy succeeds?'
        whenToUse={['Annual strategic planning', 'Board presentations', 'Investor discussions', 'Growth planning']}
        howToRead={['Review revenue growth trajectory', 'Review profitability trend', 'Review workforce growth', 'Review capital investment requirements']}
        fpnaTips={[
          'Long-range plans are directional, not forecasts.',
          'Focus on assumptions and strategic drivers.',
          'Investors often care more about trajectory than precise numbers.',
        ]}
        nextAction={[
          'Step 1: Define growth assumptions',
          'Step 2: Build 5-year outlook',
          'Step 3: Review workforce requirements',
          'Step 4: Review investment needs',
          'Step 5: Evaluate strategic feasibility',
        ]}
        defaultOpen
      />

      <article className='mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4'>
        <h3 className='text-sm font-semibold text-slate-800'>Assumption Panel</h3>
        <p className='mt-1 text-xs text-slate-600'>Adjust directional planning assumptions to see how strategic drivers compound over the long range.</p>
        <div className='mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4'>
          <label className='text-sm font-medium text-slate-700'>Planning Horizon<input className='mt-1 w-full rounded border border-slate-300 bg-white px-2 py-2' type='number' min='1' max='5' value={inputs.planningHorizon} onChange={(e) => onInputChange('planningHorizon', e.target.value)} /></label>
          <label className='text-sm font-medium text-slate-700'>Current Revenue<input className='mt-1 w-full rounded border border-slate-300 bg-white px-2 py-2' type='number' value={inputs.currentRevenue} onChange={(e) => onInputChange('currentRevenue', e.target.value)} /></label>
          <label className='text-sm font-medium text-slate-700'>Revenue Growth %<input className='mt-1 w-full rounded border border-slate-300 bg-white px-2 py-2' type='number' value={inputs.revenueGrowthPercent} onChange={(e) => onInputChange('revenueGrowthPercent', e.target.value)} /></label>
          <label className='text-sm font-medium text-slate-700'>Current Headcount<input className='mt-1 w-full rounded border border-slate-300 bg-white px-2 py-2' type='number' value={inputs.currentHeadcount} onChange={(e) => onInputChange('currentHeadcount', e.target.value)} /></label>
          <label className='text-sm font-medium text-slate-700'>Annual Headcount Growth %<input className='mt-1 w-full rounded border border-slate-300 bg-white px-2 py-2' type='number' value={inputs.annualHeadcountGrowthPercent} onChange={(e) => onInputChange('annualHeadcountGrowthPercent', e.target.value)} /></label>
          <label className='text-sm font-medium text-slate-700'>Operating Margin %<input className='mt-1 w-full rounded border border-slate-300 bg-white px-2 py-2' type='number' value={inputs.operatingMarginPercent} onChange={(e) => onInputChange('operatingMarginPercent', e.target.value)} /></label>
          <label className='text-sm font-medium text-slate-700'>Annual CapEx<input className='mt-1 w-full rounded border border-slate-300 bg-white px-2 py-2' type='number' value={inputs.annualCapEx} onChange={(e) => onInputChange('annualCapEx', e.target.value)} /></label>
        </div>
      </article>

      <div className='mt-4 grid gap-3 text-sm md:grid-cols-2 lg:grid-cols-3'>
        <div className='rounded-lg border border-blue-200 bg-blue-50 p-3'><div className='text-blue-700'>Revenue Year 5</div><div className='font-semibold text-blue-900'>{formatMoney(finalYear?.revenue ?? 0)}</div></div>
        <div className='rounded-lg border border-emerald-200 bg-emerald-50 p-3'><div className='text-emerald-700'>CAGR</div><div className='font-semibold text-emerald-900'>{formatPercent(cagr)}</div></div>
        <div className='rounded-lg border border-purple-200 bg-purple-50 p-3'><div className='text-purple-700'>Headcount Year 5</div><div className='font-semibold text-purple-900'>{formatNumber(finalYear?.headcount ?? 0)}</div></div>
        <div className='rounded-lg border bg-slate-50 p-3'><div className='text-slate-500'>Total CapEx</div><div className='font-semibold'>{formatMoney(totalCapEx)}</div></div>
        <div className='rounded-lg border border-amber-200 bg-amber-50 p-3'><div className='text-amber-700'>Year 5 Operating Profit</div><div className='font-semibold text-amber-900'>{formatMoney(finalYear?.operatingProfit ?? 0)}</div></div>
        <div className='rounded-lg border bg-slate-50 p-3'><div className='text-slate-500'>Revenue Multiple</div><div className='font-semibold'>{formatMultiple(revenueMultiple)}</div></div>
      </div>

      <article className='mt-4 rounded-lg border border-slate-200 bg-white p-4'>
        <h3 className='text-sm font-semibold text-slate-800'>Multi-Year Planning Table</h3>
        <p className='mt-1 text-xs text-slate-600'>Revenue and headcount compound from the previous year. Operating profit equals revenue multiplied by operating margin.</p>
        <div className='mt-3 overflow-x-auto'>
          <table className='min-w-full border-collapse text-sm'>
            <thead>
              <tr className='border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500'>
                <th className='px-3 py-2'>Year</th>
                <th className='px-3 py-2 text-right'>Revenue</th>
                <th className='px-3 py-2 text-right'>Growth %</th>
                <th className='px-3 py-2 text-right'>Headcount</th>
                <th className='px-3 py-2 text-right'>Operating Margin %</th>
                <th className='px-3 py-2 text-right'>Operating Profit</th>
                <th className='px-3 py-2 text-right'>CapEx</th>
              </tr>
            </thead>
            <tbody>
              {plan.map((row) => (
                <tr key={row.label} className='border-b border-slate-100 last:border-0'>
                  <th className='px-3 py-3 text-left font-medium text-slate-800'>{row.label}<div className='text-xs font-normal text-slate-500'>{row.story}</div></th>
                  <td className='px-3 py-3 text-right text-slate-700'>{formatMoney(row.revenue)}</td>
                  <td className='px-3 py-3 text-right text-slate-700'>{row.year === 1 ? '—' : formatPercent(row.growthPercent / 100)}</td>
                  <td className='px-3 py-3 text-right text-slate-700'>{formatNumber(row.headcount)}</td>
                  <td className='px-3 py-3 text-right text-slate-700'>{formatPercent(row.operatingMarginPercent / 100)}</td>
                  <td className='px-3 py-3 text-right text-slate-700'>{formatMoney(row.operatingProfit)}</td>
                  <td className='px-3 py-3 text-right text-slate-700'>{formatMoney(row.capex)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>

      <div className='mt-4 grid gap-4 lg:grid-cols-3'>
        <article className='rounded-lg border border-slate-200 bg-white p-4'>
          <h3 className='text-sm font-semibold text-slate-800'>Revenue Growth Chart</h3>
          <div className='mt-3 h-56'>
            <ResponsiveContainer width='100%' height='100%'>
              <LineChart data={plan}>
                <CartesianGrid strokeDasharray='3 3' />
                <XAxis dataKey='label' />
                <YAxis tickFormatter={(value) => `$${Number(value) / 1000000}M`} />
                <Tooltip formatter={(value) => formatMoney(Number(value))} />
                <Line type='monotone' dataKey='revenue' name='Revenue' stroke='#2563eb' strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </article>
        <article className='rounded-lg border border-slate-200 bg-white p-4'>
          <h3 className='text-sm font-semibold text-slate-800'>Headcount Growth Chart</h3>
          <div className='mt-3 h-56'>
            <ResponsiveContainer width='100%' height='100%'>
              <LineChart data={plan}>
                <CartesianGrid strokeDasharray='3 3' />
                <XAxis dataKey='label' />
                <YAxis tickFormatter={(value) => formatNumber(Number(value))} />
                <Tooltip formatter={(value) => formatNumber(Number(value))} />
                <Line type='monotone' dataKey='headcount' name='Headcount' stroke='#7c3aed' strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </article>
        <article className='rounded-lg border border-slate-200 bg-white p-4'>
          <h3 className='text-sm font-semibold text-slate-800'>Operating Profit Trend</h3>
          <div className='mt-3 h-56'>
            <ResponsiveContainer width='100%' height='100%'>
              <LineChart data={plan}>
                <CartesianGrid strokeDasharray='3 3' />
                <XAxis dataKey='label' />
                <YAxis tickFormatter={(value) => `$${Number(value) / 1000000}M`} />
                <Tooltip formatter={(value) => formatMoney(Number(value))} />
                <Line type='monotone' dataKey='operatingProfit' name='Operating Profit' stroke='#059669' strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </article>
      </div>

      <article className='mt-4 rounded-lg border border-slate-200 bg-white p-4'>
        <h3 className='text-sm font-semibold text-slate-800'>Growth Story</h3>
        <div className='mt-3 grid gap-3 md:grid-cols-5'>
          {plan.map((row) => (
            <div key={row.label} className='rounded-lg border border-slate-200 bg-slate-50 p-3'>
              <div className='text-xs font-semibold uppercase tracking-wide text-slate-500'>{row.label}</div>
              <div className='mt-1 font-medium text-slate-900'>{row.story}</div>
              <div className='mt-2 text-xs text-slate-600'>{formatMoney(row.revenue)} revenue / {formatNumber(row.headcount)} HC</div>
            </div>
          ))}
        </div>
      </article>

      <article className='mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4'>
        <h3 className='text-sm font-semibold text-slate-800'>Long-Term Investment Summary</h3>
        <div className='mt-3 grid gap-3 md:grid-cols-3'>
          <div className='rounded-lg border border-slate-200 bg-white p-3'><div className='text-xs uppercase tracking-wide text-slate-500'>Total CapEx</div><div className='mt-1 text-lg font-semibold text-slate-900'>{formatMoney(totalCapEx)}</div></div>
          <div className='rounded-lg border border-slate-200 bg-white p-3'><div className='text-xs uppercase tracking-wide text-slate-500'>Total Revenue Created</div><div className='mt-1 text-lg font-semibold text-slate-900'>{formatMoney(totalRevenueCreated)}</div></div>
          <div className='rounded-lg border border-slate-200 bg-white p-3'><div className='text-xs uppercase tracking-wide text-slate-500'>Total Operating Profit Created</div><div className='mt-1 text-lg font-semibold text-slate-900'>{formatMoney(totalOperatingProfitCreated)}</div></div>
        </div>
      </article>

      <article className='mt-4 rounded-lg border border-slate-200 bg-white p-4'>
        <h3 className='text-sm font-semibold text-slate-800'>Scenario Comparison</h3>
        <p className='mt-1 text-xs text-slate-600'>Compare conservative, base, and aggressive growth assumptions with the same headcount, margin, and CapEx assumptions.</p>
        <div className='mt-3 overflow-x-auto'>
          <table className='min-w-full border-collapse text-sm'>
            <thead>
              <tr className='border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500'>
                <th className='px-3 py-2'>Scenario</th>
                <th className='px-3 py-2 text-right'>Revenue Growth %</th>
                <th className='px-3 py-2 text-right'>Year 5 Revenue</th>
                <th className='px-3 py-2 text-right'>Year 5 Operating Profit</th>
                <th className='px-3 py-2 text-right'>Year 5 Headcount</th>
                <th className='px-3 py-2 text-right'>Revenue Multiple</th>
              </tr>
            </thead>
            <tbody>
              {scenarioRows.map((scenario) => (
                <tr key={scenario.label} className='border-b border-slate-100 last:border-0'>
                  <th className='px-3 py-3 text-left font-medium text-slate-800'>{scenario.label}</th>
                  <td className='px-3 py-3 text-right text-slate-700'>{formatPercent(scenario.revenueGrowthPercent / 100)}</td>
                  <td className='px-3 py-3 text-right text-slate-700'>{formatMoney(scenario.yearFiveRevenue)}</td>
                  <td className='px-3 py-3 text-right text-slate-700'>{formatMoney(scenario.yearFiveOperatingProfit)}</td>
                  <td className='px-3 py-3 text-right text-slate-700'>{formatNumber(scenario.yearFiveHeadcount)}</td>
                  <td className='px-3 py-3 text-right text-slate-700'>{formatMultiple(scenario.revenueMultiple)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>

      <article className={`mt-4 rounded-lg border p-4 ${managementInsight.className}`}>
        <h3 className='text-sm font-semibold'>Management Insight</h3>
        <div className='mt-1 text-lg font-semibold'>{managementInsight.label}</div>
        <p className='mt-1 text-sm'>Revenue multiple is {formatMultiple(revenueMultiple)}. Use this directional signal to test whether the strategic plan is ambitious, balanced, and feasible.</p>
      </article>

      <article className='mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4'>
        <h3 className='text-sm font-semibold text-slate-800'>Learning Flow</h3>
        <ol className='mt-3 grid gap-2 text-sm text-slate-700 md:grid-cols-5'>
          {[
            'Define growth assumptions',
            'Build 5-year outlook',
            'Review workforce requirements',
            'Review investment needs',
            'Evaluate strategic feasibility',
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
