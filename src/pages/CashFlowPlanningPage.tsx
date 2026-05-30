import { useMemo, useState } from 'react'
import { LearningNotes } from '../shared/LearningNotes'
import { FPNAInterpretationCard } from '../shared/FPNAInterpretationCard'

type CashFlowInputs = {
  openingCash: number
  monthlyRevenue: number
  operatingMarginPercent: number
  dsoDays: number
  dpoDays: number
  inventoryDays: number
  monthlyCapEx: number
  monthlyDebtRepayment: number
}

type CashFlowMetrics = {
  openingCash: number
  revenue: number
  operatingProfit: number
  changeInAr: number
  changeInAp: number
  inventoryInvestment: number
  operatingCashFlow: number
  freeCashFlow: number
  endingCash: number
  cashRunwayMonths: number | null
}

type ForecastRow = CashFlowMetrics & {
  month: string
}

type BridgeStep = {
  label: string
  value: number
  prefix?: string
  tone: string
  helper: string
}

const initialInputs: CashFlowInputs = {
  openingCash: 1000000,
  monthlyRevenue: 800000,
  operatingMarginPercent: 15,
  dsoDays: 45,
  dpoDays: 30,
  inventoryDays: 20,
  monthlyCapEx: 50000,
  monthlyDebtRepayment: 20000,
}

const inputFields: Array<{ key: keyof CashFlowInputs, label: string, suffix?: string, helper: string }> = [
  { key: 'openingCash', label: 'Opening Cash', helper: 'Cash balance at the beginning of the month.' },
  { key: 'monthlyRevenue', label: 'Monthly Revenue', helper: 'Revenue recognized in the PL for the month.' },
  { key: 'operatingMarginPercent', label: 'Operating Margin %', suffix: '%', helper: 'Operating profit as a percent of revenue.' },
  { key: 'dsoDays', label: 'DSO Days', helper: 'Collection timing. Higher DSO means receivables consume more cash.' },
  { key: 'dpoDays', label: 'DPO Days', helper: 'Payment timing. Higher DPO means payables preserve more cash.' },
  { key: 'inventoryDays', label: 'Inventory Days', helper: 'Inventory investment required to support revenue.' },
  { key: 'monthlyCapEx', label: 'Monthly CapEx', helper: 'Cash invested in long-term assets.' },
  { key: 'monthlyDebtRepayment', label: 'Monthly Debt Repayment', helper: 'Financing cash outflow for debt principal.' },
]

const monthLabels = ['Month 1', 'Month 2', 'Month 3', 'Month 4', 'Month 5', 'Month 6', 'Month 7', 'Month 8', 'Month 9', 'Month 10', 'Month 11', 'Month 12']

const moneyFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
const numberFormatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 })

const formatMoney = (value: number) => moneyFormatter.format(value)
const formatRunway = (value: number | null) => (value === null ? 'Positive FCF' : `${numberFormatter.format(value)} months`)

function calculateCashFlow(inputs: CashFlowInputs, openingCash = inputs.openingCash, revenue = inputs.monthlyRevenue): CashFlowMetrics {
  const safeRevenue = Math.max(0, revenue)
  const safeOpeningCash = Number.isFinite(openingCash) ? openingCash : 0
  const operatingProfit = safeRevenue * (inputs.operatingMarginPercent / 100)
  const changeInAr = safeRevenue * (Math.max(0, inputs.dsoDays) / 30)
  const changeInAp = safeRevenue * (Math.max(0, inputs.dpoDays) / 30)
  const inventoryInvestment = safeRevenue * (Math.max(0, inputs.inventoryDays) / 30) * 0.3
  const operatingCashFlow = operatingProfit - changeInAr + changeInAp - inventoryInvestment
  const freeCashFlow = operatingCashFlow - Math.max(0, inputs.monthlyCapEx)
  const endingCash = safeOpeningCash + freeCashFlow - Math.max(0, inputs.monthlyDebtRepayment)
  const cashRunwayMonths = freeCashFlow < 0 ? safeOpeningCash / Math.abs(freeCashFlow) : null

  return {
    openingCash: safeOpeningCash,
    revenue: safeRevenue,
    operatingProfit,
    changeInAr,
    changeInAp,
    inventoryInvestment,
    operatingCashFlow,
    freeCashFlow,
    endingCash,
    cashRunwayMonths,
  }
}

