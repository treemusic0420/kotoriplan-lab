import { useMemo, useState } from 'react'
import { LearningNotes } from '../shared/LearningNotes'
import { FPNAInterpretationCard } from '../shared/FPNAInterpretationCard'

type BalanceSheetInputs = {
  openingCash: number
  accountsReceivable: number
  inventory: number
  fixedAssets: number
  debt: number
  equity: number
  currentYearProfit: number
  annualCapEx: number
  debtRepayment: number
}

type BalanceSheetMetrics = {
  endingCash: number
  endingFixedAssets: number
  endingDebt: number
  endingEquity: number
  totalAssets: number
  totalLiabilities: number
  totalLiabilitiesAndEquity: number
  debtToEquityRatio: number
  netAssetValue: number
  openingBalanceGap: number
  balanceGap: number
}

type BridgeCard = {
  label: string
  rows: Array<{ label: string, value: number, prefix?: string }>
  resultLabel: string
  resultValue: number
  tone: string
}

const initialInputs: BalanceSheetInputs = {
  openingCash: 1000000,
  accountsReceivable: 1200000,
  inventory: 800000,
  fixedAssets: 3000000,
  debt: 2000000,
  equity: 4000000,
  currentYearProfit: 500000,
  annualCapEx: 300000,
  debtRepayment: 200000,
}

const inputFields: Array<{ key: keyof BalanceSheetInputs, label: string, helper: string }> = [
  { key: 'openingCash', label: 'Opening Cash', helper: 'Cash available at the start of the planning period.' },
  { key: 'accountsReceivable', label: 'Accounts Receivable', helper: 'Customer balances not yet collected in cash.' },
  { key: 'inventory', label: 'Inventory', helper: 'Stock or materials held to support operations.' },
  { key: 'fixedAssets', label: 'Fixed Assets', helper: 'Long-term operating assets before new CapEx.' },
  { key: 'debt', label: 'Debt', helper: 'Opening financing obligations.' },
  { key: 'equity', label: 'Equity', helper: 'Opening owners\' claim on the business.' },
  { key: 'currentYearProfit', label: 'Current Year Profit', helper: 'Profit retained in the business and added to equity.' },
  { key: 'annualCapEx', label: 'Annual CapEx', helper: 'Investment that increases fixed assets and consumes cash.' },
  { key: 'debtRepayment', label: 'Debt Repayment', helper: 'Principal repayment that lowers debt and consumes cash.' },
]

const moneyFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
const numberFormatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 })

const formatMoney = (value: number) => moneyFormatter.format(value)
const formatPercent = (value: number) => `${numberFormatter.format(value)}%`
const safePercent = (value: number, total: number) => (total === 0 ? 0 : (value / total) * 100)

function calculateBalanceSheet(inputs: BalanceSheetInputs): BalanceSheetMetrics {
  const endingDebt = Math.max(0, inputs.debt - inputs.debtRepayment)
  const endingEquity = inputs.equity + inputs.currentYearProfit
  const endingFixedAssets = inputs.fixedAssets + inputs.annualCapEx
  const endingCash = inputs.openingCash + inputs.currentYearProfit - inputs.annualCapEx - inputs.debtRepayment
  const totalAssets = endingCash + inputs.accountsReceivable + inputs.inventory + endingFixedAssets
  const totalLiabilities = endingDebt
  const totalLiabilitiesAndEquity = totalLiabilities + endingEquity
  const openingAssets = inputs.openingCash + inputs.accountsReceivable + inputs.inventory + inputs.fixedAssets
  const openingLiabilitiesAndEquity = inputs.debt + inputs.equity

  return {
    endingCash,
    endingFixedAssets,
    endingDebt,
    endingEquity,
    totalAssets,
    totalLiabilities,
    totalLiabilitiesAndEquity,
    debtToEquityRatio: endingEquity === 0 ? 0 : endingDebt / endingEquity,
    netAssetValue: totalAssets - totalLiabilities,
    openingBalanceGap: openingAssets - openingLiabilitiesAndEquity,
    balanceGap: totalAssets - totalLiabilitiesAndEquity,
  }
}

