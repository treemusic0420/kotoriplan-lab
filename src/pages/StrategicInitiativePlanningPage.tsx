import { useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { LearningNotes } from '../shared/LearningNotes'

type InitiativeType = 'New Product Launch' | 'Market Expansion' | 'ERP Transformation' | 'New Factory' | 'Sales Team Expansion'

type StrategicInitiativeInputs = {
  initiativeType: InitiativeType
  initiativeInvestment: number
  expectedRevenueUpliftPercent: number
  expectedMarginImprovementPercent: number
  additionalHeadcount: number
  additionalCapacityPercent: number
  implementationYears: number
}

type DriverImpact = {
  label: string
  value: number
  level: 'Low' | 'Medium' | 'High'
  helper: string
  className: string
}

type InitiativeScenario = {
  label: string
  description: string
  revenue: number
  operatingProfit: number
  headcount: number
  capacity: number
  roi: number | null
  color: string
}

const initiativeOptions: InitiativeType[] = [
  'New Product Launch',
  'Market Expansion',
  'ERP Transformation',
  'New Factory',
  'Sales Team Expansion',
]

const initialInputs: StrategicInitiativeInputs = {
  initiativeType: 'New Product Launch',
  initiativeInvestment: 2500000,
  expectedRevenueUpliftPercent: 12,
  expectedMarginImprovementPercent: 2.5,
  additionalHeadcount: 18,
  additionalCapacityPercent: 8,
  implementationYears: 2,
}

const baseRevenue = 50000000
const baseOperatingMarginPercent = 14
const baseHeadcount = 420
const baseCapacityIndex = 100

const moneyFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
const numberFormatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 })
const percentFormatter = new Intl.NumberFormat('en-US', { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 })

const formatMoney = (value: number) => moneyFormatter.format(value)
const formatNumber = (value: number) => numberFormatter.format(value)
const formatPercent = (value: number | null) => (value === null ? '—' : percentFormatter.format(value))
const safeNumber = (value: number) => (Number.isFinite(value) ? value : 0)
const safeNonNegativeNumber = (value: number) => Math.max(0, safeNumber(value))
const toRate = (percent: number) => safeNumber(percent) / 100

function getImplementationYears(value: number) {
  return Math.min(10, Math.max(1, Math.round(safeNonNegativeNumber(value))))
}

function getImpactLevel(value: number, mediumThreshold: number, highThreshold: number): DriverImpact['level'] {
  if (value >= highThreshold) return 'High'
  if (value >= mediumThreshold) return 'Medium'
  return 'Low'
}

function getImpactClassName(level: DriverImpact['level']) {
  if (level === 'High') return 'border-emerald-200 bg-emerald-50 text-emerald-900'
  if (level === 'Medium') return 'border-amber-200 bg-amber-50 text-amber-900'
  return 'border-slate-200 bg-slate-50 text-slate-700'
}

function calculateInitiative(inputs: StrategicInitiativeInputs, intensity = 1) {
  const investment = safeNonNegativeNumber(inputs.initiativeInvestment) * intensity
  const revenueUpliftRate = toRate(inputs.expectedRevenueUpliftPercent) * intensity
  const marginImprovementRate = toRate(inputs.expectedMarginImprovementPercent) * intensity
  const implementationYears = getImplementationYears(inputs.implementationYears)
  const incrementalRevenue = baseRevenue * revenueUpliftRate
  const baseOperatingProfit = baseRevenue * toRate(baseOperatingMarginPercent)
  const upliftRevenue = baseRevenue + incrementalRevenue
  const marginImprovementProfit = upliftRevenue * marginImprovementRate
  const incrementalOperatingProfit = incrementalRevenue * toRate(baseOperatingMarginPercent) + marginImprovementProfit
  const requiredHeadcount = baseHeadcount + safeNonNegativeNumber(inputs.additionalHeadcount) * intensity
  const capacityExpansion = baseCapacityIndex + safeNonNegativeNumber(inputs.additionalCapacityPercent) * intensity
  const roi = investment === 0 ? null : incrementalOperatingProfit / investment
  const paybackPeriod = incrementalOperatingProfit <= 0 ? null : investment / incrementalOperatingProfit

  return {
    investment,
    revenueUpliftRate,
    marginImprovementRate,
    implementationYears,
    incrementalRevenue,
    baseOperatingProfit,
    upliftRevenue,
    marginImprovementProfit,
    incrementalOperatingProfit,
    requiredHeadcount,
    capacityExpansion,
    roi,
    paybackPeriod,
  }
}

