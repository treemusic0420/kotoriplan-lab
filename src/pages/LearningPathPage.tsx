import { Link } from 'react-router-dom'

type LearningStep = {
  step: number
  viewName: string
  viewPath: string
  mainQuestion: string
  whatYouLearn: string[]
  whyItMatters: string
  recommendedNext: string[]
}

const learningSteps: LearningStep[] = [
  {
    step: 1,
    viewName: 'PL View',
    viewPath: '/pl',
    mainQuestion: 'What happened to overall business performance this month?',
    whatYouLearn: ['Revenue trend', 'Gross profit', 'Operating profit', 'Monthly movement'],
    whyItMatters: 'This is the starting point of every FP&A monthly review.',
    recommendedNext: ['PL Variance', 'PL by Dimension']
  },
  {
    step: 2,
    viewName: 'PL Variance',
    viewPath: '/pl/variance',
    mainQuestion: 'Why did actual performance differ from budget or forecast?',
    whatYouLearn: ['Revenue variance', 'Cost variance', 'Favorable vs unfavorable variance'],
    whyItMatters: 'Variance analysis explains whether the business is performing above or below plan.',
    recommendedNext: ['Variance Drivers', 'PL Bridge']
  },
  {
    step: 3,
    viewName: 'Variance Drivers',
    viewPath: '/pl/variance-drivers',
    mainQuestion: 'Which products, customers, or channels caused the variance?',
    whatYouLearn: ['Biggest unfavorable drivers', 'Biggest favorable drivers', 'Dimension-level impact'],
    whyItMatters: 'FP&A teams need to identify where management action is required.',
    recommendedNext: ['PL by Dimension']
  },
  {
    step: 4,
    viewName: 'PL Bridge',
    viewPath: '/pl/bridge',
    mainQuestion: 'How did operating profit move from base to compare scenario?',
    whatYouLearn: ['Revenue impact', 'Variable cost impact', 'Fixed cost impact'],
    whyItMatters: 'Bridge analysis is commonly used for executive reporting.',
    recommendedNext: ['Ratio Analysis']
  },
  {
    step: 5,
    viewName: 'Ratio Analysis',
    viewPath: '/pl/ratios',
    mainQuestion: 'Is the business operating efficiently?',
    whatYouLearn: ['Gross margin %', 'Contribution margin %', 'Operating margin %', 'Cost ratios'],
    whyItMatters: 'Ratios reveal efficiency, not just size.',
    recommendedNext: ['PL by Dimension']
  },
  {
    step: 6,
    viewName: 'PL by Dimension',
    viewPath: '/pl/by-dimension',
    mainQuestion: 'Which segment contributes most to revenue and profit?',
    whatYouLearn: ['Product/customer/channel/region profitability', 'Segment comparison'],
    whyItMatters: 'Management decisions are often made at dimension level.',
    recommendedNext: ['Return to PL View for next monthly cycle']
  }
]

export function LearningPathPage() {
  return (
    <section className='rounded-xl bg-white p-6 shadow-sm'>
      <h2 className='text-lg font-medium text-slate-900'>Learning Path</h2>

      <article className='mt-3 rounded-xl border border-slate-200 bg-slate-50 p-4'>
        <h3 className='text-base font-semibold text-slate-900'>FP&A Monthly Review Flow</h3>
        <p className='mt-1 text-sm text-slate-700'>
          Learn how FP&A teams investigate business performance step by step using PL, variance, bridge, ratio, and dimension analysis.
        </p>
      </article>

      <div className='mt-4 space-y-4'>
        {learningSteps.map((item, idx) => (
          <article key={item.step} className='rounded-xl border border-slate-200 bg-white p-4'>
            <div className='flex flex-wrap items-center justify-between gap-2'>
              <div className='flex items-center gap-3'>
                <span className='inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white'>
                  {item.step}
                </span>
                <h3 className='text-base font-semibold text-slate-900'>{item.viewName}</h3>
              </div>
              <Link
                to={item.viewPath}
                className='rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-800 hover:bg-slate-100'
              >
                Go to View
              </Link>
            </div>

            <div className='mt-3 grid gap-3 md:grid-cols-2'>
              <div>
                <h4 className='text-sm font-semibold text-slate-800'>Main Question</h4>
                <p className='mt-1 text-sm text-slate-700'>{item.mainQuestion}</p>
              </div>
              <div>
                <h4 className='text-sm font-semibold text-slate-800'>Why it matters</h4>
                <p className='mt-1 text-sm text-slate-700'>{item.whyItMatters}</p>
              </div>
              <div>
                <h4 className='text-sm font-semibold text-slate-800'>What you learn</h4>
                <ul className='mt-1 list-disc space-y-1 pl-5 text-sm text-slate-700'>
                  {item.whatYouLearn.map((point) => <li key={point}>{point}</li>)}
                </ul>
              </div>
              <div>
                <h4 className='text-sm font-semibold text-slate-800'>Recommended next step</h4>
                <div className='mt-2 flex flex-wrap items-center gap-2'>
                  {item.recommendedNext.map((next, nextIdx) => (
                    <div key={next} className='flex items-center gap-2'>
                      <span className='rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700'>{next}</span>
                      {nextIdx < item.recommendedNext.length - 1 && <span className='text-slate-400'>→</span>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {idx < learningSteps.length - 1 && <div className='mt-4 border-t border-dashed border-slate-200 pt-4 text-xs text-slate-500'>Continue to Step {item.step + 1}</div>}
          </article>
        ))}
      </div>
    </section>
  )
}
