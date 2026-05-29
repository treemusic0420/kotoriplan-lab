import { useMemo, useState } from 'react'
import { LearningNotes } from '../shared/LearningNotes'

type WorkforceInputs = {
  currentHeadcount: number
  plannedNewHires: number
  averageMonthlySalary: number
  annualBonusPercent: number
  attritionPercent: number
  vacancyDelayMonths: number
  otherFixedCosts: number
  monthlyRevenue: number
  variableCostRatioPercent: number
}

type TimelineMonth = {
  label: string
  startingHeadcount: number
  newHires: number
  attrition: number
  endingHeadcount: number
  paidHeadcount: number
}

type WorkforceMetrics = {
  timeline: TimelineMonth[]
  salaryCost: number
  bonusCost: number
  workforceCost: number
  averageHeadcount: number
  endingHeadcount: number
  revenue: number
  variableCost: number
  annualOtherFixedCosts: number
  workforceCostRatio: number | null
  operatingProfit: number
  operatingMargin: number | null
}

const initialInputs: WorkforceInputs = {
  currentHeadcount: 50,
  plannedNewHires: 10,
  averageMonthlySalary: 5000,
  annualBonusPercent: 15,
  attritionPercent: 8,
  vacancyDelayMonths: 2,
  otherFixedCosts: 120000,
  monthlyRevenue: 800000,
  variableCostRatioPercent: 45,
}

const months = Array.from({ length: 12 }, (_, index) => `2026-${String(index + 1).padStart(2, '0')}`)

const moneyFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
const numberFormatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 })
const percentFormatter = new Intl.NumberFormat('en-US', { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 })

const formatMoney = (value: number) => moneyFormatter.format(value)
const formatPercent = (value: number | null) => (value === null ? '—' : percentFormatter.format(value))
const safePercent = (value: number) => value / 100

function buildHiringSchedule(plannedNewHires: number) {
  const hires = Math.max(0, plannedNewHires)
  const baseHires = Math.floor(hires / 12)
  const extraHires = Math.round(hires % 12)

  return months.map((_, index) => baseHires + (index < extraHires ? 1 : 0))
}

function calculateMetrics(inputs: WorkforceInputs, plannedNewHires = inputs.plannedNewHires): WorkforceMetrics {
  const hiringSchedule = buildHiringSchedule(plannedNewHires)
  const monthlyAttritionRate = safePercent(inputs.attritionPercent) / 12
  const vacancyDelay = Math.max(0, Math.round(inputs.vacancyDelayMonths))
  const paidHiresByMonth = hiringSchedule.map((_, index) => {
    const sourceIndex = index - vacancyDelay
    return sourceIndex >= 0 ? hiringSchedule[sourceIndex] : 0
  })

  let startingHeadcount = Math.max(0, inputs.currentHeadcount)
  let paidHeadcount = Math.max(0, inputs.currentHeadcount)

  const timeline = months.map((label, index) => {
    const newHires = hiringSchedule[index]
    const paidNewHires = paidHiresByMonth[index]
    const attrition = startingHeadcount * monthlyAttritionRate
    const paidAttrition = paidHeadcount * monthlyAttritionRate
    const endingHeadcount = Math.max(0, startingHeadcount + newHires - attrition)

    paidHeadcount = Math.max(0, paidHeadcount + paidNewHires - paidAttrition)

    const month: TimelineMonth = {
      label,
      startingHeadcount,
      newHires,
      attrition,
      endingHeadcount,
      paidHeadcount,
    }

    startingHeadcount = endingHeadcount
    return month
  })

  const averageHeadcount = timeline.reduce((sum, month) => sum + month.paidHeadcount, 0) / timeline.length
  const salaryCost = timeline.reduce((sum, month) => sum + (month.paidHeadcount * inputs.averageMonthlySalary), 0)
  const bonusCost = salaryCost * safePercent(inputs.annualBonusPercent)
  const workforceCost = salaryCost + bonusCost
  const revenue = inputs.monthlyRevenue * 12
  const variableCost = revenue * safePercent(inputs.variableCostRatioPercent)
  const annualOtherFixedCosts = inputs.otherFixedCosts * 12
  const operatingProfit = revenue - variableCost - workforceCost - annualOtherFixedCosts

  return {
    timeline,
    salaryCost,
    bonusCost,
    workforceCost,
    averageHeadcount,
    endingHeadcount: timeline[timeline.length - 1]?.endingHeadcount ?? inputs.currentHeadcount,
    revenue,
    variableCost,
    annualOtherFixedCosts,
    workforceCostRatio: revenue === 0 ? null : workforceCost / revenue,
    operatingProfit,
    operatingMargin: revenue === 0 ? null : operatingProfit / revenue,
  }
}

