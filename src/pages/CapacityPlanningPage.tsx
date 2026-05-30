import { useMemo, useState } from 'react'
import { LearningNotes } from '../shared/LearningNotes'

type CapacityInputs = {
  forecastDemandUnits: number
  capacityPerMachine: number
  numberOfMachines: number
  plannedNewMachines: number
  utilizationTargetPercent: number
  revenuePerUnit: number
  variableCostPerUnit: number
  annualFixedCost: number
}

type MonthlyCapacityRow = {
  month: string
  demand: number
  capacity: number
  utilization: number | null
}

type CapacityMetrics = {
  availableCapacity: number
  demand: number
  utilization: number | null
  capacityGap: number
  revenue: number
  variableCost: number
  operatingProfit: number
}

type CapacityScenario = {
  label: string
  description: string
  machines: number
  metrics: CapacityMetrics
}

const initialInputs: CapacityInputs = {
  forecastDemandUnits: 100000,
  capacityPerMachine: 12000,
  numberOfMachines: 8,
  plannedNewMachines: 2,
  utilizationTargetPercent: 85,
  revenuePerUnit: 50,
  variableCostPerUnit: 20,
  annualFixedCost: 1500000,
}

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const moneyFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
const unitFormatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 })
const numberFormatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 })
const percentFormatter = new Intl.NumberFormat('en-US', { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 })

const formatMoney = (value: number) => moneyFormatter.format(value)
const formatUnits = (value: number) => unitFormatter.format(value)
const formatNumber = (value: number) => numberFormatter.format(value)
const formatPercent = (value: number | null) => (value === null ? '—' : percentFormatter.format(value))

function calculateMetrics(inputs: CapacityInputs, plannedNewMachines = inputs.plannedNewMachines): CapacityMetrics {
  const availableCapacity = Math.max(0, (inputs.numberOfMachines + plannedNewMachines) * inputs.capacityPerMachine)
  const demand = Math.max(0, inputs.forecastDemandUnits)
  const revenue = demand * inputs.revenuePerUnit
  const variableCost = demand * inputs.variableCostPerUnit

  return {
    availableCapacity,
    demand,
    utilization: availableCapacity === 0 ? null : demand / availableCapacity,
    capacityGap: availableCapacity - demand,
    revenue,
    variableCost,
    operatingProfit: revenue - variableCost - inputs.annualFixedCost,
  }
}

function getCapacityHealth(utilization: number | null) {
  if (utilization === null) {
    return {
      label: 'Capacity Not Available',
      description: 'Add productive capacity before confirming the demand plan.',
      className: 'border-rose-200 bg-rose-50 text-rose-900',
    }
  }
  if (utilization < 0.7) {
    return {
      label: 'Excess Capacity',
      description: 'Utilization is below 70%; existing assets may be underused.',
      className: 'border-blue-200 bg-blue-50 text-blue-900',
    }
  }
  if (utilization <= 0.9) {
    return {
      label: 'Healthy Capacity',
      description: 'Capacity is being used efficiently while leaving a practical buffer.',
      className: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    }
  }

  return {
    label: 'Capacity Constraint Risk',
    description: 'Very high utilization creates delivery risk and may cap revenue growth.',
    className: 'border-rose-200 bg-rose-50 text-rose-900',
  }
}

function getBottleneckStatus(utilization: number | null) {
  if (utilization === null || utilization > 0.9) {
    return { label: 'Red', className: 'bg-rose-100 text-rose-700' }
  }
  if (utilization >= 0.8) {
    return { label: 'Yellow', className: 'bg-amber-100 text-amber-700' }
  }
  return { label: 'Green', className: 'bg-emerald-100 text-emerald-700' }
}

function buildMonthlyRows(inputs: CapacityInputs, availableCapacity: number): MonthlyCapacityRow[] {
  const baseMonthlyDemand = Math.max(0, inputs.forecastDemandUnits) / 12
  const startingDemand = baseMonthlyDemand * 0.9
  const monthlyStep = baseMonthlyDemand === 0 ? 0 : (baseMonthlyDemand * 0.2) / 11
  const monthlyCapacity = availableCapacity / 12

  return months.map((month, index) => {
    const demand = startingDemand + (monthlyStep * index)
    return {
      month,
      demand,
      capacity: monthlyCapacity,
      utilization: monthlyCapacity === 0 ? null : demand / monthlyCapacity,
    }
  })
}

