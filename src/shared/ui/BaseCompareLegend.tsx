import type { CompareType } from '../../features/pl/model/types'

type BaseCompareLegendProps = {
  compareType: CompareType
  contextLabel: string
  formulaLabel: string
  formulaPrefix?: string
  noteLines?: string[]
}

const mapping: Record<CompareType, { base: string; compare: string }> = {
  actual_vs_budget: { base: 'Budget', compare: 'Actual' },
  actual_vs_forecast: { base: 'Forecast', compare: 'Actual' },
  forecast_vs_budget: { base: 'Budget', compare: 'Forecast' }
}

export function BaseCompareLegend({ compareType, contextLabel, formulaLabel, formulaPrefix = 'Formula', noteLines = [] }: BaseCompareLegendProps) {
  const { base, compare } = mapping[compareType]
  return <div className='mt-4 rounded-lg border bg-slate-50 px-3 py-2 text-xs text-slate-600'>
    <p className='font-medium text-slate-700'>{contextLabel}</p>
    <p>(A) Base = {base}</p>
    <p>(B) Compare = {compare}</p>
    <p>{formulaPrefix}: (B) {compare} {formulaLabel} (A) {base}</p>
    {noteLines.map((line) => <p key={line}>{line}</p>)}
  </div>
}