function getExecutiveInsight(roi: number | null, incrementalOperatingProfit: number, investment: number, additionalHeadcount: number) {
  if (roi !== null && roi >= 0.5 && additionalHeadcount <= 25) {
    return 'High ROI initiative with manageable headcount growth.'
  }

  if (incrementalOperatingProfit > investment * 0.25 && investment >= 5000000) {
    return 'Strong revenue impact but requires significant investment.'
  }

  if (roi !== null && roi >= 0.3 && incrementalOperatingProfit > 0) {
    return 'Margin improvement initiative may outperform revenue-focused initiatives.'
  }

  if (incrementalOperatingProfit <= 0) {
    return 'Operating profit impact is limited. Revisit the revenue uplift, margin assumptions, or investment timing.'
  }

  return 'Initiative creates financial value, but leadership should validate execution risk and capital allocation trade-offs.'
}

function buildDriverImpact(label: string, value: number, mediumThreshold: number, highThreshold: number, helper: string): DriverImpact {
  const level = getImpactLevel(value, mediumThreshold, highThreshold)
  return {
    label,
    value,
    level,
    helper,
    className: getImpactClassName(level),
  }
}

export function StrategicInitiativePlanningPage() {
  const [inputs, setInputs] = useState<StrategicInitiativeInputs>(initialInputs)

  const metrics = useMemo(() => calculateInitiative(inputs), [inputs])

  const kpiCards = [
    { label: 'Incremental Revenue', value: formatMoney(metrics.incrementalRevenue), helper: `${formatPercent(metrics.revenueUpliftRate)} uplift on base revenue` },
    { label: 'Incremental Operating Profit', value: formatMoney(metrics.incrementalOperatingProfit), helper: 'Revenue uplift + margin improvement' },
    { label: 'Required Headcount', value: formatNumber(metrics.requiredHeadcount), helper: `${formatNumber(inputs.additionalHeadcount)} added roles` },
    { label: 'Capacity Expansion', value: `${formatNumber(metrics.capacityExpansion)} index`, helper: `${formatPercent(toRate(inputs.additionalCapacityPercent))} additional capacity` },
    { label: 'Initiative ROI %', value: formatPercent(metrics.roi), helper: 'Incremental OP ÷ investment' },
    { label: 'Payback Period', value: metrics.paybackPeriod === null ? '—' : `${formatNumber(metrics.paybackPeriod)} years`, helper: 'Investment ÷ incremental OP' },
  ]

  const waterfallRows = [
    { label: 'Base Revenue', value: baseRevenue, display: formatMoney(baseRevenue), color: '#2563eb' },
    { label: 'Revenue Uplift', value: metrics.incrementalRevenue, display: formatMoney(metrics.incrementalRevenue), color: '#16a34a' },
    { label: 'Margin Improvement', value: metrics.marginImprovementProfit, display: formatMoney(metrics.marginImprovementProfit), color: '#f59e0b' },
    { label: 'Incremental Profit', value: metrics.incrementalOperatingProfit, display: formatMoney(metrics.incrementalOperatingProfit), color: '#7c3aed' },
  ]

  const driverImpacts = [
    buildDriverImpact('Revenue Driver', Math.abs(inputs.expectedRevenueUpliftPercent), 5, 12, 'Expected revenue uplift'),
    buildDriverImpact('Margin Driver', Math.abs(inputs.expectedMarginImprovementPercent), 1.5, 4, 'Expected margin improvement'),
    buildDriverImpact('Workforce Driver', inputs.additionalHeadcount, 10, 30, 'Additional headcount'),
    buildDriverImpact('Capacity Driver', Math.abs(inputs.additionalCapacityPercent), 5, 15, 'Additional capacity'),
    buildDriverImpact('Investment Driver', metrics.investment / 1000000, 2, 6, 'Investment requirement'),
  ]

  const scenarios = useMemo<InitiativeScenario[]>(() => {
    const noInitiativeProfit = baseRevenue * toRate(baseOperatingMarginPercent)
    const baseInitiative = calculateInitiative(inputs)
    const aggressiveInitiative = calculateInitiative(inputs, 1.5)

    return [
      {
        label: 'Scenario A',
        description: 'No Initiative',
        revenue: baseRevenue,
        operatingProfit: noInitiativeProfit,
        headcount: baseHeadcount,
        capacity: baseCapacityIndex,
        roi: null,
        color: '#64748b',
      },
      {
        label: 'Scenario B',
        description: 'Base Initiative',
        revenue: baseInitiative.upliftRevenue,
        operatingProfit: noInitiativeProfit + baseInitiative.incrementalOperatingProfit,
        headcount: baseInitiative.requiredHeadcount,
        capacity: baseInitiative.capacityExpansion,
        roi: baseInitiative.roi,
        color: '#2563eb',
      },
      {
        label: 'Scenario C',
        description: 'Aggressive Initiative',
        revenue: aggressiveInitiative.upliftRevenue,
        operatingProfit: noInitiativeProfit + aggressiveInitiative.incrementalOperatingProfit,
        headcount: aggressiveInitiative.requiredHeadcount,
        capacity: aggressiveInitiative.capacityExpansion,
        roi: aggressiveInitiative.roi,
        color: '#059669',
      },
    ]
  }, [inputs])

  const strategicAlignment = [
    { label: 'Revenue Growth', score: Math.min(100, Math.round(Math.abs(inputs.expectedRevenueUpliftPercent) * 6)), helper: 'Does the initiative expand the top line?' },
    { label: 'Margin Expansion', score: Math.min(100, Math.round(Math.abs(inputs.expectedMarginImprovementPercent) * 18)), helper: 'Does the initiative improve profit quality?' },
    { label: 'Workforce Scaling', score: Math.min(100, Math.round((inputs.additionalHeadcount / 40) * 100)), helper: 'Can the organization absorb the staffing need?' },
    { label: 'Capacity Readiness', score: Math.min(100, Math.round(Math.abs(inputs.additionalCapacityPercent) * 5)), helper: 'Does capacity support the growth plan?' },
    { label: 'Capital Allocation', score: Math.min(100, Math.round((metrics.roi ?? 0) * 100)), helper: 'Does the return justify the investment?' },
  ]

  const executiveInsight = getExecutiveInsight(metrics.roi, metrics.incrementalOperatingProfit, metrics.investment, inputs.additionalHeadcount)

  const updateNumberInput = (key: Exclude<keyof StrategicInitiativeInputs, 'initiativeType'>, value: string) => {
    const numeric = Number(value)
    setInputs((prev) => ({ ...prev, [key]: Number.isFinite(numeric) ? numeric : 0 }))
  }

  return (
    <section className='rounded-xl bg-white p-6 shadow-sm'>
      <div className='rounded-xl border border-slate-200 bg-gradient-to-r from-indigo-950 via-slate-900 to-emerald-900 p-5 text-white'>
        <p className='text-xs font-semibold uppercase tracking-[0.25em] text-emerald-100'>Strategy to FP&amp;A bridge</p>
        <h2 className='mt-2 text-2xl font-semibold'>Strategic Initiative Planning</h2>
        <p className='mt-2 max-w-4xl text-sm text-emerald-50'>Connect strategic initiatives to financial outcomes and understand how business decisions influence growth, cost, capacity, and profitability.</p>
      </div>

      <LearningNotes
        title='Strategic Initiative Planning'
        purpose='Translate business initiatives into financial impact.'
        keyQuestion='Which initiatives create the most enterprise value?'
        whenToUse={['Annual planning', 'Growth strategy', 'Investment review', 'Board planning']}
        howToRead={[
          'Define the initiative and investment profile',
          'Estimate revenue, margin, workforce, and capacity effects',
          'Evaluate ROI and payback before comparing scenarios',
          'Use strategic alignment to connect strategy with FP&A models',
        ]}
        fpnaTips={[
          'Revenue uplift should be paired with capacity and headcount assumptions.',
          'Margin improvement can create more value than headline growth when investment is disciplined.',
          'Strategic initiatives should be compared against a no-initiative baseline.',
        ]}
        nextAction={['Define initiative', 'Estimate business impact', 'Translate into financial drivers', 'Evaluate ROI', 'Compare alternatives', 'Select initiative portfolio']}
        defaultOpen
      />

      <article className='mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4'>
        <h3 className='text-sm font-semibold text-slate-800'>Input Panel</h3>
        <p className='mt-1 text-xs text-slate-600'>Adjust the strategic initiative assumptions and observe the financial bridge from strategy to operating profit.</p>
        <div className='mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
          <label className='block text-sm font-medium text-slate-700'>
            Initiative Type
            <select
              className='mt-1 w-full rounded border border-slate-300 bg-white px-2 py-2 text-sm'
              value={inputs.initiativeType}
              onChange={(event) => setInputs((prev) => ({ ...prev, initiativeType: event.target.value as InitiativeType }))}
            >
              {initiativeOptions.map((option) => <option key={option}>{option}</option>)}
            </select>
          </label>
          {[
            ['initiativeInvestment', 'Initiative Investment', 'USD'],
            ['expectedRevenueUpliftPercent', 'Expected Revenue Uplift %', '%'],
            ['expectedMarginImprovementPercent', 'Expected Margin Improvement %', 'pts'],
            ['additionalHeadcount', 'Additional Headcount', 'HC'],
            ['additionalCapacityPercent', 'Additional Capacity %', '%'],
            ['implementationYears', 'Implementation Years', 'years'],
          ].map(([key, label, suffix]) => (
            <label key={key} className='block text-sm font-medium text-slate-700'>
              {label}
              <div className='mt-1 flex rounded border border-slate-300 bg-white'>
                <input
                  className='w-full rounded-l bg-white px-2 py-2 text-sm outline-none'
                  type='number'
                  value={inputs[key as Exclude<keyof StrategicInitiativeInputs, 'initiativeType'>]}
                  onChange={(event) => updateNumberInput(key as Exclude<keyof StrategicInitiativeInputs, 'initiativeType'>, event.target.value)}
                />
                <span className='inline-flex items-center rounded-r bg-slate-100 px-2 text-xs font-medium text-slate-500'>{suffix}</span>
              </div>
            </label>
          ))}
        </div>
      </article>

      <div className='mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3'>
        {kpiCards.map((card) => (
          <article key={card.label} className='rounded-lg border border-slate-200 bg-white p-4'>
            <div className='text-xs font-semibold uppercase tracking-wide text-slate-500'>{card.label}</div>
            <div className='mt-2 text-2xl font-semibold text-slate-900'>{card.value}</div>
            <p className='mt-1 text-xs text-slate-500'>{card.helper}</p>
          </article>
        ))}
      </div>

      <div className='mt-4 grid gap-4 lg:grid-cols-2'>
        <article className='rounded-lg border border-slate-200 bg-white p-4'>
          <h3 className='text-sm font-semibold text-slate-800'>Initiative Impact Waterfall</h3>
          <p className='mt-1 text-xs text-slate-600'>Base Revenue → Revenue Uplift → Margin Improvement → Incremental Profit</p>
          <div className='mt-4 grid gap-3 md:grid-cols-4'>
            {waterfallRows.map((row, index) => (
              <div key={row.label} className='relative rounded-lg border border-slate-200 bg-slate-50 p-3'>
                {index > 0 && <div className='absolute -left-3 top-1/2 hidden -translate-y-1/2 text-slate-400 md:block'>→</div>}
                <div className='text-xs font-semibold uppercase tracking-wide text-slate-500'>{row.label}</div>
                <div className='mt-2 text-lg font-semibold' style={{ color: row.color }}>{row.display}</div>
              </div>
            ))}
          </div>
        </article>

        <article className='rounded-lg border border-slate-200 bg-white p-4'>
          <h3 className='text-sm font-semibold text-slate-800'>Initiative Driver Impact</h3>
          <div className='mt-3 space-y-2'>
            {driverImpacts.map((driver) => (
              <div key={driver.label} className={`rounded-lg border p-3 ${driver.className}`}>
                <div className='flex items-center justify-between gap-3'>
                  <div>
                    <div className='text-sm font-semibold'>{driver.label}</div>
                    <div className='text-xs opacity-80'>{driver.helper}</div>
                  </div>
                  <div className='rounded-full bg-white/70 px-3 py-1 text-xs font-semibold'>Impact Level: {driver.level}</div>
                </div>
              </div>
            ))}
          </div>
        </article>
      </div>

      <article className='mt-4 rounded-lg border border-slate-200 bg-white p-4'>
        <h3 className='text-sm font-semibold text-slate-800'>Initiative Comparison</h3>
        <p className='mt-1 text-xs text-slate-600'>Compare Revenue, Operating Profit, Headcount, Capacity, and ROI across alternatives.</p>
        <div className='mt-4 h-64'>
          <ResponsiveContainer width='100%' height='100%'>
            <BarChart data={scenarios}>
              <CartesianGrid strokeDasharray='3 3' />
              <XAxis dataKey='description' />
              <YAxis tickFormatter={(value) => `$${Number(value) / 1000000}M`} />
              <Tooltip formatter={(value, name) => (name === 'ROI' ? formatPercent(Number(value)) : formatMoney(Number(value)))} />
              <Bar dataKey='revenue' name='Revenue'>
                {scenarios.map((scenario) => <Cell key={`revenue-${scenario.label}`} fill={scenario.color} />)}
              </Bar>
              <Bar dataKey='operatingProfit' name='Operating Profit' fill='#7c3aed' />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className='mt-4 overflow-x-auto'>
          <table className='min-w-full divide-y divide-slate-200 text-sm'>
            <thead className='bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500'>
              <tr>
                <th className='px-3 py-2'>Scenario</th>
                <th className='px-3 py-2'>Revenue</th>
                <th className='px-3 py-2'>Operating Profit</th>
                <th className='px-3 py-2'>Headcount</th>
                <th className='px-3 py-2'>Capacity</th>
                <th className='px-3 py-2'>ROI</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-slate-100'>
              {scenarios.map((scenario) => (
                <tr key={scenario.label}>
                  <td className='px-3 py-2 font-medium text-slate-900'>{scenario.label}: {scenario.description}</td>
                  <td className='px-3 py-2 text-slate-700'>{formatMoney(scenario.revenue)}</td>
                  <td className='px-3 py-2 text-slate-700'>{formatMoney(scenario.operatingProfit)}</td>
                  <td className='px-3 py-2 text-slate-700'>{formatNumber(scenario.headcount)}</td>
                  <td className='px-3 py-2 text-slate-700'>{formatNumber(scenario.capacity)}</td>
                  <td className='px-3 py-2 text-slate-700'>{formatPercent(scenario.roi)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>

      <div className='mt-4 grid gap-4 lg:grid-cols-2'>
        <article className='rounded-lg border border-slate-200 bg-slate-50 p-4'>
          <h3 className='text-sm font-semibold text-slate-800'>Strategic Alignment</h3>
          <div className='mt-3 space-y-3'>
            {strategicAlignment.map((item) => (
              <div key={item.label}>
                <div className='flex items-center justify-between gap-3 text-sm'>
                  <span className='font-medium text-slate-800'>{item.label}</span>
                  <span className='text-xs font-semibold text-slate-500'>{item.score}/100</span>
                </div>
                <div className='mt-1 h-2 rounded-full bg-slate-200'>
                  <div className='h-2 rounded-full bg-gradient-to-r from-blue-500 to-emerald-500' style={{ width: `${item.score}%` }} />
                </div>
                <p className='mt-1 text-xs text-slate-500'>{item.helper}</p>
              </div>
            ))}
          </div>
        </article>

        <article className='rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-950'>
          <h3 className='text-sm font-semibold'>Executive Insight</h3>
          <p className='mt-2 text-xl font-semibold'>{executiveInsight}</p>
          <p className='mt-2 text-sm'>The selected {inputs.initiativeType} creates {formatMoney(metrics.incrementalOperatingProfit)} of incremental operating profit, produces {formatPercent(metrics.roi)} ROI, and pays back in {metrics.paybackPeriod === null ? '—' : `${formatNumber(metrics.paybackPeriod)} years`}.</p>
        </article>
      </div>

      <article className='mt-4 rounded-lg border border-slate-200 bg-white p-4'>
        <h3 className='text-sm font-semibold text-slate-800'>Relationship to Existing Modules</h3>
        <div className='mt-3 grid gap-2 text-sm text-slate-700 md:grid-cols-2 lg:grid-cols-4'>
          {[
            ['Driver Planning', 'Revenue Driver'],
            ['Headcount Planning', 'Workforce Impact'],
            ['Capacity Planning', 'Operational Capacity'],
            ['CapEx Planning', 'Investment Requirement'],
            ['Investment Portfolio Planning', 'Capital Allocation'],
            ['Long Range Planning', 'Multi-Year Outlook'],
            ['Scenario Planning', 'Best/Base/Worst Outcomes'],
            ['Strategic Driver Tree', 'Enterprise Driver Map'],
          ].map(([module, connection]) => (
            <div key={module} className='rounded-lg border border-slate-200 bg-slate-50 p-3'>
              <div className='font-semibold text-slate-900'>{module}</div>
              <div className='mt-1 text-xs text-slate-500'>→ {connection}</div>
            </div>
          ))}
        </div>
      </article>
    </section>
  )
}