function getCashHealthStatus(metrics: CashFlowMetrics) {
  if (metrics.endingCash < 0) {
    return {
      label: 'Cash Shortage Risk',
      description: 'Ending cash is negative. The plan needs funding, faster collections, lower spend, or delayed investments.',
      className: 'border-rose-200 bg-rose-50 text-rose-900',
    }
  }
  if (metrics.cashRunwayMonths !== null && metrics.cashRunwayMonths < 6) {
    return {
      label: 'Short Runway',
      description: 'Current opening cash covers less than six months at the current free cash flow burn rate.',
      className: 'border-amber-200 bg-amber-50 text-amber-900',
    }
  }
  if (metrics.freeCashFlow < 0) {
    return {
      label: 'Cash Burn',
      description: 'Free cash flow is negative, so the business is consuming cash even before debt repayment.',
      className: 'border-orange-200 bg-orange-50 text-orange-900',
    }
  }
  return {
    label: 'Healthy Cash Position',
    description: 'Free cash flow and ending cash are positive under the current assumptions.',
    className: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  }
}

function buildCashInsights(metrics: CashFlowMetrics, inputs: CashFlowInputs) {
  const insights: string[] = []

  if (metrics.operatingProfit > 0 && metrics.freeCashFlow < 0) {
    insights.push('The business is profitable but consuming cash due to working capital or investment needs.')
  }
  if (metrics.changeInAr > metrics.operatingProfit || inputs.dsoDays >= 45) {
    insights.push('Receivables are consuming cash. Review collection timing.')
  }
  if (inputs.monthlyCapEx > Math.max(metrics.operatingProfit * 0.5, 1)) {
    insights.push('CapEx is reducing free cash flow despite operating profitability.')
  }
  if (metrics.endingCash < 0) {
    insights.push('Additional funding or cost reduction may be required.')
  }
  if (insights.length === 0) {
    insights.push('Cash generation is positive under the current assumptions. Continue monitoring working capital timing and investment needs.')
  }

  return insights
}

function buildForecast(inputs: CashFlowInputs) {
  const rows: ForecastRow[] = []
  let openingCash = inputs.openingCash

  monthLabels.forEach((month, index) => {
    const revenue = inputs.monthlyRevenue * (1 + index * 0.015)
    const metrics = calculateCashFlow(inputs, openingCash, revenue)
    rows.push({ month, ...metrics })
    openingCash = metrics.endingCash
  })

  return rows
}

function KpiCard({ label, value, helper, tone = 'slate' }: { label: string, value: string, helper: string, tone?: 'slate' | 'emerald' | 'rose' | 'amber' | 'blue' }) {
  const toneClass = {
    slate: 'border-slate-200 bg-slate-50 text-slate-900',
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    rose: 'border-rose-200 bg-rose-50 text-rose-900',
    amber: 'border-amber-200 bg-amber-50 text-amber-900',
    blue: 'border-blue-200 bg-blue-50 text-blue-900',
  }[tone]

  return (
    <div className={`rounded-lg border p-4 ${toneClass}`}>
      <div className='text-xs font-semibold uppercase tracking-wide opacity-70'>{label}</div>
      <div className='mt-2 text-xl font-semibold'>{value}</div>
      <div className='mt-1 text-xs leading-5 opacity-80'>{helper}</div>
    </div>
  )
}

