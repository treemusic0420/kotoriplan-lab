import { useState } from 'react'

type LearningNotesProps = {
  title: string
  purpose: string
  whenToUse: string[]
  howToRead: string[]
  fpnaTips?: string[]
  nextAction?: string[]
  defaultOpen?: boolean
}

const Section = ({ title, items }: { title: string, items: string[] }) => (
  <div>
    <h4 className='text-sm font-semibold text-slate-700'>{title}</h4>
    <ul className='mt-1 list-disc space-y-1 pl-5 text-sm text-slate-700'>
      {items.map((item) => <li key={item}>{item}</li>)}
    </ul>
  </div>
)

export function LearningNotes({ title, purpose, whenToUse, howToRead, fpnaTips, nextAction, defaultOpen = false }: LearningNotesProps) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <article className='mt-3 rounded-lg border bg-slate-50 p-4'>
      <button type='button' className='flex w-full items-center justify-between text-left' onClick={() => setOpen((v) => !v)}>
        <h3 className='text-base font-medium'>Learning Notes</h3>
        <span className='text-xs text-slate-600'>{open ? 'Hide' : 'Show'}</span>
      </button>
      {open && (
        <div className='mt-3 space-y-3'>
          <div>
            <h4 className='text-sm font-semibold text-slate-700'>View</h4>
            <p className='text-sm text-slate-700'>{title}</p>
          </div>
          <div>
            <h4 className='text-sm font-semibold text-slate-700'>Purpose</h4>
            <p className='text-sm text-slate-700'>{purpose}</p>
          </div>
          <Section title='When to use' items={whenToUse} />
          <Section title='How to read' items={howToRead} />
          {fpnaTips && fpnaTips.length > 0 && <Section title='FP&A tips' items={fpnaTips} />}
          {nextAction && nextAction.length > 0 && <Section title='Next action' items={nextAction} />}
        </div>
      )}
    </article>
  )
}
