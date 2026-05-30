import { useMemo, useState } from 'react'
import { LearningNotes } from '../shared/LearningNotes'
import { FPNAInterpretationCard } from '../shared/FPNAInterpretationCard'

type ForecastMonth = {
  month: number
  revenue: number
  variableCost: number
  fixedCost: number
}

type ForecastRow = {
  key: 'revenue' | 'variableCost' | 'fixedCost' | 'operatingProfit'
  label: string
  getValue: (month: ForecastMonth) => number
}

type SummaryCardProps = {
  label: string
  value: string
  tone?: 'neutral' | 'favorable' | 'unfavorable'
  helper?: string
}

const forecastYears = [2025, 2026, 2027]
const originalBudgetFullYear = 5_800_000
const monthNames = Array.from({ length: 12 }, (_, index) => index + 1)
const moneyFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })

const baseMonthlyForecast: ForecastMonth[] = [
  { month: 1, revenue: 430_000, variableCost: 193_500, fixedCost: 110_000 },
  { month: 2, revenue: 440_000, variableCost: 198_000, fixedCost: 112_000 },
  { month: 3, revenue: 455_000, variableCost: 204_750, fixedCost: 115_000 },
  { month: 4, revenue: 470_000, variableCost: 211_500, fixedCost: 116_000 },
  { month: 5, revenue: 480_000, variableCost: 216_000, fixedCost: 118_000 },
  { month: 6, revenue: 490_000, variableCost: 220_500, fixedCost: 120_000 },
  { month: 7, revenue: 500_000, variableCost: 225_000, fixedCost: 121_000 },
  { month: 8, revenue: 510_000, variableCost: 229_500, fixedCost: 122_000 },
  { month: 9, revenue: 520_000, variableCost: 234_000, fixedCost: 124_000 },
  { month: 10, revenue: 530_000, variableCost: 238_500, fixedCost: 126_000 },
  { month: 11, revenue: 540_000, variableCost: 243_000, fixedCost: 128_000 },
  { month: 12, revenue: 550_000, variableCost: 247_500, fixedCost: 130_000 },
]

const rows: ForecastRow[] = [
  { key: 'revenue', label: 'Revenue', getValue: (month) => month.revenue },
  { key: 'variableCost', label: 'Variable Cost', getValue: (month) => month.variableCost },
  { key: 'fixedCost', label: 'Fixed Cost', getValue: (month) => month.fixedCost },
  { key: 'operatingProfit', label: 'Operating Profit', getValue: (month) => month.revenue - month.variableCost - month.fixedCost },
]

const formatMonth = (year: number, month: number) => `${year}-${String(month).padStart(2, '0')}`
const formatMoney = (value: number) => moneyFormatter.format(value)

const SummaryCard = ({ label, value, tone = 'neutral', helper }: SummaryCardProps) => {
  const toneClasses = {
    neutral: 'border-slate-200 bg-slate-50 text-slate-900',
    favorable: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    unfavorable: 'border-rose-200 bg-rose-50 text-rose-800',
  }

  return (
    <div className={`rounded-lg border p-4 ${toneClasses[tone]}`}>
      <div className='text-xs font-medium uppercase tracking-wide text-slate-500'>{label}</div>
      <div className='mt-2 text-xl font-semibold'>{value}</div>
      {helper && <div className='mt-1 text-xs text-slate-600'>{helper}</div>}
    </div>
  )
}