function getLeverageStatus(debtToEquityRatio: number) {
  if (debtToEquityRatio < 0.5) {
    return { label: 'Healthy', helper: 'Debt is less than half of equity.', tone: 'emerald' as const }
  }
  if (debtToEquityRatio <= 1) {
    return { label: 'Moderate Leverage', helper: 'Debt is meaningful but still near equity capacity.', tone: 'amber' as const }
  }
  return { label: 'Highly Leveraged', helper: 'Debt exceeds equity and financing risk is elevated.', tone: 'rose' as const }
}

function buildManagementInsight(metrics: BalanceSheetMetrics, inputs: BalanceSheetInputs) {
  const equityGrowth = inputs.equity === 0 ? 0 : inputs.currentYearProfit / inputs.equity

  if (metrics.debtToEquityRatio > 1 && equityGrowth < 0.05) {
    return 'Debt levels are increasing faster than equity growth. Management should review deleveraging, refinancing, or profit improvement options.'
  }
  if (metrics.debtToEquityRatio < 0.5 && equityGrowth > 0) {
    return 'Strong equity position with manageable leverage. Profit generation is strengthening the balance sheet.'
  }
  if (inputs.currentYearProfit > 0) {
    return 'Profit generation is strengthening the balance sheet by increasing retained equity.'
  }
  return 'Equity is not growing in this plan. Focus on profit recovery, asset productivity, and financing flexibility.'
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

function CompositionBar({ label, value, percent, tone }: { label: string, value: number, percent: number, tone: string }) {
  return (
    <div>
      <div className='mb-1 flex items-center justify-between gap-3 text-sm'>
        <span className='font-medium text-slate-700'>{label}</span>
        <span className='text-slate-600'>{formatPercent(percent)} · {formatMoney(value)}</span>
      </div>
      <div className='h-3 overflow-hidden rounded-full bg-slate-100'>
        <div className={`h-full rounded-full ${tone}`} style={{ width: `${Math.min(Math.max(percent, 0), 100)}%` }} />
      </div>
    </div>
  )
}

function BridgeCardView({ card }: { card: BridgeCard }) {
  return (
    <div className='rounded-xl border border-slate-200 bg-slate-50 p-4'>
      <div className={`mb-3 h-1.5 rounded-full ${card.tone}`} />
      <h4 className='text-sm font-semibold text-slate-900'>{card.label}</h4>
      <div className='mt-3 space-y-2'>
        {card.rows.map((row) => (
          <div key={row.label} className='flex items-center justify-between gap-3 rounded-lg bg-white px-3 py-2 text-sm'>
            <span className='text-slate-600'>{row.prefix} {row.label}</span>
            <span className='font-semibold text-slate-900'>{formatMoney(row.value)}</span>
          </div>
        ))}
        <div className='flex items-center justify-between gap-3 rounded-lg bg-slate-900 px-3 py-2 text-sm text-white'>
          <span>= {card.resultLabel}</span>
          <span className='font-semibold'>{formatMoney(card.resultValue)}</span>
        </div>
      </div>
    </div>
  )
}

export function BalanceSheetPlanningPage() {
  const [inputs, setInputs] = useState<BalanceSheetInputs>(initialInputs)
  const metrics = useMemo(() => calculateBalanceSheet(inputs), [inputs])
  const leverageStatus = useMemo(() => getLeverageStatus(metrics.debtToEquityRatio), [metrics.debtToEquityRatio])
  const managementInsight = useMemo(() => buildManagementInsight(metrics, inputs), [metrics, inputs])
  const isBalanced = Math.abs(metrics.balanceGap) < 1
  const fpnaInterpretation = useMemo(() => [
    inputs.currentYearProfit > 0 ? 'Equity base is strengthening through retained profit.' : 'Equity base is not being strengthened by profit.',
    metrics.debtToEquityRatio <= 1 ? 'Leverage remains manageable.' : 'Leverage is elevated and may reduce financial flexibility.',
    metrics.endingCash >= 0 ? 'Cash position supports financial flexibility.' : 'Cash position is negative and constrains flexibility.',
    metrics.netAssetValue > metrics.endingEquity ? 'Asset base provides coverage beyond liabilities.' : 'Net asset value should be reviewed against equity expectations.',
    isBalanced ? 'Balance sheet remains internally balanced.' : 'Balance sheet does not reconcile and requires input review.',
  ], [inputs.currentYearProfit, isBalanced, metrics])

  const bridgeCards = useMemo<BridgeCard[]>(() => [
    {
      label: 'Equity Bridge',
      rows: [
        { label: 'Opening Equity', value: inputs.equity },
        { label: 'Current Year Profit', value: inputs.currentYearProfit, prefix: '+' },
      ],
      resultLabel: 'Ending Equity',
      resultValue: metrics.endingEquity,
      tone: 'bg-emerald-500',
    },
    {
      label: 'Debt Bridge',
      rows: [
        { label: 'Opening Debt', value: inputs.debt },
        { label: 'Debt Repayment', value: inputs.debtRepayment, prefix: '-' },
      ],
      resultLabel: 'Ending Debt',
      resultValue: metrics.endingDebt,
      tone: 'bg-blue-500',
    },
    {
      label: 'Fixed Asset Bridge',
      rows: [
        { label: 'Opening Fixed Assets', value: inputs.fixedAssets },
        { label: 'CapEx', value: inputs.annualCapEx, prefix: '+' },
      ],
      resultLabel: 'Ending Fixed Assets',
      resultValue: metrics.endingFixedAssets,
      tone: 'bg-violet-500',
    },
  ], [inputs, metrics])

  const assetComposition = [
    { label: 'Cash', value: metrics.endingCash, tone: 'bg-emerald-500' },
    { label: 'Accounts Receivable', value: inputs.accountsReceivable, tone: 'bg-cyan-500' },
    { label: 'Inventory', value: inputs.inventory, tone: 'bg-amber-500' },
    { label: 'Fixed Assets', value: metrics.endingFixedAssets, tone: 'bg-violet-500' },
  ]
  const capitalStructure = [
    { label: 'Debt', value: metrics.totalLiabilities, tone: 'bg-blue-500' },
    { label: 'Equity', value: metrics.endingEquity, tone: 'bg-emerald-500' },
  ]

  const handleInputChange = (key: keyof BalanceSheetInputs, value: string) => {
    const parsedValue = Number(value)
    setInputs((current) => ({ ...current, [key]: Number.isFinite(parsedValue) ? parsedValue : 0 }))
  }

  return (
    <section className='rounded-xl bg-white p-6 shadow-sm'>
      <h2 className='text-lg font-medium'>Balance Sheet Planning</h2>
      <p className='mt-1 text-sm text-slate-600'>Learn how operational performance, working capital, investments, financing, and cash flow shape financial position.</p>

      <LearningNotes
        title='Balance Sheet Planning'
        purpose='Understand how assets, liabilities, equity, and cash movements connect into one balanced financial position.'
        keyQuestion='Does the plan create a stronger financial position while keeping Assets = Liabilities + Equity?'
        whenToUse={[
          'Annual planning and budget cycles',
          'Cash flow and financing reviews',
          'Working capital planning',
          'CapEx and debt planning',
          'Executive financial position discussions',
        ]}
        howToRead={[
          'Start with assets: cash, receivables, inventory, and fixed assets',
          'Review liabilities: debt and repayment plans',
          'Connect profit to ending equity',
          'Confirm total assets equal total liabilities plus equity',
        ]}
        fpnaTips={[
          'Profit increases equity when retained in the business',
          'CapEx moves cash into fixed assets rather than creating PL expense immediately',
          'Debt repayment lowers liabilities and cash at the same time',
        ]}
        nextAction={['Change profit, CapEx, and debt repayment assumptions to see how the balance sheet responds']}
        defaultOpen
      />

      <article className='mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4'>
        <h3 className='text-sm font-semibold text-slate-800'>Input Panel</h3>
        <div className='mt-3 grid gap-3 md:grid-cols-3'>
          {inputFields.map((field) => (
            <label key={field.key} className='text-sm font-medium text-slate-700'>
              {field.label}
              <input
                type='number'
                value={inputs[field.key]}
                onChange={(event) => handleInputChange(field.key, event.target.value)}
                className='mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none'
              />
              <span className='mt-1 block text-xs font-normal leading-5 text-slate-500'>{field.helper}</span>
            </label>
          ))}
        </div>
      </article>

      <article className='mt-4 rounded-lg border border-slate-200 bg-white p-4'>
        <h3 className='text-sm font-semibold text-slate-800'>KPI Cards</h3>
        <div className='mt-3 grid gap-3 md:grid-cols-2 lg:grid-cols-3'>
          <KpiCard label='Total Assets' value={formatMoney(metrics.totalAssets)} helper='Cash + AR + Inventory + Ending Fixed Assets.' tone={isBalanced ? 'emerald' : 'amber'} />
          <KpiCard label='Total Liabilities' value={formatMoney(metrics.totalLiabilities)} helper='Ending debt after repayment.' tone='blue' />
          <KpiCard label='Ending Equity' value={formatMoney(metrics.endingEquity)} helper='Opening equity + current year profit.' tone={inputs.currentYearProfit >= 0 ? 'emerald' : 'rose'} />
          <KpiCard label='Debt To Equity Ratio' value={`${numberFormatter.format(metrics.debtToEquityRatio)}x`} helper='Ending debt divided by ending equity.' tone={leverageStatus.tone} />
          <KpiCard label='Net Asset Value' value={formatMoney(metrics.netAssetValue)} helper='Total assets minus total liabilities.' tone='slate' />
          <KpiCard label='Balance Sheet Status' value={leverageStatus.label} helper={leverageStatus.helper} tone={leverageStatus.tone} />
        </div>
      </article>

      <article className='mt-4 rounded-lg border border-slate-200 bg-white p-4'>
        <h3 className='text-sm font-semibold text-slate-800'>Balance Sheet Bridge</h3>
        <p className='mt-1 text-xs text-slate-600'>Waterfall-style cards show how profit, repayment, and CapEx roll opening balances into ending balances.</p>
        <div className='mt-3 grid gap-3 lg:grid-cols-3'>
          {bridgeCards.map((card) => <BridgeCardView key={card.label} card={card} />)}
        </div>
      </article>

      <article className='mt-4 rounded-lg border border-slate-200 bg-white p-4'>
        <div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
          <div>
            <h3 className='text-sm font-semibold text-slate-800'>Balance Sheet Table</h3>
            <p className='mt-1 text-xs text-slate-600'>The balance sheet validates that Assets = Liabilities + Equity.</p>
          </div>
          <span className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${isBalanced ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
            {isBalanced ? 'Balance Sheet Balanced' : `Balance Gap: ${formatMoney(metrics.balanceGap)}`}
          </span>
        </div>
        {Math.abs(metrics.openingBalanceGap) >= 1 && (
          <p className='mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-900'>
            Opening balances are not balanced by {formatMoney(metrics.openingBalanceGap)}. The same gap carries through the ending balance sheet until opening inputs are reconciled.
          </p>
        )}
        <div className='mt-3 overflow-x-auto'>
          <table className='min-w-full border-collapse text-sm'>
            <tbody>
              <tr className='border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500'><th className='px-3 py-2' colSpan={2}>Assets</th></tr>
              <tr className='border-b border-slate-100'><td className='px-3 py-3'>Cash</td><td className='px-3 py-3 text-right font-medium'>{formatMoney(metrics.endingCash)}</td></tr>
              <tr className='border-b border-slate-100'><td className='px-3 py-3'>Accounts Receivable</td><td className='px-3 py-3 text-right font-medium'>{formatMoney(inputs.accountsReceivable)}</td></tr>
              <tr className='border-b border-slate-100'><td className='px-3 py-3'>Inventory</td><td className='px-3 py-3 text-right font-medium'>{formatMoney(inputs.inventory)}</td></tr>
              <tr className='border-b border-slate-100'><td className='px-3 py-3'>Fixed Assets</td><td className='px-3 py-3 text-right font-medium'>{formatMoney(metrics.endingFixedAssets)}</td></tr>
              <tr className='border-b border-slate-200 bg-emerald-50'><td className='px-3 py-3 font-semibold text-emerald-900'>Total Assets</td><td className='px-3 py-3 text-right font-semibold text-emerald-900'>{formatMoney(metrics.totalAssets)}</td></tr>

              <tr className='border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500'><th className='px-3 py-2' colSpan={2}>Liabilities</th></tr>
              <tr className='border-b border-slate-100'><td className='px-3 py-3'>Debt</td><td className='px-3 py-3 text-right font-medium'>{formatMoney(metrics.endingDebt)}</td></tr>
              <tr className='border-b border-slate-200 bg-blue-50'><td className='px-3 py-3 font-semibold text-blue-900'>Total Liabilities</td><td className='px-3 py-3 text-right font-semibold text-blue-900'>{formatMoney(metrics.totalLiabilities)}</td></tr>

              <tr className='border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500'><th className='px-3 py-2' colSpan={2}>Equity</th></tr>
              <tr className='border-b border-slate-100'><td className='px-3 py-3'>Ending Equity</td><td className='px-3 py-3 text-right font-medium'>{formatMoney(metrics.endingEquity)}</td></tr>
              <tr className={`border-b border-slate-200 ${isBalanced ? 'bg-emerald-100' : 'bg-amber-100'}`}><td className='px-3 py-3 font-semibold'>Total Liabilities & Equity</td><td className='px-3 py-3 text-right font-semibold'>{formatMoney(metrics.totalLiabilitiesAndEquity)}</td></tr>
            </tbody>
          </table>
        </div>
      </article>

      <article className='mt-4 rounded-lg border border-slate-200 bg-white p-4'>
        <h3 className='text-sm font-semibold text-slate-800'>Financial Structure Analysis</h3>
        <div className='mt-3 grid gap-4 lg:grid-cols-2'>
          <div className='rounded-xl border border-slate-200 bg-slate-50 p-4'>
            <h4 className='text-sm font-semibold text-slate-900'>Asset Composition</h4>
            <div className='mt-3 space-y-3'>
              {assetComposition.map((item) => <CompositionBar key={item.label} label={item.label} value={item.value} percent={safePercent(item.value, metrics.totalAssets)} tone={item.tone} />)}
            </div>
          </div>
          <div className='rounded-xl border border-slate-200 bg-slate-50 p-4'>
            <h4 className='text-sm font-semibold text-slate-900'>Capital Structure</h4>
            <div className='mt-3 space-y-3'>
              {capitalStructure.map((item) => <CompositionBar key={item.label} label={item.label} value={item.value} percent={safePercent(item.value, metrics.totalLiabilitiesAndEquity)} tone={item.tone} />)}
            </div>
          </div>
        </div>
      </article>

      <article className='mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4'>
        <h3 className='text-sm font-semibold text-slate-800'>Management Insight</h3>
        <p className='mt-2 text-sm leading-6 text-slate-700'>{managementInsight}</p>
      </article>

      <article className='mt-4 rounded-lg border border-slate-200 bg-white p-4'>
        <h3 className='text-sm font-semibold text-slate-800'>Learning Flow</h3>
        <ol className='mt-2 list-decimal space-y-1 pl-5 text-sm text-slate-700'>
          <li>Step 1: Understand Assets</li>
          <li>Step 2: Understand Liabilities</li>
          <li>Step 3: Understand Equity</li>
          <li>Step 4: Connect Profit to Equity</li>
          <li>Step 5: Connect Cash Flow to Balance Sheet</li>
        </ol>
      </article>

      <article className='mt-4 rounded-lg border border-cyan-200 bg-cyan-50 p-4'>
        <h3 className='text-sm font-semibold text-slate-800'>Relationship to Existing Modules</h3>
        <div className='mt-3 grid gap-2 text-sm text-slate-700 md:grid-cols-2 lg:grid-cols-3'>
          {[
            ['PL View', 'Profit Source'],
            ['Cash Flow Planning', 'Cash Movement'],
            ['CapEx Planning', 'Fixed Asset Growth'],
            ['Strategic Initiative Planning', 'Long-Term Asset Creation'],
            ['Long Range Planning', 'Multi-Year Balance Sheet Evolution'],
          ].map(([module, relationship]) => (
            <div key={module} className='rounded-lg bg-white px-3 py-2'><span className='font-semibold text-slate-900'>{module}</span> → {relationship}</div>
          ))}
        </div>
      </article>

      <article className='mt-4 rounded-lg border border-slate-900 bg-slate-950 p-5 text-white'>
        <h3 className='text-sm font-semibold uppercase tracking-wide text-cyan-300'>Capstone Message</h3>
        <p className='mt-3 text-sm leading-6 text-slate-200'>
          The Income Statement explains profitability. The Cash Flow Statement explains liquidity. The Balance Sheet explains financial position. Together they form the foundation of FP&amp;A and corporate finance.
        </p>
      </article>
    <FPNAInterpretationCard items={fpnaInterpretation} />
    </section>
  )
}
