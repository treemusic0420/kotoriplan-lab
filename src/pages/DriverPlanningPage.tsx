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

export function DriverPlanningPage() {
  const [inputs, setInputs] = useState<DriverInputState>(initialInputs)

  const metrics = useMemo(() => {
    const orders = inputs.customers * inputs.ordersPerCustomer
    const revenue = orders * inputs.averageSellingPrice
    const variableCost = orders * inputs.variableCostPerOrder
    const contributionMargin = revenue - variableCost
    const workforceCost = inputs.headcount * inputs.salaryPerEmployee
    const fixedCost = workforceCost + inputs.otherFixedCosts
    const operatingProfit = revenue - variableCost - fixedCost

    const contributionMarginRate = revenue === 0 ? null : contributionMargin / revenue
    const operatingMarginRate = revenue === 0 ? null : operatingProfit / revenue

    return {
      orders,
      revenue,
      variableCost,
      contributionMargin,
      fixedCost,
      operatingProfit,
      contributionMarginRate,
      operatingMarginRate,
    }
  }, [inputs])

  const insight = useMemo(() => {
    if (metrics.operatingProfit < 0) {
      return 'Operating profit is negative. Review price, volume, variable cost, or fixed cost assumptions.'
    }

    if (
      metrics.contributionMarginRate !== null
      && metrics.contributionMarginRate >= 0.4
      && metrics.operatingProfit <= 0
    ) {
      return 'Contribution margin is healthy, but fixed costs may be too high.'
    }

    if (metrics.operatingMarginRate !== null && metrics.operatingMarginRate < 0.1) {
      return 'Operating margin is low. Consider improving pricing, reducing variable cost, or controlling fixed cost.'
    }

    return 'This driver set produces positive operating profit.'
  }, [metrics])

  const onInputChange = (key: keyof DriverInputState, value: string) => {
    const numeric = Number(value)
    setInputs((prev) => ({ ...prev, [key]: Number.isFinite(numeric) ? numeric : 0 }))
  }

  return (
    <section className='rounded-xl bg-white p-6 shadow-sm'>
      <h2 className='text-lg font-medium'>Driver-Based Planning</h2>
      <p className='mt-1 text-sm text-slate-600'>Understand how business drivers such as customers, price, volume, headcount, and cost rates create revenue, cost, and profit.</p>

      <LearningNotes
        title='Driver-Based Planning'
        purpose='Explain how financial outcomes are created from operational drivers.'
        keyQuestion='Which business levers should management change to improve revenue, cost, and profit?'
        whenToUse={[
          'When building a budget or forecast.',
          'When explaining how operational assumptions affect PL.',
          'When comparing multiple scenarios.',
        ]}
        howToRead={[
          'Start from business volume drivers.',
          'Convert volume into revenue.',
          'Estimate variable costs from activity or unit cost drivers.',
          'Estimate fixed costs from capacity or headcount assumptions.',
          'Review the resulting profit impact.',
        ]}
        fpnaTips={[
          'Driver-based planning connects operational assumptions to financial results.',
          'Good drivers should be understandable by business teams.',
          'Avoid too many drivers at first; focus on the few that explain most of the PL movement.',
        ]}
        nextAction={[
          'Use PL View to check the financial result.',
          'Use PL Variance to compare the result against plan.',
          'Use PL Bridge to explain profit movement.',
        ]}
      />

      <div className='mt-4 grid gap-4 lg:grid-cols-2'>
        <article className='rounded-lg border border-slate-200 bg-slate-50 p-4'>
          <h3 className='text-sm font-semibold text-slate-800'>Driver Tree</h3>
          <div className='mt-2 space-y-2 text-sm text-slate-700'>
            <p className='font-medium'>Revenue</p>
            <ul className='space-y-1 pl-5'>
              <li>↳ Customers</li>
              <li>↳ Orders per Customer</li>
              <li>↳ Average Selling Price</li>
            </ul>
            <p className='font-medium'>Variable Cost</p>
            <ul className='space-y-1 pl-5'>
              <li>↳ Units Sold</li>
              <li>↳ Variable Cost per Unit</li>
            </ul>
            <p className='font-medium'>Workforce / Fixed Cost</p>
            <ul className='space-y-1 pl-5'>
              <li>↳ Headcount</li>
              <li>↳ Salary per Employee</li>
              <li>↳ Other Fixed Costs</li>
            </ul>
            <p className='font-medium'>Profit</p>
            <ul className='space-y-1 pl-5'>
              <li>↳ Revenue - Variable Cost - Fixed Cost</li>
            </ul>
          </div>
        </article>

        <article className='rounded-lg border border-slate-200 bg-white p-4'>
          <h3 className='text-sm font-semibold text-slate-800'>Simple Driver Simulator</h3>
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
      </div>

      <div className='mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-4 text-sm'>
        <div className='rounded-lg border bg-slate-50 p-3'><div className='text-slate-500'>Revenue</div><div className='font-semibold'>{moneyFormatter.format(metrics.revenue)}</div></div>
        <div className='rounded-lg border bg-slate-50 p-3'><div className='text-slate-500'>Variable Cost</div><div className='font-semibold'>{moneyFormatter.format(metrics.variableCost)}</div></div>
        <div className='rounded-lg border bg-slate-50 p-3'><div className='text-slate-500'>Contribution Margin</div><div className='font-semibold'>{moneyFormatter.format(metrics.contributionMargin)}</div></div>
        <div className='rounded-lg border bg-slate-50 p-3'><div className='text-slate-500'>Fixed Cost</div><div className='font-semibold'>{moneyFormatter.format(metrics.fixedCost)}</div></div>
        <div className='rounded-lg border bg-slate-50 p-3'><div className='text-slate-500'>Operating Profit</div><div className='font-semibold'>{moneyFormatter.format(metrics.operatingProfit)}</div></div>
        <div className='rounded-lg border bg-slate-50 p-3'><div className='text-slate-500'>Contribution Margin %</div><div className='font-semibold'>{formatPercent(metrics.contributionMarginRate)}</div></div>
        <div className='rounded-lg border bg-slate-50 p-3'><div className='text-slate-500'>Operating Margin %</div><div className='font-semibold'>{formatPercent(metrics.operatingMarginRate)}</div></div>
      </div>

      <article className='mt-4 rounded-lg border border-slate-200 bg-amber-50 p-4'>
        <h3 className='text-sm font-semibold text-slate-800'>Scenario Insight</h3>
        <p className='mt-1 text-sm text-slate-700'>{insight}</p>
      </article>

      <article className='mt-4 rounded-lg border border-slate-200 bg-white p-4'>
        <h3 className='text-sm font-semibold text-slate-800'>Suggested Learning Flow</h3>
        <ol className='mt-2 list-decimal space-y-1 pl-5 text-sm text-slate-700'>
          <li>Step 1: Adjust drivers here</li>
          <li>Step 2: Review PL View</li>
          <li>Step 3: Compare scenarios</li>
          <li>Step 4: Explain variance using PL Bridge</li>
        </ol>
      </article>
    </section>
  )
}