export function CashFlowPlanningPage() {
  const [inputs, setInputs] = useState<CashFlowInputs>(initialInputs)

  const metrics = useMemo(() => calculateCashFlow(inputs), [inputs])
  const bridgeSteps = useMemo<BridgeStep[]>(() => [
    { label: 'Opening Cash', value: metrics.openingCash, tone: 'bg-slate-600', helper: 'Starting cash balance' },
    { label: 'Operating Profit', value: metrics.operatingProfit, prefix: '+', tone: 'bg-emerald-600', helper: 'Revenue × operating margin' },
    { label: 'AR Increase', value: -metrics.changeInAr, prefix: '-', tone: 'bg-rose-500', helper: 'Revenue × DSO / 30' },
    { label: 'AP Increase', value: metrics.changeInAp, prefix: '+', tone: 'bg-blue-500', helper: 'Revenue × DPO / 30' },
    { label: 'Inventory Investment', value: -metrics.inventoryInvestment, prefix: '-', tone: 'bg-amber-500', helper: 'Revenue × inventory days / 30 × 0.3' },
    { label: 'CapEx', value: -inputs.monthlyCapEx, prefix: '-', tone: 'bg-orange-500', helper: 'Investment cash outflow' },
    { label: 'Debt Repayment', value: -inputs.monthlyDebtRepayment, prefix: '-', tone: 'bg-violet-500', helper: 'Financing cash outflow' },
    { label: 'Ending Cash', value: metrics.endingCash, prefix: '=', tone: 'bg-slate-900', helper: 'Final cash balance' },
  ], [inputs.monthlyCapEx, inputs.monthlyDebtRepayment, metrics])
  const forecastRows = useMemo(() => buildForecast(inputs), [inputs])
  const cashHealthStatus = useMemo(() => getCashHealthStatus(metrics), [metrics])
  const cashInsights = useMemo(() => buildCashInsights(metrics, inputs), [metrics, inputs])
  const fpnaInterpretation = useMemo(() => [
    metrics.operatingProfit >= 0 ? 'Profitability is positive.' : 'Profitability is negative and weakens cash generation.',
    metrics.operatingCashFlow >= metrics.operatingProfit ? 'Cash conversion is strong after working capital.' : 'Cash conversion is weak relative to profit.',
    metrics.changeInAr <= metrics.changeInAp ? 'Payables are helping offset receivables pressure.' : 'Receivables are consuming liquidity.',
    metrics.freeCashFlow >= 0 ? 'Free cash flow can fund financing needs.' : 'Additional financing or cash preservation may be required.',
    metrics.endingCash >= 0 ? 'Ending cash remains positive.' : 'Ending cash falls below zero and requires immediate action.',
  ], [metrics])

  const handleInputChange = (key: keyof CashFlowInputs, value: string) => {
    const parsedValue = Number(value)
    setInputs((current) => ({ ...current, [key]: Number.isFinite(parsedValue) ? parsedValue : 0 }))
  }

  return (
    <section className='rounded-xl bg-white p-6 shadow-sm'>
      <h2 className='text-lg font-medium'>Cash Flow Planning</h2>
      <p className='mt-1 text-sm text-slate-600'>Understand how profit, working capital, CapEx, and financing activities affect cash balance over time.</p>

      <LearningNotes
        title='Cash Flow Planning'
        purpose='Understand why operating profit and cash flow are different.'
        keyQuestion='Will the business have enough cash even if it is profitable?'
        whenToUse={[
          'Monthly cash review',
          'Budget planning',
          'Funding planning',
          'CapEx planning',
          'Growth investment review',
        ]}
        howToRead={[
          'Start from operating profit',
          'Adjust for working capital movements',
          'Subtract CapEx',
          'Add or subtract financing cash flows',
          'Review ending cash balance',
        ]}
        fpnaTips={[
          'Profit does not equal cash.',
          'Revenue growth can consume cash if receivables increase.',
          'CapEx can reduce cash even when PL profit is positive.',
          'Cash runway is critical for growth companies.',
        ]}
        nextAction={[
          'Review Operating Cash Flow to understand working capital pressure.',
          'Review Free Cash Flow before approving CapEx or growth investments.',
          'Use Cash Runway to discuss funding timing and risk.',
        ]}
      />

      <article className='mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4'>
        <h3 className='text-sm font-semibold text-slate-800'>Input Panel</h3>
        <div className='mt-3 grid gap-3 md:grid-cols-2 lg:grid-cols-4'>
          {inputFields.map((field) => (
            <label key={field.key} className='text-sm font-medium text-slate-700'>
              {field.label}
              <div className='mt-1 flex rounded-md border border-slate-300 bg-white focus-within:ring-2 focus-within:ring-cyan-100'>
                <input
                  type='number'
                  step={field.key === 'operatingMarginPercent' ? '0.1' : field.key.includes('Days') ? '1' : '1000'}
                  className='w-full rounded-md px-3 py-2 outline-none'
                  value={inputs[field.key]}
                  onChange={(event) => handleInputChange(field.key, event.target.value)}
                />
                {field.suffix && <span className='flex items-center px-3 text-slate-500'>{field.suffix}</span>}
              </div>
              <span className='mt-1 block text-xs font-normal leading-5 text-slate-500'>{field.helper}</span>
            </label>
          ))}
        </div>
      </article>

      <article className='mt-4 rounded-lg border border-slate-200 bg-white p-4'>
        <h3 className='text-sm font-semibold text-slate-800'>KPI Cards</h3>
        <div className='mt-3 grid gap-3 md:grid-cols-2 lg:grid-cols-3'>
          <KpiCard label='Opening Cash' value={formatMoney(metrics.openingCash)} helper='Cash available before this month starts.' />
          <KpiCard label='Operating Profit' value={formatMoney(metrics.operatingProfit)} helper='Monthly Revenue × Operating Margin %.' tone={metrics.operatingProfit >= 0 ? 'emerald' : 'rose'} />
          <KpiCard label='Operating Cash Flow' value={formatMoney(metrics.operatingCashFlow)} helper='Operating profit adjusted for AR, AP, and inventory.' tone={metrics.operatingCashFlow >= 0 ? 'blue' : 'amber'} />
          <KpiCard label='Free Cash Flow' value={formatMoney(metrics.freeCashFlow)} helper='Operating cash flow minus monthly CapEx.' tone={metrics.freeCashFlow >= 0 ? 'emerald' : 'rose'} />
          <KpiCard label='Ending Cash' value={formatMoney(metrics.endingCash)} helper='Opening cash + FCF - debt repayment.' tone={metrics.endingCash >= 0 ? 'emerald' : 'rose'} />
          <KpiCard label='Cash Runway' value={formatRunway(metrics.cashRunwayMonths)} helper='Opening cash divided by monthly cash burn when FCF is negative.' tone={metrics.cashRunwayMonths !== null && metrics.cashRunwayMonths < 6 ? 'amber' : 'slate'} />
        </div>
      </article>

      <article className={`mt-4 rounded-lg border p-4 ${cashHealthStatus.className}`}>
        <h3 className='text-sm font-semibold'>Cash Health Status: {cashHealthStatus.label}</h3>
        <p className='mt-1 text-sm leading-6'>{cashHealthStatus.description}</p>
      </article>

      <article className='mt-4 rounded-lg border border-slate-200 bg-white p-4'>
        <h3 className='text-sm font-semibold text-slate-800'>Cash Flow Bridge</h3>
        <p className='mt-1 text-xs text-slate-600'>Opening Cash + Operating Profit - AR Increase + AP Increase - Inventory Investment - CapEx - Debt Repayment = Ending Cash.</p>
        <div className='mt-3 grid gap-3 md:grid-cols-4'>
          {bridgeSteps.map((step) => (
            <div key={step.label} className='rounded-lg border border-slate-200 bg-slate-50 p-3'>
              <div className='flex items-center gap-2'>
                <span className={`h-3 w-3 rounded-full ${step.tone}`} />
                <span className='text-xs font-semibold uppercase tracking-wide text-slate-500'>{step.prefix} {step.label}</span>
              </div>
              <div className='mt-2 text-lg font-semibold text-slate-900'>{formatMoney(step.value)}</div>
              <div className='mt-1 text-xs leading-5 text-slate-600'>{step.helper}</div>
            </div>
          ))}
        </div>
      </article>

      <article className='mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4'>
        <h3 className='text-sm font-semibold text-slate-800'>Cash Insight</h3>
        <ul className='mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700'>
          {cashInsights.map((insight) => <li key={insight}>{insight}</li>)}
        </ul>
      </article>

      <article className='mt-4 rounded-lg border border-slate-200 bg-white p-4'>
        <h3 className='text-sm font-semibold text-slate-800'>Monthly Cash Forecast Table</h3>
        <p className='mt-1 text-xs text-slate-600'>Revenue grows 1.5% each month in this sample, and each month uses the prior month ending cash as the next opening cash.</p>
        <div className='mt-3 overflow-x-auto'>
          <table className='min-w-full border-collapse text-sm'>
            <thead>
              <tr className='border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500'>
                <th className='px-3 py-2'>Month</th>
                <th className='px-3 py-2 text-right'>Revenue</th>
                <th className='px-3 py-2 text-right'>Operating Profit</th>
                <th className='px-3 py-2 text-right'>Operating Cash Flow</th>
                <th className='px-3 py-2 text-right'>Free Cash Flow</th>
                <th className='px-3 py-2 text-right'>Ending Cash</th>
              </tr>
            </thead>
            <tbody>
              {forecastRows.map((row) => (
                <tr key={row.month} className='border-b border-slate-100 last:border-0'>
                  <th className='px-3 py-3 text-left font-medium text-slate-800'>{row.month}</th>
                  <td className='px-3 py-3 text-right'>{formatMoney(row.revenue)}</td>
                  <td className='px-3 py-3 text-right'>{formatMoney(row.operatingProfit)}</td>
                  <td className={`px-3 py-3 text-right font-medium ${row.operatingCashFlow >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>{formatMoney(row.operatingCashFlow)}</td>
                  <td className={`px-3 py-3 text-right font-medium ${row.freeCashFlow >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>{formatMoney(row.freeCashFlow)}</td>
                  <td className={`px-3 py-3 text-right font-semibold ${row.endingCash >= 0 ? 'text-slate-900' : 'text-rose-700'}`}>{formatMoney(row.endingCash)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>

      <article className='mt-4 rounded-lg border border-slate-200 bg-white p-4'>
        <h3 className='text-sm font-semibold text-slate-800'>Learning Flow</h3>
        <ol className='mt-2 list-decimal space-y-1 pl-5 text-sm text-slate-700'>
          <li>Step 1: Start from operating profit</li>
          <li>Step 2: Adjust for working capital</li>
          <li>Step 3: Subtract CapEx</li>
          <li>Step 4: Review free cash flow</li>
          <li>Step 5: Check ending cash and runway</li>
        </ol>
      </article>
    <FPNAInterpretationCard items={fpnaInterpretation} />
    </section>
  )
}
