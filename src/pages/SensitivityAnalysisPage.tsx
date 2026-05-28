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

type SensitivityDriverKey = keyof Pick<
  DriverInputState,
  'customers' | 'ordersPerCustomer' | 'averageSellingPrice' | 'variableCostPerOrder' | 'headcount' | 'salaryPerEmployee'
>

const initialInputs: DriverInputState = {
  customers: 100,
  ordersPerCustomer: 12,
  averageSellingPrice: 50,
  variableCostPerOrder: 20,
  headcount: 8,
  salaryPerEmployee: 60000,
  otherFixedCosts: 120000,
}

const sensitivityDriverOptions: { key: SensitivityDriverKey, label: string }[] = [
  { key: 'customers', label: 'Customers' },
  { key: 'ordersPerCustomer', label: 'Orders per Customer' },
  { key: 'averageSellingPrice', label: 'Average Selling Price' },
  { key: 'variableCostPerOrder', label: 'Variable Cost per Order' },
  { key: 'headcount', label: 'Headcount' },
  { key: 'salaryPerEmployee', label: 'Salary per Employee' },
]

const changeRange = [-0.2, -0.1, -0.05, 0, 0.05, 0.1, 0.2]

const moneyFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
const percentFormatter = new Intl.NumberFormat('en-US', { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 })
const changeFormatter = new Intl.NumberFormat('en-US', { style: 'percent', minimumFractionDigits: 0, maximumFractionDigits: 0, signDisplay: 'exceptZero' })

const formatPercent = (value: number | null) => (value === null ? '—' : percentFormatter.format(value))

const calculateMetrics = (inputs: DriverInputState) => {
  const orders = inputs.customers * inputs.ordersPerCustomer
  const revenue = orders * inputs.averageSellingPrice
  const variableCost = orders * inputs.variableCostPerOrder
  const contributionMargin = revenue - variableCost
  const workforceCost = inputs.headcount * inputs.salaryPerEmployee
  const fixedCost = workforceCost + inputs.otherFixedCosts
  const operatingProfit = contributionMargin - fixedCost

  return {
    revenue,
    variableCost,
    contributionMargin,
    fixedCost,
    operatingProfit,
    contributionMarginRate: revenue === 0 ? null : contributionMargin / revenue,
    operatingMarginRate: revenue === 0 ? null : operatingProfit / revenue,
  }
}

