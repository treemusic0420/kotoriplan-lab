import { useMemo, useState } from 'react'
import { LearningNotes } from '../shared/LearningNotes'

type CapExInputs = {
  currentCapacity: number
  forecastDemand: number
  investmentCost: number
  additionalCapacity: number
  revenuePerUnit: number
  contributionMarginPercent: number
  investmentLifeYears: number
}

type CapExMetrics = {
  currentCapacity: number
  forecastDemand: number
  capacityGap: number
  newCapacity: number
  addedCapacityUsed: number
  additionalRevenue: number
  additionalOperatingProfit: number
  annualRoi: number | null
  paybackPeriod: number | null
}

type CapExScenario = {
  label: string
  description: string
  capacity: number
  revenue: number
  operatingProfit: number
  roi: number | null
  paybackPeriod: number | null
}

const initialInputs: CapExInputs = {
  currentCapacity: 100000,
  forecastDemand: 120000,
  investmentCost: 1000000,
  additionalCapacity: 30000,
  revenuePerUnit: 50,
  contributionMarginPercent: 40,
  investmentLifeYears: 5,
}

const moneyFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
const numberFormatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 })
const decimalFormatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 })
const percentFormatter = new Intl.NumberFormat('en-US', { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 })

const formatMoney = (value: number) => moneyFormatter.format(value)
const formatNumber = (value: number) => numberFormatter.format(value)
const formatDecimal = (value: number) => decimalFormatter.format(value)
const formatPercent = (value: number | null) => (value === null ? '—' : percentFormatter.format(value))
const formatPayback = (value: number | null) => (value === null ? '—' : `${formatDecimal(value)} years`)

function calculateMetrics(inputs: CapExInputs, additionalCapacity = inputs.additionalCapacity, investmentCost = inputs.investmentCost): CapExMetrics {
  const currentCapacity = Math.max(0, inputs.currentCapacity)
  const forecastDemand = Math.max(0, inputs.forecastDemand)
  const capacityGap = Math.max(0, forecastDemand - currentCapacity)
  const newCapacity = currentCapacity + Math.max(0, additionalCapacity)
  const addedCapacityUsed = Math.min(Math.max(0, additionalCapacity), capacityGap)
  const additionalRevenue = addedCapacityUsed * inputs.revenuePerUnit
  const additionalOperatingProfit = additionalRevenue * (inputs.contributionMarginPercent / 100)
  const annualRoi = investmentCost <= 0 ? null : additionalOperatingProfit / investmentCost
  const paybackPeriod = additionalOperatingProfit <= 0 ? null : investmentCost / additionalOperatingProfit

  return {
    currentCapacity,
    forecastDemand,
    capacityGap,
    newCapacity,
    addedCapacityUsed,
    additionalRevenue,
    additionalOperatingProfit,
    annualRoi,
    paybackPeriod,
  }
}

function getInvestmentDecision(roi: number | null) {
  if (roi === null) {
    return {
      label: 'Review Investment Assumptions',
      description: 'Add a valid investment cost before using ROI as a screening metric.',
      className: 'border-slate-200 bg-slate-50 text-slate-900',
    }
  }
  if (roi > 0.3) {
    return {
      label: 'Strong Investment Case',
      description: 'Annual ROI is above 30%, indicating the expected operating profit improvement is high relative to investment cost.',
      className: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    }
  }
  if (roi >= 0.15) {
    return {
      label: 'Moderate Investment Case',
      description: 'Annual ROI is between 15% and 30%; review strategic fit, execution risk, and funding availability.',
      className: 'border-amber-200 bg-amber-50 text-amber-900',
    }
  }
  return {
    label: 'Weak Investment Case',
    description: 'Annual ROI is below 15%, so the investment may not create enough financial return without strategic benefits.',
    className: 'border-rose-200 bg-rose-50 text-rose-900',
  }
}

function buildScenario(inputs: CapExInputs, label: string, description: string, additionalCapacity: number, investmentCost: number): CapExScenario {
  const metrics = calculateMetrics(inputs, additionalCapacity, investmentCost)
  const servedDemand = Math.min(metrics.forecastDemand, metrics.newCapacity)
  const revenue = servedDemand * inputs.revenuePerUnit
  const operatingProfit = revenue * (inputs.contributionMarginPercent / 100)

  return {
    label,
    description,
    capacity: metrics.newCapacity,
    revenue,
    operatingProfit,
    roi: metrics.annualRoi,
    paybackPeriod: metrics.paybackPeriod,
  }
}

