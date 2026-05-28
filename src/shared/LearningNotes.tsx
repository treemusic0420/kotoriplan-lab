import { useState } from 'react'

type LearningNotesProps = {
  title: string
  purpose: string
  keyQuestion: string
  whenToUse: string[]
  howToRead: string[]
  fpnaTips?: string[]
  nextAction: string[]
  defaultOpen?: boolean
}

const Section = ({ title, items }: { title: string, items: string[] }) => (
  <div>
    <h4 className='text-sm font-semibold text-slate-800'>{title}</h4>
    <ul className='mt-1 list-disc space-y-1 pl-5 text-sm text-slate-700'>
      {items.map((item) => <li key={item}>{item}</li>)}
    </ul>
  </div>
)

export function LearningNotes({ title, purpose, keyQuestion, whenToUse, howToRead, fpnaTips, nextAction, defaultOpen = false }: LearningNotesProps) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <article className='mt-3 rounded-lg border border-slate-200 bg-white p-4'>
      <button type='button' className='flex w-full items-center justify-between text-left' onClick={() => setOpen((v) => !v)}>
        <h3 className='text-base font-semibold text-slate-900'>Learning Notes</h3>
        <span className='text-xs font-medium text-slate-700'>{open ? 'Hide' : 'Show'}</span>
      </button>
      {open && (
        <div className='mt-3 space-y-3'>
          <div>
            <h4 className='text-sm font-semibold text-slate-800'>View</h4>
            <p className='text-sm text-slate-700'>{title}</p>
          </div>
          <div>
            <h4 className='text-sm font-semibold text-slate-800'>Purpose</h4>
            <p className='text-sm text-slate-700'>{purpose}</p>
          </div>
          <div>
            <h4 className='text-sm font-semibold text-slate-800'>Key question</h4>
            <p className='text-sm text-slate-700'>{keyQuestion}</p>
          </div>
          <Section title='When to use' items={whenToUse} />
          <Section title='How to read' items={howToRead} />
          {fpnaTips && fpnaTips.length > 0 && <Section title='FP&A tips' items={fpnaTips} />}
          <Section title='Next action' items={nextAction} />
          <p className='text-xs text-slate-500'>Use these notes as a guide for analysis flow and discussion.</p>
        </div>
      )}
    </article>
  )
}
