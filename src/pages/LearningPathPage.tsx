import { Link } from 'react-router-dom'

type CurriculumStep = {
  step: number
  title: string
  path: string
  whyQuestion: string
  learn: string[]
  outcome: string
}

type CurriculumStage = {
  stage: number
  label: string
  theme: string
  description: string
  steps: CurriculumStep[]
}

type MaturityLevel = {
  level: string
  modules: string[]
}

const journeyQuestions = [
  'Why Revenue Changes',
  'Why Costs Change',
  'Why Headcount Changes',
  'Why Capacity Matters',
  'Why Investments Matter',
  'How Multi-Year Plans Work',
  'How Cash Becomes Financial Position',
  'How Executives Make Decisions'
]

const curriculumStages: CurriculumStage[] = [
  {
    stage: 1,
    label: 'Driver Foundation',
    theme: 'Connect financial results to the business drivers underneath them.',
    description: 'Start with the mechanics of revenue, cost, variance, and executive storytelling.',
    steps: [
      {
        step: 1,
        title: 'Driver Planning',
        path: '/drivers',
        whyQuestion: 'Why do revenue and cost change?',
        learn: ['Revenue = Volume × Price', 'Cost = Fixed + Variable'],
        outcome: 'Understand what drives financial performance'
      },
      {
        step: 2,
        title: 'Variance Drivers',
        path: '/pl/variance-drivers',
        whyQuestion: 'Why does actual differ from budget?',
        learn: ['Why actual differs from budget'],
        outcome: 'Explain performance changes'
      },
      {
        step: 3,
        title: 'PL Bridge',
        path: '/pl/bridge',
        whyQuestion: 'How did budget become actual?',
        learn: ['Walk from Budget to Actual'],
        outcome: 'Tell the financial story'
      }
    ]
  },
  {
    stage: 2,
    label: 'Operational Planning',
    theme: 'Translate people, utilization, and operating constraints into financial impact.',
    description: 'Move from financial explanations into the operating model that creates them.',
    steps: [
      {
        step: 4,
        title: 'Headcount Planning',
        path: '/planning/headcount',
        whyQuestion: 'Why does headcount change?',
        learn: ['Hiring', 'Attrition', 'Workforce Cost'],
        outcome: 'Connect people plans to profit'
      },
      {
        step: 5,
        title: 'Capacity Planning',
        path: '/planning/capacity',
        whyQuestion: 'Why does capacity matter?',
        learn: ['Utilization', 'Bottlenecks', 'Production Capacity'],
        outcome: 'Understand operational constraints'
      }
    ]
  },
  {
    stage: 3,
    label: 'Investment Planning',
    theme: 'Evaluate projects and decide where scarce capital should go.',
    description: 'Learn how FP&A compares investment choices and links capital allocation to outcomes.',
    steps: [
      {
        step: 6,
        title: 'CapEx Planning',
        path: '/planning/capex',
        whyQuestion: 'Why do investments matter?',
        learn: ['ROI', 'Payback', 'Investment Decisions'],
        outcome: 'Evaluate investments'
      },
      {
        step: 7,
        title: 'Investment Portfolio Planning',
        path: '/planning/investment-portfolio',
        whyQuestion: 'Where should capital be allocated?',
        learn: ['Capital Allocation', 'Project Prioritization'],
        outcome: 'Decide where capital should go'
      }
    ]
  },
  {
    stage: 4,
    label: 'Forecasting',
    theme: 'Update the outlook continuously and prepare leaders for uncertainty.',
    description: 'Build the planning cadence that turns actuals into forward-looking decisions.',
    steps: [
      {
        step: 8,
        title: 'Rolling Forecast',
        path: '/forecast/rolling',
        whyQuestion: 'How does the outlook change as actuals arrive?',
        learn: ['Actual + Remaining Forecast'],
        outcome: 'Update outlook continuously'
      },
      {
        step: 9,
        title: 'Scenario Planning',
        path: '/planning/scenario-planning',
        whyQuestion: 'What if the future is better or worse than plan?',
        learn: ['Best', 'Base', 'Worst'],
        outcome: 'Prepare for uncertainty'
      },
      {
        step: 10,
        title: 'Cash Flow Planning',
        path: '/planning/cash-flow',
        whyQuestion: 'Will the business have enough cash?',
        learn: ['Operating Cash Flow', 'Free Cash Flow', 'Cash Runway'],
        outcome: 'Connect profit to liquidity'
      },
      {
        step: 11,
        title: 'Balance Sheet Planning',
        path: '/planning/balance-sheet',
        whyQuestion: 'How does cash flow become financial position?',
        learn: ['Assets = Liabilities + Equity', 'Profit → Equity', 'Debt and Working Capital'],
        outcome: 'Understand financial position'
      }
    ]
  },
  {
    stage: 5,
    label: 'Strategic FP&A',
    theme: 'Connect strategy, operations, investment, and profit into an integrated plan.',
    description: 'Finish with the executive-level models used to set targets and make trade-offs.',
    steps: [
      {
        step: 12,
        title: 'Long Range Planning',
        path: '/planning/long-range',
        whyQuestion: 'How do multi-year plans work?',
        learn: ['5-Year Outlook', 'CAGR', 'Strategic Targets'],
        outcome: 'Build long-term plans'
      },
      {
        step: 13,
        title: 'Strategic Initiative Planning',
        path: '/planning/strategic-initiative',
        whyQuestion: 'How does strategy become numbers?',
        learn: ['Strategy → Revenue', 'Strategy → Headcount', 'Strategy → Capacity', 'Strategy → Profit'],
        outcome: 'Translate strategy into numbers'
      },
      {
        step: 14,
        title: 'Strategic Driver Tree',
        path: '/planning/strategic-driver-tree',
        whyQuestion: 'How do executives make decisions across the whole system?',
        learn: ['Revenue Drivers', 'Cost Drivers', 'Capacity Drivers', 'Investment Drivers'],
        outcome: 'Understand the full business system'
      }
    ]
  }
]