export function HeadcountPlanningPage() {
  const [inputs, setInputs] = useState<WorkforceInputs>(initialInputs)

  const metrics = useMemo(() => calculateMetrics(inputs), [inputs])

  const scenarioRows = useMemo(() => [
    { label: 'Conservative Hiring', description: 'Planned hires × 0.5', metrics: calculateMetrics(inputs, inputs.plannedNewHires * 0.5) },
    { label: 'Base Plan', description: 'Current workforce inputs', metrics },
    { label: 'Aggressive Hiring', description: 'Planned hires × 1.5', metrics: calculateMetrics(inputs, inputs.plannedNewHires * 1.5) },
  ], [inputs, metrics])

  const insights = useMemo(() => {
    const items: string[] = []

    if (metrics.operatingMargin !== null && metrics.operatingMargin < 0) {
      items.push('Current hiring plan creates operating losses.')
    }
    if (metrics.workforceCostRatio !== null && metrics.workforceCostRatio > 0.4) {
      items.push('Workforce cost ratio is becoming very high.')
    }
    if (inputs.plannedNewHires >= Math.max(10, inputs.currentHeadcount * 0.2)) {
      items.push('Rapid hiring increases execution capacity but also increases operating leverage risk.')
    }
    if (inputs.vacancyDelayMonths >= 3) {
      items.push('Long hiring delay may reduce short-term costs but can slow execution.')
    }
    if (inputs.attritionPercent > 15) {
      items.push('High attrition may create instability and hidden replacement costs.')
    }
    if (items.length === 0) {
      items.push('Current plan keeps workforce cost and operating margin within a manageable range.')
    }

    return items
  }, [inputs, metrics])

  const leverageRows = [
    { label: 'Revenue', value: metrics.revenue, colorClass: 'bg-slate-500', textClass: 'text-slate-700' },
    { label: 'Variable Cost', value: metrics.variableCost, colorClass: 'bg-blue-400', textClass: 'text-blue-700' },
    { label: 'Workforce Cost', value: metrics.workforceCost, colorClass: 'bg-orange-400', textClass: 'text-orange-700' },
    { label: 'Other Fixed Cost', value: metrics.annualOtherFixedCosts, colorClass: 'bg-slate-400', textClass: 'text-slate-700' },
    { label: 'Operating Profit', value: metrics.operatingProfit, colorClass: metrics.operatingProfit >= 0 ? 'bg-purple-500' : 'bg-rose-500', textClass: metrics.operatingProfit >= 0 ? 'text-purple-700' : 'text-rose-700' },
  ]
  const maxLeverageValue = Math.max(...leverageRows.map((row) => Math.abs(row.value)), 1)

  const onInputChange = (key: keyof WorkforceInputs, value: string) => {
    const numeric = Number(value)
    setInputs((prev) => ({ ...prev, [key]: Number.isFinite(numeric) ? numeric : 0 }))
  }

  return (
    <section className='rounded-xl bg-white p-6 shadow-sm'>
      <h2 className='text-lg font-medium'>Headcount Planning</h2>
      <p className='mt-1 text-sm text-slate-600'>Understand how hiring plans, salary assumptions, and workforce growth impact operating expenses and profitability.</p>

      <LearningNotes
        title='Headcount Planning'
        purpose='Plan workforce growth and understand how personnel costs impact profitability.'
        keyQuestion='How many employees can the business afford while maintaining healthy operating profit?'
        whenToUse={[
          'Annual budget planning',
          'Hiring approval discussions',
          'Workforce expansion review',
          'Operating expense forecasting',
        ]}
        howToRead={[
          'Headcount growth increases fixed costs.',
          'Hiring timing changes monthly expense run-rate.',
          'Salary assumptions directly impact operating margin.',
          'Vacancy delays reduce short-term cost.',
        ]}
        fpnaTips={[
          'Fast-growing companies often become unprofitable due to aggressive hiring.',
          'Workforce planning should align with revenue growth expectations.',
          'Hiring earlier improves execution but increases operating leverage risk.',
        ]}
        nextAction={[
          'Compare operating margin before and after hiring changes.',
          'Review Rolling Forecast after workforce updates.',
          'Use Sensitivity Analysis to test salary inflation impact.',
        ]}
      />

      <article className='mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4'>
        <h3 className='text-sm font-semibold text-slate-800'>Workforce Assumption Panel</h3>
        <p className='mt-1 text-xs text-slate-600'>Monthly salary, revenue, and fixed cost run-rates are annualized for the KPI cards.</p>
        <div className='mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
          <label className='text-sm font-medium text-slate-700'>Current Headcount<input className='mt-1 w-full rounded border border-slate-300 bg-white px-2 py-2' type='number' value={inputs.currentHeadcount} onChange={(e) => onInputChange('currentHeadcount', e.target.value)} /></label>
          <label className='text-sm font-medium text-slate-700'>Planned New Hires<input className='mt-1 w-full rounded border border-slate-300 bg-white px-2 py-2' type='number' value={inputs.plannedNewHires} onChange={(e) => onInputChange('plannedNewHires', e.target.value)} /></label>
          <label className='text-sm font-medium text-slate-700'>Average Monthly Salary<input className='mt-1 w-full rounded border border-slate-300 bg-white px-2 py-2' type='number' value={inputs.averageMonthlySalary} onChange={(e) => onInputChange('averageMonthlySalary', e.target.value)} /></label>
          <label className='text-sm font-medium text-slate-700'>Annual Bonus %<input className='mt-1 w-full rounded border border-slate-300 bg-white px-2 py-2' type='number' value={inputs.annualBonusPercent} onChange={(e) => onInputChange('annualBonusPercent', e.target.value)} /></label>
          <label className='text-sm font-medium text-slate-700'>Attrition %<input className='mt-1 w-full rounded border border-slate-300 bg-white px-2 py-2' type='number' value={inputs.attritionPercent} onChange={(e) => onInputChange('attritionPercent', e.target.value)} /></label>
          <label className='text-sm font-medium text-slate-700'>Vacancy Delay (months)<input className='mt-1 w-full rounded border border-slate-300 bg-white px-2 py-2' type='number' value={inputs.vacancyDelayMonths} onChange={(e) => onInputChange('vacancyDelayMonths', e.target.value)} /></label>
          <label className='text-sm font-medium text-slate-700'>Other Fixed Costs<input className='mt-1 w-full rounded border border-slate-300 bg-white px-2 py-2' type='number' value={inputs.otherFixedCosts} onChange={(e) => onInputChange('otherFixedCosts', e.target.value)} /></label>
          <label className='text-sm font-medium text-slate-700'>Monthly Revenue<input className='mt-1 w-full rounded border border-slate-300 bg-white px-2 py-2' type='number' value={inputs.monthlyRevenue} onChange={(e) => onInputChange('monthlyRevenue', e.target.value)} /></label>
          <label className='text-sm font-medium text-slate-700'>Variable Cost Ratio %<input className='mt-1 w-full rounded border border-slate-300 bg-white px-2 py-2' type='number' value={inputs.variableCostRatioPercent} onChange={(e) => onInputChange('variableCostRatioPercent', e.target.value)} /></label>
        </div>
      </article>

      <div className='mt-4 grid gap-3 text-sm md:grid-cols-2 lg:grid-cols-4'>
        <div className='rounded-lg border border-orange-200 bg-orange-50 p-3'><div className='text-orange-700'>Total Workforce Cost</div><div className='font-semibold text-orange-900'>{formatMoney(metrics.workforceCost)}</div></div>
        <div className='rounded-lg border bg-slate-50 p-3'><div className='text-slate-500'>Salary Cost</div><div className='font-semibold'>{formatMoney(metrics.salaryCost)}</div></div>
        <div className='rounded-lg border bg-slate-50 p-3'><div className='text-slate-500'>Bonus Cost</div><div className='font-semibold'>{formatMoney(metrics.bonusCost)}</div></div>
        <div className='rounded-lg border bg-slate-50 p-3'><div className='text-slate-500'>Average Headcount</div><div className='font-semibold'>{numberFormatter.format(metrics.averageHeadcount)}</div></div>
        <div className='rounded-lg border border-orange-200 bg-orange-50 p-3'><div className='text-orange-700'>Workforce Cost Ratio %</div><div className='font-semibold text-orange-900'>{formatPercent(metrics.workforceCostRatio)}</div></div>
        <div className={`rounded-lg border p-3 ${metrics.operatingProfit >= 0 ? 'border-purple-200 bg-purple-50' : 'border-rose-200 bg-rose-50'}`}><div className={metrics.operatingProfit >= 0 ? 'text-purple-700' : 'text-rose-700'}>Operating Profit</div><div className={`font-semibold ${metrics.operatingProfit >= 0 ? 'text-purple-900' : 'text-rose-900'}`}>{formatMoney(metrics.operatingProfit)}</div></div>
        <div className={`rounded-lg border p-3 ${metrics.operatingProfit >= 0 ? 'border-emerald-200 bg-emerald-50' : 'border-rose-200 bg-rose-50'}`}><div className={metrics.operatingProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}>Operating Margin %</div><div className={`font-semibold ${metrics.operatingProfit >= 0 ? 'text-emerald-900' : 'text-rose-900'}`}>{formatPercent(metrics.operatingMargin)}</div></div>
      </div>

      <article className='mt-4 rounded-lg border border-slate-200 bg-white p-4'>
        <h3 className='text-sm font-semibold text-slate-800'>Workforce Timeline</h3>
        <p className='mt-1 text-xs text-slate-600'>New hires are spread across the year. Salary cost starts after the vacancy delay, while attrition uses a monthly rate from the annual assumption.</p>
        <div className='mt-3 overflow-x-auto'>
          <table className='min-w-full border-collapse text-sm'>
            <thead>
              <tr className='border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500'>
                <th className='sticky left-0 bg-white px-3 py-2'>Metric</th>
                {metrics.timeline.map((month) => <th key={month.label} className='px-3 py-2 text-right'>{month.label}</th>)}
              </tr>
            </thead>
            <tbody>
              {[
                { label: 'Starting Headcount', getValue: (month: TimelineMonth) => month.startingHeadcount },
                { label: 'New Hires', getValue: (month: TimelineMonth) => month.newHires },
                { label: 'Attrition', getValue: (month: TimelineMonth) => month.attrition },
                { label: 'Ending Headcount', getValue: (month: TimelineMonth) => month.endingHeadcount },
              ].map((row) => (
                <tr key={row.label} className='border-b border-slate-100 last:border-0'>
                  <th className='sticky left-0 bg-white px-3 py-3 text-left font-medium text-slate-800'>{row.label}</th>
                  {metrics.timeline.map((month) => <td key={`${row.label}-${month.label}`} className='px-3 py-3 text-right text-slate-700'>{numberFormatter.format(row.getValue(month))}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>

      <article className='mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4'>
        <h3 className='text-sm font-semibold text-amber-900'>Hiring Impact Insight</h3>
        <ul className='mt-2 list-disc space-y-1 pl-5 text-sm text-amber-900'>
          {insights.map((insight) => <li key={insight}>{insight}</li>)}
        </ul>
      </article>

      <article className='mt-4 rounded-lg border border-slate-200 bg-white p-4'>
        <h3 className='text-sm font-semibold text-slate-800'>Hiring Scenario Comparison</h3>
        <p className='mt-1 text-xs text-slate-600'>Compare how hiring pace changes the cost structure and operating margin.</p>
        <div className='mt-3 grid gap-3 md:grid-cols-3'>
          {scenarioRows.map((scenario) => (
            <div key={scenario.label} className='rounded-lg border border-slate-200 bg-slate-50 p-4'>
              <div className='text-sm font-semibold text-slate-900'>{scenario.label}</div>
              <div className='mt-1 text-xs text-slate-500'>{scenario.description}</div>
              <dl className='mt-3 space-y-2 text-sm'>
                <div className='flex justify-between gap-3'><dt className='text-slate-500'>Headcount</dt><dd className='font-medium text-slate-900'>{numberFormatter.format(scenario.metrics.endingHeadcount)}</dd></div>
                <div className='flex justify-between gap-3'><dt className='text-slate-500'>Workforce Cost</dt><dd className='font-medium text-orange-700'>{formatMoney(scenario.metrics.workforceCost)}</dd></div>
                <div className='flex justify-between gap-3'><dt className='text-slate-500'>Operating Profit</dt><dd className={scenario.metrics.operatingProfit >= 0 ? 'font-medium text-purple-700' : 'font-medium text-rose-700'}>{formatMoney(scenario.metrics.operatingProfit)}</dd></div>
                <div className='flex justify-between gap-3'><dt className='text-slate-500'>Operating Margin %</dt><dd className={scenario.metrics.operatingProfit >= 0 ? 'font-medium text-emerald-700' : 'font-medium text-rose-700'}>{formatPercent(scenario.metrics.operatingMargin)}</dd></div>
              </dl>
            </div>
          ))}
        </div>
      </article>

      <article className='mt-4 rounded-lg border border-slate-200 bg-white p-4'>
        <h3 className='text-sm font-semibold text-slate-800'>Operating Leverage Visualization</h3>
        <p className='mt-1 text-xs text-slate-600'>Workforce cost is shown beside revenue and other PL components to make fixed cost leverage easier to see.</p>
        <div className='mt-3 space-y-3'>
          {leverageRows.map((row) => (
            <div key={row.label} className='grid gap-2 sm:grid-cols-[140px_1fr_120px] sm:items-center'>
              <div className={`text-sm font-medium ${row.textClass}`}>{row.label}</div>
              <div className='h-3 rounded-full bg-slate-100'>
                <div className={`h-3 rounded-full ${row.colorClass}`} style={{ width: `${Math.max((Math.abs(row.value) / maxLeverageValue) * 100, 2)}%` }} />
              </div>
              <div className={`text-sm font-semibold sm:text-right ${row.textClass}`}>{formatMoney(row.value)}</div>
            </div>
          ))}
        </div>
      </article>

      <article className='mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4'>
        <h3 className='text-sm font-semibold text-slate-800'>Learning Flow</h3>
        <ol className='mt-3 grid gap-2 text-sm text-slate-700 md:grid-cols-5'>
          {[
            'Estimate revenue growth',
            'Decide hiring pace',
            'Forecast workforce cost',
            'Review operating margin impact',
            'Compare hiring scenarios',
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
