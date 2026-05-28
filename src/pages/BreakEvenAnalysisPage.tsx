import { useMemo, useState } from 'react'
import { LearningNotes } from '../shared/LearningNotes'

type DriverInputState = {
  customers: number
  ordersPerCustomer: number
  averageSellingPrice: number
  variableCostPerOrder: number
  headcount: number
  salaryPerEmployee: number
  otherFixedCosts: number
}

const initialInputs: DriverInputState = {
  customers: 100,
  ordersPerCustomer: 12,
  averageSellingPrice: 50,
  variableCostPerOrder: 20,
  headcount: 8,
  salaryPerEmployee: 60000,
  otherFixedCosts: 120000,
}

const moneyFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
const percentFormatter = new Intl.NumberFormat('en-US', { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 })

const formatPercent = (value: number | null) => (value === null ? '—' : percentFormatter.format(value))

export function BreakEvenAnalysisPage() {
  const [inputs, setInputs] = useState<DriverInputState>(initialInputs)

  const metrics = useMemo(() => {
    const orders = inputs.customers * inputs.ordersPerCustomer
    const revenue = orders * inputs.averageSellingPrice
    const variableCost = orders * inputs.variableCostPerOrder
    const contributionMargin = revenue - variableCost
    const fixedCost = (inputs.headcount * inputs.salaryPerEmployee) + inputs.otherFixedCosts
    const operatingProfit = contributionMargin - fixedCost
    const contributionMarginRatio = revenue === 0 ? null : contributionMargin / revenue

    const breakEvenRevenue = contributionMarginRatio !== null && contributionMarginRatio > 0
      ? fixedCost / contributionMarginRatio
      : null

    const revenuePerCustomer = inputs.ordersPerCustomer * inputs.averageSellingPrice
    const breakEvenCustomers = breakEvenRevenue !== null && revenuePerCustomer > 0
      ? breakEvenRevenue / revenuePerCustomer
      : null

    const safetyMargin = revenue > 0 && breakEvenRevenue !== null
      ? (revenue - breakEvenRevenue) / revenue
      : null

    return {
      revenue,
      variableCost,
      contributionMargin,
      fixedCost,
      operatingProfit,
      contributionMarginRatio,
      breakEvenRevenue,
      breakEvenCustomers,
      safetyMargin,
    }
  }, [inputs])

  const breakEvenAchievable = metrics.breakEvenRevenue !== null
  const gaugeIsProfitable = metrics.operatingProfit >= 0
  const gaugeMax = Math.max(metrics.revenue, metrics.breakEvenRevenue ?? 0, 1)
  const currentRevenueWidth = `${Math.min((metrics.revenue / gaugeMax) * 100, 100)}%`
  const breakEvenMarkerPosition = `${Math.min(((metrics.breakEvenRevenue ?? 0) / gaugeMax) * 100, 100)}%`

  const insights = useMemo(() => {
    const items: string[] = []

    if (metrics.revenue > 0 && metrics.fixedCost / metrics.revenue > 0.35) {
      items.push('This business has high operating leverage.')
    }
    if (metrics.contributionMarginRatio !== null && metrics.contributionMarginRatio >= 0.5) {
      items.push('A strong contribution margin lowers break-even risk.')
    }
    if (metrics.safetyMargin !== null && metrics.safetyMargin < 0.1) {
      items.push('This business has a thin safety margin.')
    }
    if (metrics.operatingProfit < 0) {
      items.push('Current revenue is below the break-even point.')
    }
    if (items.length === 0) {
      items.push('Current assumptions show a healthy margin above break-even.')
    }

    return items
  }, [metrics])

  const onInputChange = (key: keyof DriverInputState, value: string) => {
    const numeric = Number(value)
    setInputs((prev) => ({ ...prev, [key]: Number.isFinite(numeric) ? numeric : 0 }))
  }

  return (
    <section className='rounded-xl bg-white p-6 shadow-sm'>
      <h2 className='text-lg font-medium'>Break-even Analysis</h2>
      <p className='mt-1 text-sm text-slate-600'>Understand how much revenue, volume, and contribution margin are required to cover fixed costs and become profitable.</p>

      <LearningNotes
        title='Break-even Analysis'
        purpose='Understand the minimum sales level required to avoid operating losses.'
        keyQuestion='How much revenue and customer volume are required to cover fixed costs and reach operating profit of zero?'
        whenToUse={[
          'Pricing discussions',
          'Cost reduction planning',
          'New business evaluation',
          'Budget planning',
        ]}
        howToRead={[
          'Contribution margin covers fixed costs first',
          'Break-even point is where operating profit becomes zero',
          'Higher fixed costs increase risk',
        ]}
        fpnaTips={[
          'Fast-growing companies often increase fixed costs before revenue catches up.',
          'A strong contribution margin lowers break-even risk.',
        ]}
        nextAction={[
          'Test price and cost assumptions to see break-even movement.',
          'Compare break-even risk across scenarios.',
          'Use safety margin to discuss downside resilience.',
        ]}
      />

      <article className='mt-4 rounded-lg border border-slate-200 bg-white p-4'>
        <h3 className='text-sm font-semibold text-slate-800'>Driver Inputs</h3>
        <div className='mt-3 grid gap-3 sm:grid-cols-2'>
          <label className='text-sm'>Customers<input className='mt-1 w-full rounded border px-2 py-1' type='number' value={inputs.customers} onChange={(e) => onInputChange('customers', e.target.value)} /></label>
          <label className='text-sm'>Orders per Customer<input className='mt-1 w-full rounded border px-2 py-1' type='number' value={inputs.ordersPerCustomer} onChange={(e) => onInputChange('ordersPerCustomer', e.target.value)} /></label>
          <label className='text-sm'>Average Selling Price<input className='mt-1 w-full rounded border px-2 py-1' type='number' value={inputs.averageSellingPrice} onChange={(e) => onInputChange('averageSellingPrice', e.target.value)} /></label>
          <label className='text-sm'>Variable Cost per Order<input className='mt-1 w-full rounded border px-2 py-1' type='number' value={inputs.variableCostPerOrder} onChange={(e) => onInputChange('variableCostPerOrder', e.target.value)} /></label>
          <label className='text-sm'>Headcount<input className='mt-1 w-full rounded border px-2 py-1' type='number' value={inputs.headcount} onChange={(e) => onInputChange('headcount', e.target.value)} /></label>
          <label className='text-sm'>Salary per Employee<input className='mt-1 w-full rounded border px-2 py-1' type='number' value={inputs.salaryPerEmployee} onChange={(e) => onInputChange('salaryPerEmployee', e.target.value)} /></label>
          <label className='text-sm sm:col-span-2'>Other Fixed Costs<input className='mt-1 w-full rounded border px-2 py-1' type='number' value={inputs.otherFixedCosts} onChange={(e) => onInputChange('otherFixedCosts', e.target.value)} /></label>
        </div>
      </article>

      <div className='mt-4 grid gap-3 text-sm md:grid-cols-2 lg:grid-cols-3'>
        <div className='rounded-lg border bg-slate-50 p-3'><div className='text-slate-500'>Revenue</div><div className='font-semibold'>{moneyFormatter.format(metrics.revenue)}</div></div>
        <div className='rounded-lg border bg-slate-50 p-3'><div className='text-slate-500'>Variable Cost</div><div className='font-semibold'>{moneyFormatter.format(metrics.variableCost)}</div></div>
        <div className='rounded-lg border border-emerald-200 bg-emerald-50 p-3'><div className='text-emerald-700'>Contribution Margin</div><div className='font-semibold text-emerald-900'>{moneyFormatter.format(metrics.contributionMargin)}</div></div>
        <div className='rounded-lg border bg-slate-50 p-3'><div className='text-slate-500'>Fixed Cost</div><div className='font-semibold'>{moneyFormatter.format(metrics.fixedCost)}</div></div>
        <div className='rounded-lg border border-indigo-200 bg-indigo-50 p-3'><div className='text-indigo-700'>Operating Profit</div><div className='font-semibold text-indigo-900'>{moneyFormatter.format(metrics.operatingProfit)}</div></div>
        <div className='rounded-lg border border-emerald-200 bg-emerald-50 p-3'><div className='text-emerald-700'>Contribution Margin %</div><div className='font-semibold text-emerald-900'>{formatPercent(metrics.contributionMarginRatio)}</div></div>
        <div className='rounded-lg border border-amber-200 bg-amber-50 p-3'><div className='text-amber-700'>Break-even Revenue</div><div className='font-semibold text-amber-900'>{breakEvenAchievable ? moneyFormatter.format(metrics.breakEvenRevenue as number) : 'Not achievable'}</div></div>
        <div className='rounded-lg border border-amber-200 bg-amber-50 p-3'><div className='text-amber-700'>Break-even Customers</div><div className='font-semibold text-amber-900'>{breakEvenAchievable && metrics.breakEvenCustomers !== null ? metrics.breakEvenCustomers.toLocaleString('en-US', { maximumFractionDigits: 1 }) : 'Not achievable'}</div></div>
        <div className='rounded-lg border border-amber-200 bg-amber-50 p-3'><div className='text-amber-700'>Safety Margin %</div><div className='font-semibold text-amber-900'>{metrics.revenue <= 0 ? '—' : formatPercent(metrics.safetyMargin)}</div></div>
      </div>

      <article className='mt-4 rounded-lg border border-slate-200 bg-white p-4'>
        <h3 className='text-sm font-semibold text-slate-800'>Break-even Gauge</h3>
        {!breakEvenAchievable ? (
          <p className='mt-2 text-sm text-rose-700'>Break-even is not achievable with the current contribution margin ratio.</p>
        ) : (
          <>
            <div className='mt-3 rounded-full bg-slate-100 p-1'>
              <div className={`relative h-5 rounded-full ${gaugeIsProfitable ? 'bg-emerald-100' : 'bg-rose-100'}`}>
                <div className={`h-5 rounded-full ${gaugeIsProfitable ? 'bg-emerald-500' : 'bg-rose-500'}`} style={{ width: currentRevenueWidth }} />
                <div className='absolute inset-y-0 w-1 -translate-x-1/2 bg-slate-800' style={{ left: breakEvenMarkerPosition }} aria-label='Break-even marker' />
              </div>
            </div>
            <div className='mt-2 flex justify-between text-xs text-slate-600'>
              <span>Current Revenue: {moneyFormatter.format(metrics.revenue)}</span>
              <span>Break-even Revenue: {moneyFormatter.format(metrics.breakEvenRevenue as number)}</span>
            </div>
          </>
        )}
      </article>

      <article className='mt-4 rounded-lg border border-slate-200 bg-amber-50 p-4'>
        <h3 className='text-sm font-semibold text-slate-800'>Operating Leverage Insight</h3>
        <ul className='mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700'>
          {insights.map((insight) => <li key={insight}>{insight}</li>)}
        </ul>
      </article>

      <article className='mt-4 rounded-lg border border-slate-200 bg-white p-4'>
        <h3 className='text-sm font-semibold text-slate-800'>Scenario Interpretation</h3>
        <div className='mt-3 grid gap-3 md:grid-cols-3'>
          <div className='rounded border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700'>If revenue falls below break-even revenue, operating losses begin.</div>
          <div className='rounded border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700'>Increasing ASP improves contribution margin and lowers break-even risk.</div>
          <div className='rounded border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700'>Reducing fixed costs lowers the minimum revenue required for profitability.</div>
        </div>
      </article>
    </section>
  )
}