export function RollingForecastPage() {
  const [forecastYear, setForecastYear] = useState(2026)
  const [actualThroughMonth, setActualThroughMonth] = useState(4)
  const [monthlyForecast] = useState<ForecastMonth[]>(baseMonthlyForecast)

  const metrics = useMemo(() => {
    const latestForecastFullYear = monthlyForecast.reduce((sum, month) => sum + month.revenue, 0)
    const actualYtd = monthlyForecast
      .filter((month) => month.month <= actualThroughMonth)
      .reduce((sum, month) => sum + month.revenue, 0)
    const remainingForecast = monthlyForecast
      .filter((month) => month.month > actualThroughMonth)
      .reduce((sum, month) => sum + month.revenue, 0)
    const fullYearOperatingProfit = monthlyForecast.reduce(
      (sum, month) => sum + month.revenue - month.variableCost - month.fixedCost,
      0,
    )
    const actualOperatingProfitYtd = monthlyForecast
      .filter((month) => month.month <= actualThroughMonth)
      .reduce((sum, month) => sum + month.revenue - month.variableCost - month.fixedCost, 0)
    const remainingOperatingProfit = monthlyForecast
      .filter((month) => month.month > actualThroughMonth)
      .reduce((sum, month) => sum + month.revenue - month.variableCost - month.fixedCost, 0)
    const forecastVariance = latestForecastFullYear - originalBudgetFullYear

    return {
      latestForecastFullYear,
      actualYtd,
      remainingForecast,
      fullYearOperatingProfit,
      actualOperatingProfitYtd,
      remainingOperatingProfit,
      forecastVariance,
    }
  }, [actualThroughMonth, monthlyForecast])

  const fpnaInterpretation = useMemo(() => [
    metrics.forecastVariance >= 0 ? 'Latest forecast is outperforming the original budget.' : 'Latest forecast is below budget and needs mitigation.',
    metrics.fullYearOperatingProfit >= 0 ? 'Full-year profitability remains positive.' : 'Full-year profitability is at risk.',
    metrics.remainingForecast > metrics.actualYtd ? 'A significant portion of the year still depends on forecast assumptions.' : 'Actual performance now anchors most of the full-year outlook.',
    metrics.remainingOperatingProfit >= 0 ? 'Remaining months are expected to add profit.' : 'Remaining months are expected to dilute profit.',
  ], [metrics])

  const revisionInsights = useMemo(() => {
    const insights: string[] = []

    if (metrics.latestForecastFullYear > originalBudgetFullYear) {
      insights.push('Latest forecast is above original budget. Identify which months or drivers improved.')
    }

    if (metrics.latestForecastFullYear < originalBudgetFullYear) {
      insights.push('Latest forecast is below original budget. Review revenue assumptions, cost pressure, or fixed cost increases.')
    }

    if (metrics.remainingForecast > metrics.actualYtd * 1.5) {
      insights.push('Most of the full-year result still depends on future forecast assumptions.')
    }

    if (insights.length === 0) {
      insights.push('Latest forecast is close to the original budget. Focus the review on key driver changes and risk items.')
    }

    return insights
  }, [metrics])

  const actualThroughLabel = formatMonth(forecastYear, actualThroughMonth)
  const varianceTone = metrics.forecastVariance >= 0 ? 'favorable' : 'unfavorable'

  return (
    <section className='rounded-xl bg-white p-6 shadow-sm'>
      <h2 className='text-lg font-medium'>Rolling Forecast</h2>
      <p className='mt-1 text-sm text-slate-600'>Update full-year outlook by combining actual results with remaining-month forecast.</p>

      <LearningNotes
        title='Rolling Forecast'
        purpose='Update the full-year financial outlook as actual results become available.'
        keyQuestion='What is the latest expected full-year result based on actual performance and updated assumptions?'
        whenToUse={[
          'Monthly forecast update',
          'Quarterly business review',
          'Budget reforecast',
          'Management reporting',
        ]}
        howToRead={[
          'Actual months are locked historical results.',
          'Future months are forecast assumptions.',
          'Full-year forecast combines actual + remaining forecast.',
          'Compare Latest Forecast against Original Budget.',
        ]}
        fpnaTips={[
          'Rolling forecast helps management react faster than annual budget cycles.',
          'Forecast changes should be explained by business drivers, not only numbers.',
          'Keep the forecast horizon consistent, such as 12 months or 18 months.',
        ]}
        nextAction={[
          'Review PL View to understand current structure.',
          'Use PL Variance to explain forecast changes.',
          'Use Driver Planning to update assumptions.',
        ]}
      />

      <article className='mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4'>
        <h3 className='text-sm font-semibold text-slate-800'>Control Panel</h3>
        <div className='mt-3 grid gap-3 sm:grid-cols-2'>
          <label className='text-sm font-medium text-slate-700'>
            Forecast Year
            <select
              className='mt-1 w-full rounded border border-slate-300 bg-white px-2 py-2'
              value={forecastYear}
              onChange={(event) => setForecastYear(Number(event.target.value))}
            >
              {forecastYears.map((year) => <option key={year} value={year}>{year}</option>)}
            </select>
          </label>
          <label className='text-sm font-medium text-slate-700'>
            Actual Through Month
            <select
              className='mt-1 w-full rounded border border-slate-300 bg-white px-2 py-2'
              value={actualThroughMonth}
              onChange={(event) => setActualThroughMonth(Number(event.target.value))}
            >
              {monthNames.map((month) => <option key={month} value={month}>{formatMonth(forecastYear, month)}</option>)}
            </select>
          </label>
        </div>
        <p className='mt-3 text-xs text-slate-600'>Months through {actualThroughLabel} are treated as Actual. Later months are treated as Forecast.</p>
      </article>

      <article className='mt-4 rounded-lg border border-slate-200 bg-white p-4'>
        <div className='flex flex-wrap items-center justify-between gap-2'>
          <h3 className='text-sm font-semibold text-slate-800'>Monthly Forecast Table</h3>
          <div className='flex gap-2 text-xs text-slate-600'>
            <span className='rounded-full bg-slate-100 px-2 py-1'>Actual</span>
            <span className='rounded-full bg-blue-100 px-2 py-1 text-blue-700'>Forecast</span>
          </div>
        </div>
        <div className='mt-3 overflow-x-auto'>
          <table className='min-w-full border-collapse text-sm'>
            <thead>
              <tr className='border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500'>
                <th className='sticky left-0 bg-white px-3 py-2'>Line item</th>
                {monthlyForecast.map((month) => <th key={month.month} className='px-3 py-2 text-right'>{formatMonth(forecastYear, month.month)}</th>)}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.key} className='border-b border-slate-100 last:border-0'>
                  <th className='sticky left-0 bg-white px-3 py-3 text-left font-medium text-slate-800'>{row.label}</th>
                  {monthlyForecast.map((month) => {
                    const isActual = month.month <= actualThroughMonth
                    return (
                      <td key={`${row.key}-${month.month}`} className='px-2 py-2 text-right'>
                        <div className={`rounded-md px-2 py-2 ${isActual ? 'bg-slate-100' : 'bg-blue-50'}`}>
                          <div className='font-medium text-slate-900'>{formatMoney(row.getValue(month))}</div>
                          <div className={`mt-1 text-[10px] font-semibold uppercase tracking-wide ${isActual ? 'text-slate-500' : 'text-blue-600'}`}>{isActual ? 'Actual' : 'Forecast'}</div>
                        </div>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>

      <article className='mt-4 rounded-lg border border-slate-200 bg-white p-4'>
        <h3 className='text-sm font-semibold text-slate-800'>KPI Summary</h3>
        <div className='mt-3 grid gap-3 md:grid-cols-2 lg:grid-cols-3'>
          <SummaryCard label='Original Budget Full Year' value={formatMoney(originalBudgetFullYear)} helper='Static sample budget revenue' />
          <SummaryCard label='Latest Forecast Full Year' value={formatMoney(metrics.latestForecastFullYear)} helper='Actual revenue + remaining forecast revenue' />
          <SummaryCard label='Forecast Variance' value={formatMoney(metrics.forecastVariance)} tone={varianceTone} helper={metrics.forecastVariance >= 0 ? 'Favorable vs budget' : 'Unfavorable vs budget'} />
          <SummaryCard label='Actual YTD' value={formatMoney(metrics.actualYtd)} helper={`Revenue through ${actualThroughLabel}`} />
          <SummaryCard label='Remaining Forecast' value={formatMoney(metrics.remainingForecast)} helper='Revenue after actual period' />
          <SummaryCard label='Full-year Operating Profit' value={formatMoney(metrics.fullYearOperatingProfit)} helper='Revenue - variable cost - fixed cost' />
        </div>
      </article>

      <article className='mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4'>
        <h3 className='text-sm font-semibold text-slate-800'>Forecast Revision Insight</h3>
        <ul className='mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700'>
          {revisionInsights.map((insight) => <li key={insight}>{insight}</li>)}
        </ul>
      </article>

      <article className='mt-4 rounded-lg border border-slate-200 bg-white p-4'>
        <h3 className='text-sm font-semibold text-slate-800'>Forecast Waterfall Summary</h3>
        <div className='mt-3 grid gap-3 md:grid-cols-4'>
          <div className='rounded-lg border border-slate-200 bg-slate-50 p-3'>
            <div className='text-xs font-medium uppercase tracking-wide text-slate-500'>Original Budget</div>
            <div className='mt-2 text-lg font-semibold'>{formatMoney(originalBudgetFullYear)}</div>
          </div>
          <div className='rounded-lg border border-slate-200 bg-slate-50 p-3'>
            <div className='text-xs font-medium uppercase tracking-wide text-slate-500'>Actual YTD impact</div>
            <div className='mt-2 text-lg font-semibold'>{formatMoney(metrics.actualYtd)}</div>
            <div className='mt-1 text-xs text-slate-600'>Locked actual revenue</div>
          </div>
          <div className='rounded-lg border border-blue-200 bg-blue-50 p-3'>
            <div className='text-xs font-medium uppercase tracking-wide text-slate-500'>Remaining Forecast impact</div>
            <div className='mt-2 text-lg font-semibold text-blue-800'>{formatMoney(metrics.remainingForecast)}</div>
            <div className='mt-1 text-xs text-slate-600'>Future forecast revenue</div>
          </div>
          <div className='rounded-lg border border-emerald-200 bg-emerald-50 p-3'>
            <div className='text-xs font-medium uppercase tracking-wide text-slate-500'>Latest Forecast</div>
            <div className='mt-2 text-lg font-semibold text-emerald-800'>{formatMoney(metrics.latestForecastFullYear)}</div>
            <div className='mt-1 text-xs text-slate-600'>Variance: {formatMoney(metrics.forecastVariance)}</div>
          </div>
        </div>
        <p className='mt-3 text-xs text-slate-600'>Operating profit view: actual YTD {formatMoney(metrics.actualOperatingProfitYtd)} + remaining forecast {formatMoney(metrics.remainingOperatingProfit)} = full year {formatMoney(metrics.fullYearOperatingProfit)}.</p>
      </article>

      <article className='mt-4 rounded-lg border border-slate-200 bg-white p-4'>
        <h3 className='text-sm font-semibold text-slate-800'>Learning Flow</h3>
        <ol className='mt-2 list-decimal space-y-1 pl-5 text-sm text-slate-700'>
          <li>Step 1: Lock actual months</li>
          <li>Step 2: Update remaining forecast</li>
          <li>Step 3: Compare full-year outlook with budget</li>
          <li>Step 4: Explain changes using variance and drivers</li>
        </ol>
      </article>
    <FPNAInterpretationCard items={fpnaInterpretation} />
    </section>
  )
}
