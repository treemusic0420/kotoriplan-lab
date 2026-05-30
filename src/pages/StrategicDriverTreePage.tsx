import { useMemo, useState } from 'react'
import { LearningNotes } from '../shared/LearningNotes'

type StrategicDriverTreeInputs = {
  customers: number
  ordersPerCustomer: number
  averageSellingPrice: number
  variableCostRatioPercent: number
  currentHeadcount: number
  revenuePerEmployee: number
  capacityUtilizationPercent: number
  annualCapEx: number
}

type CapacityScore = {
  label: 'Underutilized' | 'Healthy' | 'Constrained'
  helper: string
  className: string
}

const initialInputs: StrategicDriverTreeInputs = {
  customers: 1000,
  ordersPerCustomer: 12,
  averageSellingPrice: 100,
  variableCostRatioPercent: 45,
  currentHeadcount: 100,
  revenuePerEmployee: 12000,
  capacityUtilizationPercent: 85,
  annualCapEx: 1000000,
}

const moneyFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
const numberFormatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 })
const percentFormatter = new Intl.NumberFormat('en-US', { style: 'percent', minimumFractionDigits: 0, maximumFractionDigits: 1 })

const formatMoney = (value: number) => moneyFormatter.format(value)
const formatNumber = (value: number) => numberFormatter.format(value)
const formatPercent = (value: number) => percentFormatter.format(value / 100)
const safeNumber = (value: number) => (Number.isFinite(value) ? value : 0)

function getCapacityScore(utilization: number): CapacityScore {
  if (utilization < 70) {
    return {
      label: 'Underutilized',
      helper: 'Existing resources have available room before expansion is needed.',
      className: 'border-sky-200 bg-sky-50 text-sky-900',
    }
  }

  if (utilization <= 90) {
    return {
      label: 'Healthy',
      helper: 'Capacity is being used productively without creating severe bottlenecks.',
      className: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    }
  }

  return {
    label: 'Constrained',
    helper: 'Demand pressure is high and expansion or productivity action may be required.',
    className: 'border-amber-200 bg-amber-50 text-amber-900',
  }
}

const inputSections: Array<{ title: string, fields: Array<{ key: keyof StrategicDriverTreeInputs, label: string, suffix?: string }> }> = [
  {
    title: 'Revenue Drivers',
    fields: [
      { key: 'customers', label: 'Customers' },
      { key: 'ordersPerCustomer', label: 'Orders Per Customer' },
      { key: 'averageSellingPrice', label: 'Average Selling Price' },
    ],
  },
  {
    title: 'Cost Drivers',
    fields: [
      { key: 'variableCostRatioPercent', label: 'Variable Cost Ratio', suffix: '%' },
    ],
  },
  {
    title: 'Workforce & Capacity Drivers',
    fields: [
      { key: 'currentHeadcount', label: 'Current Headcount' },
      { key: 'revenuePerEmployee', label: 'Revenue Per Employee' },
      { key: 'capacityUtilizationPercent', label: 'Capacity Utilization', suffix: '%' },
    ],
  },
  {
    title: 'Investment Drivers',
    fields: [
      { key: 'annualCapEx', label: 'Annual CapEx' },
    ],
  },
]

const driverTreeGroups = [
  {
    title: 'Revenue Drivers',
    drivers: ['Customers', 'Orders Per Customer', 'Average Selling Price'],
    result: 'Revenue',
    tone: 'border-blue-200 bg-blue-50',
  },
  {
    title: 'Cost Drivers',
    drivers: ['Variable Cost Ratio', 'Workforce'],
    result: 'Contribution Margin',
    tone: 'border-rose-200 bg-rose-50',
  },
  {
    title: 'Capacity Drivers',
    drivers: ['Headcount', 'Revenue Per Employee', 'Utilization'],
    result: 'Capacity Revenue',
    tone: 'border-emerald-200 bg-emerald-50',
  },
  {
    title: 'Investment Drivers',
    drivers: ['Annual CapEx', 'Growth Initiatives'],
    result: 'Future Capacity',
    tone: 'border-purple-200 bg-purple-50',
  },
]

const influenceRows = [
  { driver: 'Customers', category: 'Revenue', impactLevel: 'Very High' },
  { driver: 'ASP', category: 'Revenue', impactLevel: 'High' },
  { driver: 'Headcount', category: 'Capacity', impactLevel: 'Medium' },
  { driver: 'CapEx', category: 'Investment', impactLevel: 'Medium' },
  { driver: 'Variable Cost Ratio', category: 'Cost', impactLevel: 'High' },
]