export function CapExPlanningPage() {
  const [inputs, setInputs] = useState<CapExInputs>(initialInputs)

  const metrics = useMemo(() => calculateMetrics(inputs), [inputs])
  const decision = useMemo(() => getInvestmentDecision(metrics.annualRoi), [metrics.annualRoi])

  const scenarioRows = useMemo<CapExScenario[]>(() => [
    buildScenario(inputs, 'Scenario A', 'No Investment', 0, 0),
    buildScenario(inputs, 'Scenario B', 'Base Investment', inputs.additionalCapacity, inputs.investmentCost),
    buildScenario(inputs, 'Scenario C', 'Large Investment', inputs.additionalCapacity * 1.75, inputs.investmentCost * 1.6),
  ], [inputs])

  const waterfallRows = useMemo(() => [
    { label: 'Current Capacity', value: metrics.currentCapacity, display: `${formatNumber(metrics.currentCapacity)} units`, tone: 'bg-slate-500' },
    { label: 'Capacity Gap', value: metrics.capacityGap, display: `${formatNumber(metrics.capacityGap)} units`, tone: 'bg-rose-500' },
    { label: 'Added Capacity', value: metrics.addedCapacityUsed, display: `${formatNumber(metrics.addedCapacityUsed)} units used`, tone: 'bg-blue-500' },
    { label: 'Additional Revenue', value: metrics.additionalRevenue, display: formatMoney(metrics.additionalRevenue), tone: 'bg-emerald-500' },
    { label: 'Additional Profit', value: metrics.additionalOperatingProfit, display: formatMoney(metrics.additionalOperatingProfit), tone: 'bg-purple-500' },
  ], [metrics])

  const maxWaterfallValue = Math.max(...waterfallRows.map((row) => Math.abs(row.value)), 1)

  const learningInsight = useMemo(() => {
    if (metrics.paybackPeriod !== null && metrics.paybackPeriod > inputs.investmentLifeYears) {
      return 'Payback period exceeds investment life. The investment may not recover its cost within the useful planning horizon.'
    }
    if (metrics.annualRoi !== null && metrics.annualRoi < 0.15) {
      return 'Investment cost is high relative to expected profit improvement.'
    }
    if (metrics.capacityGap > 0 && metrics.addedCapacityUsed >= metrics.capacityGap) {
      return 'Investment removes the capacity bottleneck and increases revenue.'
    }
    return 'Investment improves capacity, but some demand may remain constrained or some new capacity may be unused.'
  }, [inputs.investmentLifeYears, metrics])

  const onInputChange = (key: keyof CapExInputs, value: string) => {
    const numeric = Number(value)
    setInputs((prev) => ({ ...prev, [key]: Number.isFinite(numeric) ? numeric : 0 }))
  }

  return (
    <section className='rounded-xl bg-white p-6 shadow-sm'>
      <h2 className='text-lg font-medium'>CapEx Planning</h2>
      <p className='mt-1 text-sm text-slate-600'>Understand how capital investments improve capacity, revenue, and profitability over time.</p>

      <LearningNotes
        title='CapEx Planning'
        purpose='Evaluate whether a capital investment creates sufficient financial return.'
        keyQuestion='Should we invest in new equipment, facilities, or systems?'
        whenToUse={[
          'Capacity expansion',
          'Factory investment',
          'Warehouse expansion',
          'IT system investment',
          'Strategic growth planning',
        ]}
        howToRead={[
          'Compare investment cost against expected benefit',
          'Review payback period',
          'Review ROI',
          'Review capacity improvement',
        ]}
        fpnaTips={[
          'Capacity shortages often trigger CapEx requests.',
          'Fast growth can justify larger investments.',
          'Payback period and ROI are commonly used screening metrics.',
        ]}
        nextAction={[
          'Step 1: Forecast demand',
          'Step 2: Identify capacity gap',
          'Step 3: Evaluate investment options',
          'Step 4: Calculate ROI',
          'Step 5: Make investment decision',
        ]}
      />

      <article className='mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4'>
        <h3 className='text-sm font-semibold text-slate-800'>Input Panel</h3>
        <p className='mt-1 text-xs text-slate-600'>Use a simple annual model to connect capacity expansion with incremental revenue, profit, ROI, and payback.</p>
        <div className='mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4'>
          <label className='text-sm font-medium text-slate-700'>Current Capacity<input className='mt-1 w-full rounded border border-slate-300 bg-white px-2 py-2' type='number' value={inputs.currentCapacity} onChange={(e) => onInputChange('currentCapacity', e.target.value)} /></label>
          <label className='text-sm font-medium text-slate-700'>Forecast Demand<input className='mt-1 w-full rounded border border-slate-300 bg-white px-2 py-2' type='number' value={inputs.forecastDemand} onChange={(e) => onInputChange('forecastDemand', e.target.value)} /></label>
          <label className='text-sm font-medium text-slate-700'>Investment Cost<input className='mt-1 w-full rounded border border-slate-300 bg-white px-2 py-2' type='number' value={inputs.investmentCost} onChange={(e) => onInputChange('investmentCost', e.target.value)} /></label>
          <label className='text-sm font-medium text-slate-700'>Additional Capacity<input className='mt-1 w-full rounded border border-slate-300 bg-white px-2 py-2' type='number' value={inputs.additionalCapacity} onChange={(e) => onInputChange('additionalCapacity', e.target.value)} /></label>
          <label className='text-sm font-medium text-slate-700'>Revenue per Unit<input className='mt-1 w-full rounded border border-slate-300 bg-white px-2 py-2' type='number' value={inputs.revenuePerUnit} onChange={(e) => onInputChange('revenuePerUnit', e.target.value)} /></label>
          <label className='text-sm font-medium text-slate-700'>Contribution Margin %<input className='mt-1 w-full rounded border border-slate-300 bg-white px-2 py-2' type='number' value={inputs.contributionMarginPercent} onChange={(e) => onInputChange('contributionMarginPercent', e.target.value)} /></label>
          <label className='text-sm font-medium text-slate-700'>Investment Life (Years)<input className='mt-1 w-full rounded border border-slate-300 bg-white px-2 py-2' type='number' value={inputs.investmentLifeYears} onChange={(e) => onInputChange('investmentLifeYears', e.target.value)} /></label>
        </div>
      </article>

      <div className='mt-4 grid gap-3 text-sm md:grid-cols-2 lg:grid-cols-3'>
        <div className='rounded-lg border border-blue-200 bg-blue-50 p-3'><div className='text-blue-700'>Current Capacity</div><div className='font-semibold text-blue-900'>{formatNumber(metrics.currentCapacity)} units</div></div>
        <div className='rounded-lg border bg-slate-50 p-3'><div className='text-slate-500'>Forecast Demand</div><div className='font-semibold'>{formatNumber(metrics.forecastDemand)} units</div></div>
        <div className={`rounded-lg border p-3 ${metrics.capacityGap > 0 ? 'border-rose-200 bg-rose-50' : 'border-emerald-200 bg-emerald-50'}`}><div className={metrics.capacityGap > 0 ? 'text-rose-700' : 'text-emerald-700'}>Capacity Gap</div><div className={`font-semibold ${metrics.capacityGap > 0 ? 'text-rose-900' : 'text-emerald-900'}`}>{formatNumber(metrics.capacityGap)} units</div></div>
        <div className='rounded-lg border border-emerald-200 bg-emerald-50 p-3'><div className='text-emerald-700'>New Capacity</div><div className='font-semibold text-emerald-900'>{formatNumber(metrics.newCapacity)} units</div></div>
        <div className='rounded-lg border bg-slate-50 p-3'><div className='text-slate-500'>Additional Revenue</div><div className='font-semibold'>{formatMoney(metrics.additionalRevenue)}</div></div>
        <div className='rounded-lg border border-purple-200 bg-purple-50 p-3'><div className='text-purple-700'>Additional Operating Profit</div><div className='font-semibold text-purple-900'>{formatMoney(metrics.additionalOperatingProfit)}</div></div>
        <div className={`rounded-lg border p-3 ${metrics.annualRoi !== null && metrics.annualRoi >= 0.3 ? 'border-emerald-200 bg-emerald-50' : metrics.annualRoi !== null && metrics.annualRoi >= 0.15 ? 'border-amber-200 bg-amber-50' : 'border-rose-200 bg-rose-50'}`}><div className='text-slate-600'>ROI %</div><div className='font-semibold'>{formatPercent(metrics.annualRoi)}</div></div>
        <div className={`rounded-lg border p-3 ${metrics.paybackPeriod !== null && metrics.paybackPeriod <= inputs.investmentLifeYears ? 'border-emerald-200 bg-emerald-50' : 'border-rose-200 bg-rose-50'}`}><div className='text-slate-600'>Payback Period</div><div className='font-semibold'>{formatPayback(metrics.paybackPeriod)}</div></div>
      </div>

      <article className='mt-4 rounded-lg border border-slate-200 bg-white p-4'>
        <h3 className='text-sm font-semibold text-slate-800'>Calculations</h3>
        <p className='mt-1 text-xs text-slate-600'>These formulas explain how the KPI cards convert capacity assumptions into investment return metrics.</p>
        <div className='mt-3 grid gap-2 text-sm md:grid-cols-2'>
          {[
            ['Capacity Gap', 'Forecast Demand - Current Capacity'],
            ['New Capacity', 'Current Capacity + Additional Capacity'],
            ['Additional Revenue', 'min(Additional Capacity, Capacity Gap) × Revenue per Unit'],
            ['Additional Operating Profit', 'Additional Revenue × Contribution Margin %'],
            ['Annual ROI %', 'Additional Operating Profit / Investment Cost'],
            ['Payback Period', 'Investment Cost / Additional Operating Profit'],
          ].map(([label, formula]) => (
            <div key={label} className='rounded-lg border border-slate-200 bg-slate-50 p-3'>
              <div className='text-xs font-semibold uppercase tracking-wide text-slate-500'>{label}</div>
              <div className='mt-1 font-medium text-slate-900'>{formula}</div>
            </div>
          ))}
        </div>
      </article>


      <article className={`mt-4 rounded-lg border p-4 ${decision.className}`}>
        <h3 className='text-sm font-semibold'>Investment Decision</h3>
        <div className='mt-1 text-lg font-semibold'>{decision.label}</div>
        <p className='mt-1 text-sm'>{decision.description}</p>
      </article>

      <article className='mt-4 rounded-lg border border-slate-200 bg-white p-4'>
        <h3 className='text-sm font-semibold text-slate-800'>Investment Waterfall</h3>
        <p className='mt-1 text-xs text-slate-600'>Follow the logic from capacity shortage to incremental financial return.</p>
        <div className='mt-3 grid gap-3 md:grid-cols-5'>
          {waterfallRows.map((row, index) => (
            <div key={row.label} className='rounded-lg border border-slate-200 bg-slate-50 p-3'>
              <div className='flex items-center justify-between gap-2'>
                <div className='text-xs font-medium uppercase tracking-wide text-slate-500'>{row.label}</div>
                {index < waterfallRows.length - 1 && <div className='text-slate-400'>→</div>}
              </div>
              <div className='mt-2 h-2 rounded-full bg-slate-200'>
                <div className={`h-2 rounded-full ${row.tone}`} style={{ width: `${Math.max(8, (Math.abs(row.value) / maxWaterfallValue) * 100)}%` }} />
              </div>
              <div className='mt-2 text-lg font-semibold text-slate-900'>{row.display}</div>
            </div>
          ))}
        </div>
      </article>

      <article className='mt-4 rounded-lg border border-slate-200 bg-white p-4'>
        <h3 className='text-sm font-semibold text-slate-800'>Scenario Comparison</h3>
        <p className='mt-1 text-xs text-slate-600'>Compare no investment, base investment, and larger expansion options.</p>
        <div className='mt-3 overflow-x-auto'>
          <table className='min-w-full border-collapse text-sm'>
            <thead>
              <tr className='border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500'>
                <th className='px-3 py-2'>Scenario</th>
                <th className='px-3 py-2'>Option</th>
                <th className='px-3 py-2 text-right'>Capacity</th>
                <th className='px-3 py-2 text-right'>Revenue</th>
                <th className='px-3 py-2 text-right'>Operating Profit</th>
                <th className='px-3 py-2 text-right'>ROI %</th>
                <th className='px-3 py-2 text-right'>Payback Period</th>
              </tr>
            </thead>
            <tbody>
              {scenarioRows.map((scenario) => (
                <tr key={scenario.label} className='border-b border-slate-100 last:border-0'>
                  <th className='px-3 py-3 text-left font-medium text-slate-800'>{scenario.label}</th>
                  <td className='px-3 py-3 text-slate-700'>{scenario.description}</td>
                  <td className='px-3 py-3 text-right text-slate-700'>{formatNumber(scenario.capacity)}</td>
                  <td className='px-3 py-3 text-right text-slate-700'>{formatMoney(scenario.revenue)}</td>
                  <td className='px-3 py-3 text-right text-slate-700'>{formatMoney(scenario.operatingProfit)}</td>
                  <td className='px-3 py-3 text-right text-slate-700'>{formatPercent(scenario.roi)}</td>
                  <td className='px-3 py-3 text-right text-slate-700'>{formatPayback(scenario.paybackPeriod)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>

      <article className='mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4'>
        <h3 className='text-sm font-semibold text-amber-900'>Learning Insight</h3>
        <p className='mt-1 text-sm text-amber-900'>{learningInsight}</p>
      </article>

      <article className='mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4'>
        <h3 className='text-sm font-semibold text-slate-800'>Learning Flow</h3>
        <ol className='mt-3 grid gap-2 text-sm text-slate-700 md:grid-cols-5'>
          {[
            'Forecast demand',
            'Identify capacity gap',
            'Evaluate investment options',
            'Calculate ROI',
            'Make investment decision',
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
