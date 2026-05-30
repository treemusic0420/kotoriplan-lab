import { Link } from 'react-router-dom'

type LearningModule = {
  title: string
  path: string
}

type LearningJourneyStep = {
  step: number
  title: string
  description: string
  modules: LearningModule[]
}

const recommendedJourney: LearningJourneyStep[] = [
  {
    step: 1,
    title: 'Foundations',
    description: 'Understand what drives revenue, cost, and profit.',
    modules: [
      { title: 'Driver Planning', path: '/drivers' },
      { title: 'Variance Drivers', path: '/pl/variance-drivers' }
    ]
  },
  {
    step: 2,
    title: 'Profitability Analysis',
    description: 'Learn how operational drivers create profit.',
    modules: [
      { title: 'PL View', path: '/pl' },
      { title: 'PL by Dimension', path: '/pl/by-dimension' },
      { title: 'PL Variance', path: '/pl/variance' },
      { title: 'PL Bridge', path: '/pl/bridge' },
      { title: 'Ratio Analysis', path: '/pl/ratios' }
    ]
  },
  {
    step: 3,
    title: 'Operational Planning',
    description: 'Connect workforce, capacity, and investment decisions.',
    modules: [
      { title: 'Headcount Planning', path: '/planning/headcount' },
      { title: 'Capacity Planning', path: '/planning/capacity' },
      { title: 'CapEx Planning', path: '/planning/capex' }
    ]
  },
  {
    step: 4,
    title: 'Forecasting & Scenarios',
    description: 'Evaluate uncertainty and future outcomes.',
    modules: [
      { title: 'Rolling Forecast', path: '/forecast/rolling' },
      { title: 'Sensitivity Analysis', path: '/drivers/sensitivity' },
      { title: 'Break-even Analysis', path: '/drivers/break-even' },
      { title: 'Scenario Planning', path: '/planning/scenario-planning' }
    ]
  },
  {
    step: 5,
    title: 'Strategic Planning',
    description: 'Translate strategy into financial outcomes.',
    modules: [
      { title: 'Investment Portfolio Planning', path: '/planning/investment-portfolio' },
      { title: 'Long Range Planning', path: '/planning/long-range' },
      { title: 'Strategic Initiative Planning', path: '/planning/strategic-initiative' }
    ]
  },
  {
    step: 6,
    title: 'Enterprise View',
    description: 'Connect P&L, Cash Flow, Balance Sheet, and Strategy.',
    modules: [
      { title: 'Cash Flow Planning', path: '/planning/cash-flow' },
      { title: 'Balance Sheet Planning', path: '/planning/balance-sheet' },
      { title: 'Strategic Driver Tree', path: '/planning/strategic-driver-tree' }
    ]
  }
]

const completedModuleTitles = new Set([
  'Driver Planning',
  'Variance Drivers',
  'PL View'
])

const capabilityFlow = [
  'Drivers',
  'Revenue & Margin',
  'Workforce & Capacity',
  'Investment',
  'Forecasting',
  'Cash Flow',
  'Balance Sheet',
  'Enterprise Strategy'
]

const explainableQuestions = [
  'What drives revenue?',
  'What drives profit?',
  'How many people are required?',
  'How much capacity is needed?',
  'Which investments create value?',
  'What is the downside risk?',
  'How does profit become cash?',
  'How does cash become balance sheet strength?',
  'Which drivers create enterprise value?'
]

const totalModuleCount = recommendedJourney.reduce((sum, step) => sum + step.modules.length, 0)
const completedModuleCount = recommendedJourney.reduce(
  (sum, step) => sum + step.modules.filter((module) => completedModuleTitles.has(module.title)).length,
  0
)

