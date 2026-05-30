type FPNAInterpretationCardProps = {
  items: string[]
}

export function FPNAInterpretationCard({ items }: FPNAInterpretationCardProps) {
  const visibleItems = items.filter(Boolean).slice(0, 5)

  return (
    <article className='mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4'>
      <h3 className='text-sm font-semibold text-amber-900'>FP&amp;A Interpretation</h3>
      <ul className='mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-amber-900'>
        {visibleItems.map((item) => <li key={item}>{item}</li>)}
      </ul>
    </article>
  )
}
