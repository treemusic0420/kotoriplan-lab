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

type CapabilityStage = {
  title: string
  modules: string[]
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

const capabilityFlow: CapabilityStage[] = [
  {
    title: 'Drivers',
    modules: ['Driver Planning', 'Variance Drivers']
  },
  {
    title: 'Revenue & Margin',
    modules: ['PL View', 'PL by Dimension', 'PL Variance', 'PL Bridge', 'Ratio Analysis']
  },
  {
    title: 'Workforce & Capacity',
    modules: ['Headcount Planning', 'Capacity Planning']
  },
  {
    title: 'Investment',
    modules: ['CapEx Planning', 'Investment Portfolio Planning']
  },
  {
    title: 'Forecasting',
    modules: ['Rolling Forecast', 'Sensitivity Analysis', 'Break-even Analysis', 'Scenario Planning']
  },
  {
    title: 'Cash Flow',
    modules: ['Cash Flow Planning']
  },
  {
    title: 'Balance Sheet',
    modules: ['Balance Sheet Planning']
  },
  {
    title: 'Enterprise Strategy',
    modules: ['Strategic Initiative Planning', 'Strategic Driver Tree', 'Long Range Planning']
  }
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

const professionalMindsetPrinciples = [
  'Revenue does not equal cash.',
  'Profit does not equal value.',
  'Growth consumes capacity.',
  'Capacity requires investment.',
  'Investment creates future cash flow.',
  'Cash flow strengthens the balance sheet.',
  'A stronger balance sheet creates strategic options.'
]

const actualFpAndAResponsibilities = [
  'what drives revenue',
  'what creates profit',
  'what limits growth',
  'where capital should be invested',
  'how profit becomes cash',
  'how cash strengthens the balance sheet',
  'how financial resources create strategic options'
]

const totalModuleCount = recommendedJourney.reduce((sum, step) => sum + step.modules.length, 0)
const completedModuleCount = recommendedJourney.reduce(
  (sum, step) => sum + step.modules.filter((module) => completedModuleTitles.has(module.title)).length,
  0
)
const overallCompletionPercent = Math.round((completedModuleCount / totalModuleCount) * 100)

export function LearningPathPage() {
  return (
    <section className='space-y-8'>
      <div className='overflow-hidden rounded-3xl bg-slate-950 text-white shadow-sm'>
        <div className='grid gap-8 p-6 md:grid-cols-[1.25fr_0.95fr] md:p-8'>
          <div>
            <p className='text-xs font-semibold uppercase tracking-[0.35em] text-cyan-300'>FP&A Learning Top Page</p>
            <h2 className='mt-4 text-3xl font-bold tracking-tight md:text-4xl'>Learning Path</h2>
            <p className='mt-4 max-w-3xl text-sm leading-7 text-slate-200 md:text-base'>
              Follow a guided FP&A roadmap from Driver Planning to P&L, Cash Flow, Balance Sheet, and Strategy. Each step explains where the module fits, why it matters, and how it connects to the next planning layer.
            </p>
          </div>
          <div className='rounded-2xl border border-white/10 bg-white/10 p-5'>
            <p className='text-xs font-semibold uppercase tracking-[0.25em] text-cyan-200'>Journey Progress</p>
            <div className='mt-4 flex flex-wrap items-end justify-between gap-3'>
              <div>
                <p className='text-4xl font-bold'>{completedModuleCount}/{totalModuleCount}</p>
                <p className='mt-2 text-sm text-slate-200'>completed modules in this local demo calculation</p>
              </div>
              <span className='rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-cyan-100'>{overallCompletionPercent}% complete</span>
            </div>
            <div className='mt-5 h-2 rounded-full bg-white/15'>
              <div className='h-2 rounded-full bg-cyan-300' style={{ width: `${overallCompletionPercent}%` }} />
            </div>
            <div className='mt-5 space-y-3 border-t border-white/10 pt-5'>
              {recommendedJourney.map((step) => {
                const completedCount = step.modules.filter((module) => completedModuleTitles.has(module.title)).length
                const completionPercent = Math.round((completedCount / step.modules.length) * 100)

                return (
                  <div key={step.title}>
                    <div className='flex items-center justify-between gap-3 text-xs'>
                      <span className='font-semibold text-slate-100'>{step.title}</span>
                      <span className='font-semibold text-cyan-100'>{completedCount}/{step.modules.length}</span>
                    </div>
                    <div className='mt-1.5 h-1.5 rounded-full bg-white/10'>
                      <div className='h-1.5 rounded-full bg-cyan-300' style={{ width: `${completionPercent}%` }} />
                    </div>
                  </div>
                )
              })}
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
        <p className='mt-2 max-w-3xl text-sm leading-6 text-slate-600'>
          Each stage shows the modules that build that capability, making it easier to see where every lesson sits in the FP&A operating model.
        </p>
        <div className='mt-6 grid gap-4 xl:grid-cols-8'>
          {capabilityFlow.map((capability, index) => (
            <div key={capability.title} className='relative rounded-2xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-4'>
              <div className='mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-cyan-100 text-sm font-bold text-cyan-800'>{index + 1}</div>
              <p className='mt-3 text-center text-sm font-semibold leading-5 text-slate-900'>{capability.title}</p>
              <ul className='mt-4 space-y-2 text-left text-xs leading-5 text-slate-600'>
                {capability.modules.map((module) => (
                  <li key={module} className='rounded-lg border border-slate-100 bg-white px-2.5 py-2 font-medium shadow-sm'>
                    {module}
                  </li>
                ))}
              </ul>
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

      <section className='rounded-2xl border border-slate-200 bg-white p-5 shadow-sm'>
        <p className='text-xs font-semibold uppercase tracking-[0.25em] text-cyan-700'>FP&A Professional Mindset</p>
        <h3 className='mt-2 text-2xl font-semibold text-slate-900'>Principles that connect operational decisions to enterprise value.</h3>
        <div className='mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-7'>
          {professionalMindsetPrinciples.map((principle, index) => (
            <div key={principle} className='relative rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm'>
              <div className='flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white'>{index + 1}</div>
              <p className='mt-4 text-sm font-semibold leading-6 text-slate-900'>{principle}</p>
              {index < professionalMindsetPrinciples.length - 1 && (
                <span className='absolute -bottom-4 left-1/2 -translate-x-1/2 text-xl font-bold text-slate-300 xl:-right-3 xl:bottom-auto xl:left-auto xl:top-1/2 xl:-translate-y-1/2 xl:translate-x-0'>↓</span>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className='rounded-3xl bg-slate-950 p-6 text-white shadow-sm md:p-8'>
        <p className='text-xs font-semibold uppercase tracking-[0.25em] text-cyan-300'>Completion Message</p>
        <h3 className='mt-3 text-2xl font-semibold'>What FP&A professionals actually do</h3>
        <div className='mt-4 max-w-3xl space-y-4 text-sm leading-7 text-slate-200 md:text-base'>
          <p>FP&A is not only reporting numbers.</p>
          <p>It is the discipline of understanding:</p>
          <ul className='grid gap-2 pl-5 sm:grid-cols-2'>
            {actualFpAndAResponsibilities.map((responsibility) => (
              <li key={responsibility} className='list-disc'>
                {responsibility}
              </li>
            ))}
          </ul>
          <p className='font-semibold text-white'>The goal is to support better business decisions.</p>
        </div>
      </section>
    </section>
  )
}