export function LearningPathPage() {
  return (
    <section className='space-y-8'>
      <div className='overflow-hidden rounded-3xl bg-slate-950 text-white shadow-sm'>
        <div className='grid gap-8 p-6 md:grid-cols-[1.4fr_0.8fr] md:p-8'>
          <div>
            <p className='text-xs font-semibold uppercase tracking-[0.35em] text-cyan-300'>FP&A Learning Top Page</p>
            <h2 className='mt-4 text-3xl font-bold tracking-tight md:text-4xl'>Learning Path</h2>
            <p className='mt-4 max-w-3xl text-sm leading-7 text-slate-200 md:text-base'>
              Follow a guided FP&A roadmap from Driver Planning to P&L, Cash Flow, Balance Sheet, and Strategy. Each step explains where the module fits, why it matters, and how it connects to the next planning layer.
            </p>
          </div>
          <div className='rounded-2xl border border-white/10 bg-white/10 p-5'>
            <p className='text-xs font-semibold uppercase tracking-[0.25em] text-cyan-200'>Journey Progress</p>
            <p className='mt-4 text-4xl font-bold'>{completedModuleCount}/{totalModuleCount}</p>
            <p className='mt-2 text-sm text-slate-200'>completed modules in this local demo calculation</p>
            <div className='mt-5 h-2 rounded-full bg-white/15'>
              <div
                className='h-2 rounded-full bg-cyan-300'
                style={{ width: `${Math.round((completedModuleCount / totalModuleCount) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <section className='space-y-5'>
        <div>
          <p className='text-xs font-semibold uppercase tracking-[0.25em] text-cyan-700'>Recommended Learning Journey</p>
          <h3 className='mt-2 text-2xl font-semibold text-slate-900'>Learn FP&A in the order business decisions happen</h3>
          <p className='mt-2 max-w-3xl text-sm leading-6 text-slate-600'>
            Start with the drivers that create performance, move through profitability and operational planning, then connect forecasts to enterprise-level financial statements and strategy.
          </p>
        </div>

        <div className='grid gap-5 lg:grid-cols-2'>
          {recommendedJourney.map((step) => {
            const completedCount = step.modules.filter((module) => completedModuleTitles.has(module.title)).length
            const completionPercent = Math.round((completedCount / step.modules.length) * 100)

            return (
              <article key={step.step} className='group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-200 hover:shadow-md'>
                <div className='flex items-start gap-4'>
                  <div className='flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-center text-4xl font-black leading-none text-white shadow-sm'>
                    {step.step}
                  </div>
                  <div className='min-w-0 flex-1'>
                    <div className='flex flex-wrap items-center justify-between gap-2'>
                      <p className='text-xs font-semibold uppercase tracking-[0.25em] text-cyan-700'>STEP {step.step}</p>
                      <span className='rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700'>
                        {completedCount}/{step.modules.length} completed
                      </span>
                    </div>
                    <h4 className='mt-2 text-xl font-semibold text-slate-900'>{step.title}</h4>
                    <p className='mt-2 text-sm leading-6 text-slate-600'>{step.description}</p>
                  </div>
                </div>

                <div className='mt-5 h-2 rounded-full bg-slate-100'>
                  <div className='h-2 rounded-full bg-cyan-500' style={{ width: `${completionPercent}%` }} />
                </div>

                <div className='mt-5 grid flex-1 gap-2 sm:grid-cols-2'>
                  {step.modules.map((module) => {
                    const isCompleted = completedModuleTitles.has(module.title)

                    return (
                      <Link
                        key={module.title}
                        to={module.path}
                        className='flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-semibold text-slate-800 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-900'
                      >
                        <span>{module.title}</span>
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${isCompleted ? 'bg-cyan-100 text-cyan-800' : 'bg-white text-slate-500'}`}>
                          {isCompleted ? 'Done' : 'Open'}
                        </span>
                      </Link>
                    )
                  })}
                </div>
              </article>
            )
          })}
        </div>
      </section>

      <section className='rounded-2xl border border-slate-200 bg-white p-5 shadow-sm'>
        <p className='text-xs font-semibold uppercase tracking-[0.25em] text-cyan-700'>FP&A Capability Map</p>
        <h3 className='mt-2 text-2xl font-semibold text-slate-900'>How each capability flows into the next</h3>
        <div className='mt-6 grid gap-3 xl:grid-cols-8'>
          {capabilityFlow.map((capability, index) => (
            <div key={capability} className='relative rounded-2xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-4 text-center'>
              <div className='mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-cyan-100 text-sm font-bold text-cyan-800'>{index + 1}</div>
              <p className='mt-3 text-sm font-semibold leading-5 text-slate-900'>{capability}</p>
              {index < capabilityFlow.length - 1 && (
                <>
                  <span className='absolute -right-3 top-1/2 hidden -translate-y-1/2 text-xl font-bold text-slate-300 xl:block'>→</span>
                  <span className='absolute -bottom-4 left-1/2 -translate-x-1/2 text-xl font-bold text-slate-300 xl:hidden'>↓</span>
                </>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className='rounded-2xl border border-cyan-200 bg-gradient-to-br from-cyan-50 via-white to-slate-50 p-5 shadow-sm'>
        <p className='text-xs font-semibold uppercase tracking-[0.25em] text-cyan-700'>What you can explain after completing this journey</p>
        <h3 className='mt-2 text-2xl font-semibold text-slate-900'>From business questions to enterprise value</h3>
        <div className='mt-5 grid gap-3 md:grid-cols-3'>
          {explainableQuestions.map((question) => (
            <div key={question} className='rounded-xl border border-cyan-100 bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm'>
              {question}
            </div>
          ))}
        </div>
      </section>
    </section>
  )
}
