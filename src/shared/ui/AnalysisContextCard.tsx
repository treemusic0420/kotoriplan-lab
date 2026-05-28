type AnalysisContextCardProps = {
  version: string
  period: string
  scope: string
}

export function AnalysisContextCard({ version, period, scope }: AnalysisContextCardProps) {
  return <div className='mt-4 rounded-lg border bg-slate-50 px-3 py-2 text-xs text-slate-600'>
    <p className='font-medium text-slate-700'>Analysis context:</p>
    <p>Version = {version}</p>
    <p>Period = {period}</p>
    <p>Scope = {scope}</p>
  </div>
}