const maturityLevels: MaturityLevel[] = [
  { level: 'Analyst', modules: ['Driver Planning', 'Variance Drivers', 'PL Bridge'] },
  { level: 'Senior Analyst', modules: ['Rolling Forecast', 'Headcount Planning'] },
  { level: 'Manager', modules: ['Capacity Planning', 'CapEx Planning'] },
  { level: 'Director', modules: ['Investment Portfolio Planning', 'Scenario Planning', 'Cash Flow Planning'] },
  { level: 'CFO', modules: ['Balance Sheet Planning', 'Long Range Planning', 'Strategic Initiative Planning', 'Strategic Driver Tree'] }
]

export function LearningPathPage() {
  return (
    <section className='space-y-6'>
      <div className='overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm'>
        <div className='bg-slate-950 px-6 py-8 text-white'>
          <p className='text-xs font-semibold uppercase tracking-[0.35em] text-cyan-300'>Learning Path</p>
          <h2 className='mt-3 text-3xl font-semibold tracking-tight'>Learn FP&A from Drivers to Strategy</h2>
          <p className='mt-3 max-w-3xl text-sm leading-6 text-slate-300'>
            Follow a structured FP&A curriculum that starts with why financial results move, then builds toward workforce, capacity, investment, forecasting, and executive decision-making.
          </p>
        </div>

        <div className='grid gap-3 border-b border-slate-200 bg-slate-50 p-4 md:grid-cols-8'>
          {journeyQuestions.map((question, index) => (
            <div key={question} className='relative rounded-xl border border-slate-200 bg-white p-3 text-center shadow-sm'>
              <div className='mx-auto flex h-7 w-7 items-center justify-center rounded-full bg-cyan-100 text-xs font-bold text-cyan-800'>{index + 1}</div>
              <p className='mt-2 text-xs font-semibold leading-5 text-slate-800'>{question}</p>
              {index < journeyQuestions.length - 1 && <span className='absolute -right-2 top-1/2 hidden -translate-y-1/2 text-slate-300 md:block'>→</span>}
            </div>
          ))}
        </div>
      </div>

      <div className='space-y-5'>
        {curriculumStages.map((stage) => (
          <article key={stage.stage} className='rounded-2xl border border-slate-200 bg-white p-5 shadow-sm'>
            <div className='flex flex-col gap-3 border-b border-slate-100 pb-4 md:flex-row md:items-start md:justify-between'>
              <div>
                <p className='text-xs font-semibold uppercase tracking-[0.25em] text-cyan-700'>Stage {stage.stage}</p>
                <h3 className='mt-1 text-xl font-semibold text-slate-900'>{stage.label}</h3>
                <p className='mt-2 max-w-3xl text-sm leading-6 text-slate-600'>{stage.description}</p>
              </div>
              <div className='rounded-xl bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 md:max-w-xs'>{stage.theme}</div>
            </div>

            <div className='mt-4 grid gap-4 lg:grid-cols-3'>
              {stage.steps.map((step) => (
                <div key={step.step} className='flex flex-col rounded-xl border border-slate-200 bg-white p-4'>
                  <div className='flex items-start justify-between gap-3'>
                    <div className='flex items-center gap-3'>
                      <span className='inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white'>{step.step}</span>
                      <div>
                        <p className='text-xs font-semibold uppercase tracking-wide text-slate-400'>Step {step.step}</p>
                        <h4 className='text-base font-semibold text-slate-900'>{step.title}</h4>
                      </div>
                    </div>
                    <Link
                      to={step.path}
                      className='shrink-0 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-100'
                    >
                      Start
                    </Link>
                  </div>

                  <div className='mt-4 rounded-lg bg-cyan-50 px-3 py-2 text-sm font-medium text-cyan-900'>{step.whyQuestion}</div>

                  <div className='mt-4 grid flex-1 gap-4'>
                    <div>
                      <h5 className='text-xs font-semibold uppercase tracking-wide text-slate-500'>Learn</h5>
                      <ul className='mt-2 space-y-1 text-sm text-slate-700'>
                        {step.learn.map((item) => (
                          <li key={item} className='flex gap-2'>
                            <span className='mt-2 h-1.5 w-1.5 rounded-full bg-cyan-500' />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h5 className='text-xs font-semibold uppercase tracking-wide text-slate-500'>Outcome</h5>
                      <p className='mt-2 text-sm leading-6 text-slate-700'>{step.outcome}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>

      <section className='grid gap-5 lg:grid-cols-[1.4fr_0.8fr]'>
        <article className='rounded-2xl border border-slate-200 bg-white p-5 shadow-sm'>
          <p className='text-xs font-semibold uppercase tracking-[0.25em] text-cyan-700'>FP&A Maturity Map</p>
          <h3 className='mt-1 text-xl font-semibold text-slate-900'>Grow from Analyst to CFO</h3>
          <div className='mt-5 grid gap-3 md:grid-cols-5'>
            {maturityLevels.map((level, index) => (
              <div key={level.level} className='relative rounded-xl border border-slate-200 bg-slate-50 p-4'>
                <div className='flex items-center justify-between gap-2'>
                  <h4 className='text-sm font-semibold text-slate-900'>{level.level}</h4>
                  <span className='flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs font-bold text-slate-600'>{index + 1}</span>
                </div>
                <ul className='mt-3 space-y-2 text-xs leading-5 text-slate-700'>
                  {level.modules.map((module) => <li key={module}>{module}</li>)}
                </ul>
                {index < maturityLevels.length - 1 && <div className='absolute -right-2 top-1/2 hidden -translate-y-1/2 text-slate-300 md:block'>→</div>}
              </div>
            ))}
          </div>
        </article>

        <article className='rounded-2xl border border-cyan-200 bg-gradient-to-br from-cyan-50 to-white p-5 shadow-sm'>
          <p className='text-xs font-semibold uppercase tracking-[0.25em] text-cyan-700'>Final Certification Card</p>
          <h3 className='mt-2 text-2xl font-semibold text-slate-900'>FP&A Capstone</h3>
          <div className='mt-4 rounded-xl border border-cyan-200 bg-white p-4'>
            <p className='text-xs font-semibold uppercase tracking-wide text-slate-500'>Complete</p>
            <Link to='/planning/strategic-driver-tree' className='mt-2 inline-flex rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700'>
              Strategic Driver Tree
            </Link>
          </div>
          <p className='mt-4 text-sm leading-6 text-slate-700'>
            You can now connect strategy, operations, workforce, investment, and financial performance into one integrated planning model.
          </p>
        </article>
      </section>
    </section>
  )
}