const strategicAlignment = [
  { theme: 'Revenue Growth', driver: 'Customers / ASP', tone: 'border-blue-200 bg-blue-50 text-blue-900' },
  { theme: 'Margin Improvement', driver: 'Cost Ratio', tone: 'border-emerald-200 bg-emerald-50 text-emerald-900' },
  { theme: 'Scale Expansion', driver: 'Headcount / Capacity', tone: 'border-amber-200 bg-amber-50 text-amber-900' },
  { theme: 'Future Growth', driver: 'CapEx', tone: 'border-purple-200 bg-purple-50 text-purple-900' },
]

const dependencyNodes = ['Customers', 'Revenue', 'Margin', 'Profit', 'Investment', 'Future Revenue']

export function StrategicDriverTreePage() {
  const [inputs, setInputs] = useState<StrategicDriverTreeInputs>(initialInputs)

  const metrics = useMemo(() => {
    const revenue = safeNumber(inputs.customers) * safeNumber(inputs.ordersPerCustomer) * safeNumber(inputs.averageSellingPrice)
    const variableCost = revenue * (safeNumber(inputs.variableCostRatioPercent) / 100)
    const contributionMargin = revenue - variableCost
    const workforceCapacityRevenue = safeNumber(inputs.currentHeadcount) * safeNumber(inputs.revenuePerEmployee)
    const operatingProfit = contributionMargin - safeNumber(inputs.annualCapEx)

    return {
      revenue,
      variableCost,
      contributionMargin,
      workforceCapacityRevenue,
      capacityScore: getCapacityScore(safeNumber(inputs.capacityUtilizationPercent)),
      operatingProfit,
    }
  }, [inputs])

  const executiveInsight = useMemo(() => {
    if (metrics.revenue > metrics.workforceCapacityRevenue) {
      return 'Demand exceeds workforce capacity. Scaling may be required.'
    }

    if (inputs.capacityUtilizationPercent > 90) {
      return 'Capacity is constrained. Expansion investment should be evaluated.'
    }

    if (inputs.variableCostRatioPercent > 60) {
      return 'Margin structure may limit profit growth.'
    }

    if (metrics.revenue > metrics.variableCost + inputs.annualCapEx) {
      return 'Business drivers are aligned for profitable growth.'
    }

    return 'Profitability depends on improving revenue drivers, cost efficiency, or investment timing.'
  }, [inputs.annualCapEx, inputs.capacityUtilizationPercent, inputs.variableCostRatioPercent, metrics])

  const kpiCards = [
    { label: 'Revenue', value: formatMoney(metrics.revenue), helper: 'Customers × Orders × ASP' },
    { label: 'Variable Cost', value: formatMoney(metrics.variableCost), helper: `${formatPercent(inputs.variableCostRatioPercent)} of revenue` },
    { label: 'Contribution Margin', value: formatMoney(metrics.contributionMargin), helper: 'Revenue − Variable Cost' },
    { label: 'Workforce Capacity Revenue', value: formatMoney(metrics.workforceCapacityRevenue), helper: 'Headcount × Revenue per Employee' },
    { label: 'Capacity Score', value: metrics.capacityScore.label, helper: `${formatPercent(inputs.capacityUtilizationPercent)} utilization`, className: metrics.capacityScore.className },
    { label: 'Operating Profit', value: formatMoney(metrics.operatingProfit), helper: 'Contribution Margin − Annual CapEx' },
  ]

  const onInputChange = (key: keyof StrategicDriverTreeInputs, value: string) => {
    const numeric = Number(value)
    setInputs((prev) => ({ ...prev, [key]: Number.isFinite(numeric) ? numeric : 0 }))
  }

  return (
    <section className='rounded-xl bg-white p-6 shadow-sm'>
      <div className='rounded-xl border border-slate-200 bg-gradient-to-r from-slate-900 via-slate-800 to-blue-900 p-5 text-white'>
        <p className='text-xs font-semibold uppercase tracking-[0.25em] text-blue-100'>Integrated planning capstone</p>
        <h2 className='mt-2 text-2xl font-semibold'>Strategic Driver Tree</h2>
        <p className='mt-2 max-w-3xl text-sm text-blue-50'>Understand how strategic business drivers connect revenue, cost, workforce, capacity, investment, and profit.</p>
        <div className='mt-4 flex flex-wrap items-center gap-2 text-xs font-medium text-blue-50'>
          {['Driver Planning', 'Headcount Planning', 'Capacity Planning', 'CapEx Planning', 'Scenario Planning', 'Strategic Driver Tree'].map((step, index, steps) => (
            <span key={step} className='inline-flex items-center gap-2'>
              <span className='rounded-full bg-white/10 px-3 py-1 ring-1 ring-white/20'>{step}</span>
              {index < steps.length - 1 && <span className='text-blue-200'>↓</span>}
            </span>
          ))}
        </div>
      </div>

      <LearningNotes
        title='Strategic Driver Tree'
        purpose='Visualize how operational and financial drivers influence profitability and long-term value creation.'
        keyQuestion='Which business drivers have the greatest impact on enterprise performance?'
        whenToUse={['FP&A planning', 'Driver-based planning', 'Strategy discussions', 'Executive workshops']}
        howToRead={[
          'Follow the path from drivers to profit',
          'Identify bottlenecks',
          'Understand cause-and-effect relationships',
          'Focus management attention on key drivers',
        ]}
        fpnaTips={[
          'Revenue is usually driven by price and volume.',
          'Costs are driven by workforce, operations, and scale.',
          'Investments support future growth.',
          'Driver trees simplify complex businesses.',
        ]}
        nextAction={[
          'Step 1: Understand Revenue Drivers',
          'Step 2: Understand Cost Drivers',
          'Step 3: Connect Capacity Constraints',
          'Step 4: Connect Investment Decisions',
          'Step 5: Explain Operating Profit Using Drivers',
        ]}
        defaultOpen
      />

      <article className='mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4'>
        <h3 className='text-sm font-semibold text-slate-800'>Input Panel</h3>
        <p className='mt-1 text-xs text-slate-600'>Adjust the core operating, workforce, capacity, and investment drivers to see how the full enterprise map changes.</p>
        <div className='mt-4 grid gap-4 lg:grid-cols-4'>
          {inputSections.map((section) => (
            <div key={section.title} className='rounded-lg border border-slate-200 bg-white p-3'>
              <h4 className='text-xs font-semibold uppercase tracking-wide text-slate-500'>{section.title}</h4>
              <div className='mt-3 space-y-3'>
                {section.fields.map((field) => (
                  <label key={field.key} className='block text-sm font-medium text-slate-700'>
                    {field.label}{field.suffix ? ` ${field.suffix}` : ''}
                    <input
                      className='mt-1 w-full rounded border border-slate-300 bg-white px-2 py-2 text-sm'
                      type='number'
                      value={inputs[field.key]}
                      onChange={(event) => onInputChange(field.key, event.target.value)}
                    />
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </article>

      <div className='mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
        {kpiCards.map((card) => (
          <article key={card.label} className={`rounded-lg border p-4 ${card.className ?? 'border-slate-200 bg-white text-slate-900'}`}>
            <div className='text-xs font-semibold uppercase tracking-wide opacity-70'>{card.label}</div>
            <div className='mt-2 text-xl font-semibold'>{card.value}</div>
            <div className='mt-1 text-xs opacity-75'>{card.helper}</div>
          </article>
        ))}
      </div>

      <article className='mt-4 rounded-lg border border-slate-200 bg-white p-4'>
        <h3 className='text-sm font-semibold text-slate-800'>Driver Tree Visualization</h3>
        <p className='mt-1 text-xs text-slate-600'>Each card shows a driver family, the operating levers underneath it, and the financial outcome it creates.</p>
        <div className='mt-4 grid gap-3 lg:grid-cols-4'>
          {driverTreeGroups.map((group) => (
            <div key={group.title} className={`rounded-xl border p-4 ${group.tone}`}>
              <h4 className='text-sm font-semibold text-slate-900'>{group.title}</h4>
              <ul className='mt-3 space-y-2 text-sm text-slate-700'>
                {group.drivers.map((driver) => <li key={driver} className='rounded bg-white/70 px-3 py-2'>├ {driver}</li>)}
              </ul>
              <div className='mt-3 text-center text-lg text-slate-500'>↓</div>
              <div className='rounded-lg bg-white px-3 py-2 text-center text-sm font-semibold text-slate-900 shadow-sm'>{group.result}</div>
            </div>
          ))}
        </div>
        <div className='mt-4 rounded-xl border border-slate-300 bg-slate-900 p-4 text-center text-white'>
          <div className='text-xs font-semibold uppercase tracking-wide text-slate-300'>All Paths</div>
          <div className='text-lg text-slate-400'>↓</div>
          <div className='text-xl font-semibold'>Operating Profit</div>
        </div>
      </article>

      <div className='mt-4 grid gap-4 lg:grid-cols-2'>
        <article className='rounded-lg border border-slate-200 bg-white p-4'>
          <h3 className='text-sm font-semibold text-slate-800'>Driver Influence Ranking</h3>
          <div className='mt-3 overflow-x-auto'>
            <table className='min-w-full border-collapse text-sm'>
              <thead>
                <tr className='border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500'>
                  <th className='px-3 py-2'>Driver</th>
                  <th className='px-3 py-2'>Category</th>
                  <th className='px-3 py-2'>Impact Level</th>
                </tr>
              </thead>
              <tbody>
                {influenceRows.map((row) => (
                  <tr key={row.driver} className='border-b border-slate-100 last:border-0'>
                    <td className='px-3 py-3 font-medium text-slate-800'>{row.driver}</td>
                    <td className='px-3 py-3 text-slate-700'>{row.category}</td>
                    <td className='px-3 py-3 text-slate-700'>{row.impactLevel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className='rounded-lg border border-slate-200 bg-white p-4'>
          <h3 className='text-sm font-semibold text-slate-800'>Strategic Alignment</h3>
          <div className='mt-3 grid gap-3 sm:grid-cols-2'>
            {strategicAlignment.map((item) => (
              <div key={item.theme} className={`rounded-lg border p-3 ${item.tone}`}>
                <div className='text-sm font-semibold'>{item.theme}</div>
                <div className='mt-2 text-sm'>← {item.driver}</div>
              </div>
            ))}
          </div>
        </article>
      </div>

      <article className='mt-4 rounded-lg border border-slate-200 bg-white p-4'>
        <h3 className='text-sm font-semibold text-slate-800'>Driver Dependency Map</h3>
        <p className='mt-1 text-xs text-slate-600'>The cycle shows how demand creates revenue, revenue creates margin, profit funds investment, and investment supports future revenue.</p>
        <div className='mt-4 flex flex-wrap items-center justify-center gap-3'>
          {dependencyNodes.map((node, index) => (
            <div key={node} className='flex items-center gap-3'>
              <div className='rounded-full border border-slate-300 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm'>{node}</div>
              <div className='text-xl font-semibold text-blue-500'>{index === dependencyNodes.length - 1 ? '↺' : '↓'}</div>
            </div>
          ))}
        </div>
      </article>

      <article className='mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4'>
        <h3 className='text-sm font-semibold text-amber-900'>Executive Insight</h3>
        <p className='mt-1 text-sm text-amber-800'>{executiveInsight}</p>
        <p className='mt-2 text-xs text-amber-700'>{metrics.capacityScore.helper}</p>
      </article>

      <article className='mt-4 rounded-lg border border-slate-200 bg-white p-4'>
        <h3 className='text-sm font-semibold text-slate-800'>Learning Flow</h3>
        <ol className='mt-3 grid gap-3 text-sm text-slate-700 md:grid-cols-5'>
          {[
            'Understand Revenue Drivers',
            'Understand Cost Drivers',
            'Connect Capacity Constraints',
            'Connect Investment Decisions',
            'Explain Operating Profit Using Drivers',
          ].map((step, index) => (
            <li key={step} className='rounded-lg border border-slate-200 bg-slate-50 p-3'>
              <div className='text-xs font-semibold uppercase tracking-wide text-slate-500'>Step {index + 1}</div>
              <div className='mt-1 font-medium text-slate-800'>{step}</div>
            </li>
          ))}
        </ol>
      </article>

      <article className='mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4'>
        <h3 className='text-sm font-semibold text-blue-900'>Capstone Positioning</h3>
        <p className='mt-1 text-sm text-blue-800'>This view brings Driver Planning, Headcount Planning, Capacity Planning, CapEx Planning, Scenario Planning, and Long Range Planning into one management map so teams can explain which business drivers create profit.</p>
      </article>
    </section>
  )
}