export function CapacityPlanningPage() {
  const [inputs, setInputs] = useState<CapacityInputs>(initialInputs)

  const metrics = useMemo(() => calculateMetrics(inputs), [inputs])
  const monthlyRows = useMemo(() => buildMonthlyRows(inputs, metrics.availableCapacity), [inputs, metrics.availableCapacity])
  const health = useMemo(() => getCapacityHealth(metrics.utilization), [metrics.utilization])

  const scenarioRows = useMemo<CapacityScenario[]>(() => [
    { label: 'Scenario A', description: 'Current Machines', machines: inputs.numberOfMachines, metrics: calculateMetrics(inputs, 0) },
    { label: 'Scenario B', description: '+1 Machine', machines: inputs.numberOfMachines + 1, metrics: calculateMetrics(inputs, 1) },
    { label: 'Scenario C', description: '+3 Machines', machines: inputs.numberOfMachines + 3, metrics: calculateMetrics(inputs, 3) },
  ], [inputs])

  const learningInsight = useMemo(() => {
    if (metrics.availableCapacity === 0 || metrics.capacityGap < 0 || (metrics.utilization !== null && metrics.utilization > 0.9)) {
      return 'Demand exceeds practical capacity. Consider adding machines or improving productivity.'
    }
    if (metrics.utilization !== null && metrics.utilization < (inputs.utilizationTargetPercent / 100)) {
      return 'Utilization is below target. Existing assets may be underused.'
    }
    return 'Capacity is aligned with demand and leaves room for operational variation.'
  }, [inputs.utilizationTargetPercent, metrics])

  const onInputChange = (key: keyof CapacityInputs, value: string) => {
    const numeric = Number(value)
    setInputs((prev) => ({ ...prev, [key]: Number.isFinite(numeric) ? numeric : 0 }))
  }

  return (
    <section className='rounded-xl bg-white p-6 shadow-sm'>
      <h2 className='text-lg font-medium'>Capacity Planning</h2>
      <p className='mt-1 text-sm text-slate-600'>Understand how demand, production capacity, utilization, and bottlenecks impact revenue and operating performance.</p>

      <LearningNotes
        title='Capacity Planning'
        purpose='Understand whether available capacity can support forecast demand.'
        keyQuestion='Do we have enough production or delivery capacity to meet demand?'
        whenToUse={[
          'Annual planning',
          'Demand growth analysis',
          'Manufacturing planning',
          'Service delivery planning',
          'Expansion investment decisions',
        ]}
        howToRead={[
          'Compare demand against available capacity',
          'Review utilization %',
          'Identify bottlenecks',
          'Evaluate expansion requirements',
        ]}
        fpnaTips={[
          'Very low utilization indicates excess capacity.',
          'Very high utilization creates delivery risk.',
          'Bottlenecks often appear before revenue problems.',
        ]}
        nextAction={[
          'Step 1: Forecast demand',
          'Step 2: Measure capacity',
          'Step 3: Calculate utilization',
          'Step 4: Identify bottlenecks',
          'Step 5: Evaluate expansion options',
        ]}
      />

      <article className='mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4'>
        <h3 className='text-sm font-semibold text-slate-800'>Input Panel</h3>
        <p className='mt-1 text-xs text-slate-600'>Annual demand and annual cost inputs are converted into capacity, utilization, revenue, and profit indicators.</p>
        <div className='mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4'>
          <label className='text-sm font-medium text-slate-700'>Forecast Demand Units<input className='mt-1 w-full rounded border border-slate-300 bg-white px-2 py-2' type='number' value={inputs.forecastDemandUnits} onChange={(e) => onInputChange('forecastDemandUnits', e.target.value)} /></label>
          <label className='text-sm font-medium text-slate-700'>Capacity per Machine<input className='mt-1 w-full rounded border border-slate-300 bg-white px-2 py-2' type='number' value={inputs.capacityPerMachine} onChange={(e) => onInputChange('capacityPerMachine', e.target.value)} /></label>
          <label className='text-sm font-medium text-slate-700'>Number of Machines<input className='mt-1 w-full rounded border border-slate-300 bg-white px-2 py-2' type='number' value={inputs.numberOfMachines} onChange={(e) => onInputChange('numberOfMachines', e.target.value)} /></label>
          <label className='text-sm font-medium text-slate-700'>Planned New Machines<input className='mt-1 w-full rounded border border-slate-300 bg-white px-2 py-2' type='number' value={inputs.plannedNewMachines} onChange={(e) => onInputChange('plannedNewMachines', e.target.value)} /></label>
          <label className='text-sm font-medium text-slate-700'>Utilization Target %<input className='mt-1 w-full rounded border border-slate-300 bg-white px-2 py-2' type='number' value={inputs.utilizationTargetPercent} onChange={(e) => onInputChange('utilizationTargetPercent', e.target.value)} /></label>
          <label className='text-sm font-medium text-slate-700'>Revenue per Unit<input className='mt-1 w-full rounded border border-slate-300 bg-white px-2 py-2' type='number' value={inputs.revenuePerUnit} onChange={(e) => onInputChange('revenuePerUnit', e.target.value)} /></label>
          <label className='text-sm font-medium text-slate-700'>Variable Cost per Unit<input className='mt-1 w-full rounded border border-slate-300 bg-white px-2 py-2' type='number' value={inputs.variableCostPerUnit} onChange={(e) => onInputChange('variableCostPerUnit', e.target.value)} /></label>
          <label className='text-sm font-medium text-slate-700'>Annual Fixed Cost<input className='mt-1 w-full rounded border border-slate-300 bg-white px-2 py-2' type='number' value={inputs.annualFixedCost} onChange={(e) => onInputChange('annualFixedCost', e.target.value)} /></label>
        </div>
      </article>

      <div className='mt-4 grid gap-3 text-sm md:grid-cols-2 lg:grid-cols-3'>
        <div className='rounded-lg border border-blue-200 bg-blue-50 p-3'><div className='text-blue-700'>Available Capacity</div><div className='font-semibold text-blue-900'>{formatUnits(metrics.availableCapacity)} units</div></div>
        <div className='rounded-lg border bg-slate-50 p-3'><div className='text-slate-500'>Demand</div><div className='font-semibold'>{formatUnits(metrics.demand)} units</div></div>
        <div className={`rounded-lg border p-3 ${metrics.utilization !== null && metrics.utilization > 0.9 ? 'border-rose-200 bg-rose-50' : 'border-emerald-200 bg-emerald-50'}`}><div className={metrics.utilization !== null && metrics.utilization > 0.9 ? 'text-rose-700' : 'text-emerald-700'}>Utilization %</div><div className={`font-semibold ${metrics.utilization !== null && metrics.utilization > 0.9 ? 'text-rose-900' : 'text-emerald-900'}`}>{formatPercent(metrics.utilization)}</div></div>
        <div className={`rounded-lg border p-3 ${metrics.capacityGap < 0 ? 'border-rose-200 bg-rose-50' : 'border-slate-200 bg-slate-50'}`}><div className={metrics.capacityGap < 0 ? 'text-rose-700' : 'text-slate-500'}>Capacity Gap</div><div className={`font-semibold ${metrics.capacityGap < 0 ? 'text-rose-900' : 'text-slate-900'}`}>{formatUnits(metrics.capacityGap)} units</div></div>
        <div className='rounded-lg border bg-slate-50 p-3'><div className='text-slate-500'>Revenue</div><div className='font-semibold'>{formatMoney(metrics.revenue)}</div></div>
        <div className={`rounded-lg border p-3 ${metrics.operatingProfit >= 0 ? 'border-purple-200 bg-purple-50' : 'border-rose-200 bg-rose-50'}`}><div className={metrics.operatingProfit >= 0 ? 'text-purple-700' : 'text-rose-700'}>Operating Profit</div><div className={`font-semibold ${metrics.operatingProfit >= 0 ? 'text-purple-900' : 'text-rose-900'}`}>{formatMoney(metrics.operatingProfit)}</div></div>
      </div>

      <article className={`mt-4 rounded-lg border p-4 ${health.className}`}>
        <h3 className='text-sm font-semibold'>Capacity Health</h3>
        <div className='mt-1 text-lg font-semibold'>{health.label}</div>
        <p className='mt-1 text-sm'>{health.description}</p>
      </article>

      <article className='mt-4 rounded-lg border border-slate-200 bg-white p-4'>
        <h3 className='text-sm font-semibold text-slate-800'>Monthly Capacity Table</h3>
        <p className='mt-1 text-xs text-slate-600'>Demand increases gradually across Jan-Dec while capacity stays fixed.</p>
        <div className='mt-3 overflow-x-auto'>
          <table className='min-w-full border-collapse text-sm'>
            <thead>
              <tr className='border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500'>
                <th className='px-3 py-2'>Month</th>
                <th className='px-3 py-2 text-right'>Demand</th>
                <th className='px-3 py-2 text-right'>Capacity</th>
                <th className='px-3 py-2 text-right'>Utilization %</th>
                <th className='px-3 py-2 text-right'>Bottleneck Analysis</th>
              </tr>
            </thead>
            <tbody>
              {monthlyRows.map((row) => {
                const bottleneck = getBottleneckStatus(row.utilization)
                return (
                  <tr key={row.month} className='border-b border-slate-100 last:border-0'>
                    <th className='px-3 py-3 text-left font-medium text-slate-800'>{row.month}</th>
                    <td className='px-3 py-3 text-right text-slate-700'>{formatNumber(row.demand)}</td>
                    <td className='px-3 py-3 text-right text-slate-700'>{formatNumber(row.capacity)}</td>
                    <td className='px-3 py-3 text-right text-slate-700'>{formatPercent(row.utilization)}</td>
                    <td className='px-3 py-3 text-right'><span className={`rounded-full px-2 py-1 text-xs font-medium ${bottleneck.className}`}>{bottleneck.label}</span></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </article>

      <article className='mt-4 rounded-lg border border-slate-200 bg-white p-4'>
        <h3 className='text-sm font-semibold text-slate-800'>Capacity Expansion Scenario</h3>
        <p className='mt-1 text-xs text-slate-600'>Compare current capacity with additional machine investments.</p>
        <div className='mt-3 grid gap-3 md:grid-cols-3'>
          {scenarioRows.map((scenario) => (
            <div key={scenario.label} className='rounded-lg border border-slate-200 bg-slate-50 p-4'>
              <div className='text-sm font-semibold text-slate-900'>{scenario.label}</div>
              <div className='mt-1 text-xs text-slate-500'>{scenario.description}</div>
              <dl className='mt-3 space-y-2 text-sm'>
                <div className='flex justify-between gap-3'><dt className='text-slate-500'>Machines</dt><dd className='font-medium text-slate-900'>{formatUnits(scenario.machines)}</dd></div>
                <div className='flex justify-between gap-3'><dt className='text-slate-500'>Utilization %</dt><dd className={scenario.metrics.utilization !== null && scenario.metrics.utilization > 0.9 ? 'font-medium text-rose-700' : 'font-medium text-emerald-700'}>{formatPercent(scenario.metrics.utilization)}</dd></div>
                <div className='flex justify-between gap-3'><dt className='text-slate-500'>Revenue</dt><dd className='font-medium text-slate-900'>{formatMoney(scenario.metrics.revenue)}</dd></div>
                <div className='flex justify-between gap-3'><dt className='text-slate-500'>Operating Profit</dt><dd className={scenario.metrics.operatingProfit >= 0 ? 'font-medium text-purple-700' : 'font-medium text-rose-700'}>{formatMoney(scenario.metrics.operatingProfit)}</dd></div>
              </dl>
            </div>
          ))}
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
            'Measure capacity',
            'Calculate utilization',
            'Identify bottlenecks',
            'Evaluate expansion options',
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