export function SensitivityAnalysisPage() {
  const [inputs, setInputs] = useState<DriverInputState>(initialInputs)
  const [sensitivityDriver, setSensitivityDriver] = useState<SensitivityDriverKey>('averageSellingPrice')

  const baseMetrics = useMemo(() => calculateMetrics(inputs), [inputs])

  const tableRows = useMemo(() => {
    return changeRange.map((change) => {
      const simulatedInputs = {
        ...inputs,
        [sensitivityDriver]: inputs[sensitivityDriver] * (1 + change),
      }
      const metrics = calculateMetrics(simulatedInputs)

      return {
        change,
        revenue: metrics.revenue,
        operatingProfit: metrics.operatingProfit,
        operatingMarginRate: metrics.operatingMarginRate,
      }
    })
  }, [inputs, sensitivityDriver])

  const biggestProfitLever = useMemo(() => {
    const impacts = sensitivityDriverOptions.map(({ key, label }) => {
      const upInputs = { ...inputs, [key]: inputs[key] * 1.1 }
      const downInputs = { ...inputs, [key]: inputs[key] * 0.9 }
      const upProfit = calculateMetrics(upInputs).operatingProfit
      const downProfit = calculateMetrics(downInputs).operatingProfit

      return { label, impact: Math.abs(upProfit - downProfit) }
    })

    return impacts.reduce((best, current) => (current.impact > best.impact ? current : best), impacts[0])
  }, [inputs])

  const dynamicInsight = useMemo(() => {
    if (baseMetrics.operatingMarginRate !== null && baseMetrics.operatingMarginRate < 0) {
      return 'Your business becomes unprofitable under this scenario.'
    }

    const aspImpact = (() => {
      const upInputs = { ...inputs, averageSellingPrice: inputs.averageSellingPrice * 1.1 }
      const downInputs = { ...inputs, averageSellingPrice: inputs.averageSellingPrice * 0.9 }
      return Math.abs(calculateMetrics(upInputs).operatingProfit - calculateMetrics(downInputs).operatingProfit)
    })()

    if (Math.abs(baseMetrics.revenue) > 0 && aspImpact / Math.abs(baseMetrics.revenue) > 0.2) {
      return 'This business is highly sensitive to pricing changes.'
    }

    if (baseMetrics.revenue > 0 && baseMetrics.fixedCost / baseMetrics.revenue > 0.35) {
      return 'This business has high operating leverage.'
    }

    return 'Use one-driver-at-a-time simulation to focus discussion on the biggest levers.'
  }, [baseMetrics, inputs])

  const onInputChange = (key: keyof DriverInputState, value: string) => {
    const numeric = Number(value)
    setInputs((prev) => ({ ...prev, [key]: Number.isFinite(numeric) ? numeric : 0 }))
  }

  return (
    <section className='rounded-xl bg-white p-6 shadow-sm'>
      <h2 className='text-lg font-medium'>Sensitivity Analysis</h2>
      <p className='mt-1 text-sm text-slate-600'>Understand how changes in key business drivers impact revenue, margin, and operating profit.</p>

      <LearningNotes
        title='Sensitivity Analysis'
        purpose='Understand which business drivers have the largest impact on profit.'
        keyQuestion='Which single driver creates the biggest change in operating profit if assumptions move?' 
        whenToUse={[
          'Budget planning',
          'Forecast review',
          'Pricing discussions',
          'Cost reduction analysis',
        ]}
        howToRead={[
          'Start from the base scenario',
          'Change one driver at a time',
          'Compare operating profit impact',
        ]}
        fpnaTips={[
          'A small change in price can create a large profit impact.',
          'Headcount growth increases fixed cost leverage.',
        ]}
        nextAction={[
          'Test your base assumptions before finalizing a plan.',
          'Discuss high-sensitivity drivers with business partners.',
          'Use scenarios to prepare response actions for downside cases.',
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

      <div className='mt-4 grid gap-3 text-sm md:grid-cols-2 lg:grid-cols-4'>
        <div className='rounded-lg border bg-slate-50 p-3'><div className='text-slate-500'>Revenue</div><div className='font-semibold'>{moneyFormatter.format(baseMetrics.revenue)}</div></div>
        <div className='rounded-lg border bg-slate-50 p-3'><div className='text-slate-500'>Variable Cost</div><div className='font-semibold'>{moneyFormatter.format(baseMetrics.variableCost)}</div></div>
        <div className='rounded-lg border border-emerald-200 bg-emerald-50 p-3'><div className='text-emerald-700'>Contribution Margin</div><div className='font-semibold text-emerald-900'>{moneyFormatter.format(baseMetrics.contributionMargin)}</div></div>
        <div className='rounded-lg border bg-slate-50 p-3'><div className='text-slate-500'>Fixed Cost</div><div className='font-semibold'>{moneyFormatter.format(baseMetrics.fixedCost)}</div></div>
        <div className='rounded-lg border border-indigo-200 bg-indigo-50 p-3'><div className='text-indigo-700'>Operating Profit</div><div className='font-semibold text-indigo-900'>{moneyFormatter.format(baseMetrics.operatingProfit)}</div></div>
        <div className='rounded-lg border border-emerald-200 bg-emerald-50 p-3'><div className='text-emerald-700'>Contribution Margin %</div><div className='font-semibold text-emerald-900'>{formatPercent(baseMetrics.contributionMarginRate)}</div></div>
        <div className='rounded-lg border border-indigo-200 bg-indigo-50 p-3'><div className='text-indigo-700'>Operating Margin %</div><div className='font-semibold text-indigo-900'>{formatPercent(baseMetrics.operatingMarginRate)}</div></div>
      </div>

      <article className='mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4'>
        <h3 className='text-sm font-semibold text-slate-800'>Sensitivity Setup</h3>
        <div className='mt-2 grid gap-3 sm:grid-cols-2'>
          <label className='text-sm'>Sensitivity Driver
            <select className='mt-1 w-full rounded border px-2 py-1' value={sensitivityDriver} onChange={(e) => setSensitivityDriver(e.target.value as SensitivityDriverKey)}>
              {sensitivityDriverOptions.map((option) => <option key={option.key} value={option.key}>{option.label}</option>)}
            </select>
          </label>
          <div className='text-sm'>
            <div className='font-medium text-slate-700'>Change Range</div>
            <p className='mt-1 text-slate-600'>-20%, -10%, -5%, Base, +5%, +10%, +20%</p>
          </div>
        </div>
      </article>

      <article className='mt-4 overflow-hidden rounded-lg border border-slate-200 bg-white'>
        <h3 className='border-b border-slate-200 px-4 py-3 text-sm font-semibold text-slate-800'>Sensitivity Table</h3>
        <table className='min-w-full text-sm'>
          <thead className='bg-slate-50 text-left text-slate-600'>
            <tr>
              <th className='px-4 py-2 font-medium'>Change</th>
              <th className='px-4 py-2 font-medium'>Revenue</th>
              <th className='px-4 py-2 font-medium'>Operating Profit</th>
              <th className='px-4 py-2 font-medium'>Operating Margin %</th>
            </tr>
          </thead>
          <tbody>
            {tableRows.map((row) => (
              <tr key={row.change} className='border-t border-slate-100'>
                <td className='px-4 py-2 text-slate-700'>{row.change === 0 ? 'Base' : changeFormatter.format(row.change)}</td>
                <td className='px-4 py-2'>{moneyFormatter.format(row.revenue)}</td>
                <td className='px-4 py-2'>{moneyFormatter.format(row.operatingProfit)}</td>
                <td className='px-4 py-2'>{formatPercent(row.operatingMarginRate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </article>

      <article className='mt-4 rounded-lg border border-violet-200 bg-violet-50 p-4'>
        <h3 className='text-sm font-semibold text-violet-800'>Biggest Profit Lever</h3>
        <p className='mt-1 text-sm text-violet-900'>{biggestProfitLever.label} has the strongest impact on operating profit.</p>
      </article>

      <article className='mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4'>
        <h3 className='text-sm font-semibold text-amber-800'>Learning Insight</h3>
        <p className='mt-1 text-sm text-amber-900'>{dynamicInsight}</p>
      </article>
    </section>
  )
}
