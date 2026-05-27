import type { ReactNode } from 'react'

export function WhenToUseCard({ title = 'When to use this view', bullets, note, className = 'mt-4' }: { title?: string; bullets: ReactNode[]; note?: ReactNode; className?: string }) {
  return (
    <div className={`${className} rounded-lg border bg-slate-50 p-4`}>
      <h3 className='text-sm font-semibold'>{title}</h3>
      <ul className='mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-slate-700'>
        {bullets.map((bullet, idx) => <li key={idx}>{bullet}</li>)}
      </ul>
      {note && <p className='mt-2 text-xs text-slate-500'>{note}</p>}
    </div>
  )
}
