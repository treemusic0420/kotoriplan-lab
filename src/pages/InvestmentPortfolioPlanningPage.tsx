import { useMemo, useState } from 'react'
import { LearningNotes } from '../shared/LearningNotes'

type ProjectKey = 'A' | 'B' | 'C'

type InvestmentProjectInput = {
  key: ProjectKey
  name: string
  investmentCost: number
  annualBenefit: number
  strategicScore: number
}

type EvaluatedProject = InvestmentProjectInput & {
  roi: number | null
  paybackYears: number | null
  compositeScore: number
  recommendedRank: number
}

type PortfolioSummary = {
  selectedProjects: EvaluatedProject[]
  rejectedProjects: EvaluatedProject[]
  investmentUsed: number
  remainingBudget: number
  annualBenefit: number
  portfolioRoi: number | null
  portfolioPayback: number | null
}

type PortfolioScenario = {
  label: string
  focus: string
  selectedProjects: EvaluatedProject[]
  investmentUsed: number
  remainingBudget: number
  annualBenefit: number
  portfolioRoi: number | null
}

const initialBudget = 1000000

const initialProjects: InvestmentProjectInput[] = [
  { key: 'A', name: 'New Production Line', investmentCost: 500000, annualBenefit: 150000, strategicScore: 8 },
  { key: 'B', name: 'Automation Upgrade', investmentCost: 300000, annualBenefit: 120000, strategicScore: 7 },
  { key: 'C', name: 'Analytics Platform', investmentCost: 200000, annualBenefit: 100000, strategicScore: 9 },
]

const moneyFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
const decimalFormatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 })
const percentFormatter = new Intl.NumberFormat('en-US', { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 })

const formatMoney = (value: number) => moneyFormatter.format(value)
const formatDecimal = (value: number | null) => (value === null ? '—' : decimalFormatter.format(value))
const formatPercent = (value: number | null) => (value === null ? '—' : percentFormatter.format(value))
const formatPayback = (value: number | null) => (value === null ? '—' : `${formatDecimal(value)} years`)

const safeNumber = (value: number) => (Number.isFinite(value) ? Math.max(0, value) : 0)

function evaluateProjects(projects: InvestmentProjectInput[]): EvaluatedProject[] {
  const evaluatedWithoutRank = projects.map((project) => {
    const investmentCost = safeNumber(project.investmentCost)
    const annualBenefit = safeNumber(project.annualBenefit)
    const roi = investmentCost === 0 ? null : annualBenefit / investmentCost
    const paybackYears = annualBenefit === 0 ? null : investmentCost / annualBenefit
    const compositeScore = (roi ?? 0) * 100 + project.strategicScore * 5

    return {
      ...project,
      investmentCost,
      annualBenefit,
      roi,
      paybackYears,
      compositeScore,
    }
  })

  const rankedProjects = [...evaluatedWithoutRank].sort((a, b) => {
    if (b.compositeScore !== a.compositeScore) return b.compositeScore - a.compositeScore
    return b.annualBenefit - a.annualBenefit
  })

  return evaluatedWithoutRank.map((project) => ({
    ...project,
    recommendedRank: rankedProjects.findIndex((rankedProject) => rankedProject.key === project.key) + 1,
  }))
}

function buildPortfolio(budget: number, orderedProjects: EvaluatedProject[]): PortfolioSummary {
  const selectedProjects: EvaluatedProject[] = []
  const rejectedProjects: EvaluatedProject[] = []
  let investmentUsed = 0

  orderedProjects.forEach((project) => {
    if (investmentUsed + project.investmentCost <= budget) {
      selectedProjects.push(project)
      investmentUsed += project.investmentCost
    } else {
      rejectedProjects.push(project)
    }
  })

  const annualBenefit = selectedProjects.reduce((sum, project) => sum + project.annualBenefit, 0)

  return {
    selectedProjects,
    rejectedProjects,
    investmentUsed,
    remainingBudget: Math.max(0, budget - investmentUsed),
    annualBenefit,
    portfolioRoi: investmentUsed === 0 ? null : annualBenefit / investmentUsed,
    portfolioPayback: annualBenefit === 0 ? null : investmentUsed / annualBenefit,
  }
}

function getRecommendation(projects: EvaluatedProject[], portfolio: PortfolioSummary) {
  if (portfolio.selectedProjects.length === projects.length) {
    return {
      label: 'Budget allows all projects to be funded.',
      description: 'The portfolio can approve every opportunity while still tracking ROI, payback, and strategic score.',
      className: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    }
  }

  if (portfolio.selectedProjects.length === 0) {
    return {
      label: 'Additional funding or project deferral should be considered.',
      description: 'The current budget cannot fund the evaluated investment opportunities.',
      className: 'border-rose-200 bg-rose-50 text-rose-900',
    }
  }

  return {
    label: 'Prioritize projects with strongest portfolio impact.',
    description: 'Only part of the pipeline fits within budget, so approve the strongest combination and defer lower-priority projects.',
    className: 'border-amber-200 bg-amber-50 text-amber-900',
  }
}

export function InvestmentPortfolioPlanningPage() {
  const [budget, setBudget] = useState(initialBudget)
  const [projects, setProjects] = useState<InvestmentProjectInput[]>(initialProjects)

  const evaluatedProjects = useMemo(() => evaluateProjects(projects), [projects])
  const rankedProjects = useMemo(() => [...evaluatedProjects].sort((a, b) => a.recommendedRank - b.recommendedRank), [evaluatedProjects])
  const portfolio = useMemo(() => buildPortfolio(safeNumber(budget), rankedProjects), [budget, rankedProjects])
  const recommendation = useMemo(() => getRecommendation(evaluatedProjects, portfolio), [evaluatedProjects, portfolio])

  const scenarios = useMemo<PortfolioScenario[]>(() => {
    const scenarioDefinitions = [
      {
        label: 'Conservative Portfolio',
        focus: 'ROI focus',
        projects: [...evaluatedProjects].sort((a, b) => (b.roi ?? 0) - (a.roi ?? 0)),
      },
      {
        label: 'Balanced Portfolio',
        focus: 'ROI + Strategic Score',
        projects: rankedProjects,
      },
      {
        label: 'Strategic Portfolio',
        focus: 'Strategic Score focus',
        projects: [...evaluatedProjects].sort((a, b) => b.strategicScore - a.strategicScore || (b.roi ?? 0) - (a.roi ?? 0)),
      },
    ]

    return scenarioDefinitions.map((scenario) => {
      const scenarioPortfolio = buildPortfolio(safeNumber(budget), scenario.projects)
      return {
        label: scenario.label,
        focus: scenario.focus,
        selectedProjects: scenarioPortfolio.selectedProjects,
        investmentUsed: scenarioPortfolio.investmentUsed,
        remainingBudget: scenarioPortfolio.remainingBudget,
        annualBenefit: scenarioPortfolio.annualBenefit,
        portfolioRoi: scenarioPortfolio.portfolioRoi,
      }
    })
  }, [budget, evaluatedProjects, rankedProjects])

  const waterfallRows = [
    { label: 'Budget', display: formatMoney(safeNumber(budget)), value: safeNumber(budget), tone: 'bg-blue-500' },
    { label: 'Approved Projects', display: formatMoney(portfolio.investmentUsed), value: portfolio.investmentUsed, tone: 'bg-purple-500' },
    { label: 'Remaining Budget', display: formatMoney(portfolio.remainingBudget), value: portfolio.remainingBudget, tone: 'bg-emerald-500' },
    { label: 'Expected Annual Benefit', display: formatMoney(portfolio.annualBenefit), value: portfolio.annualBenefit, tone: 'bg-amber-500' },
  ]
  const maxWaterfallValue = Math.max(...waterfallRows.map((row) => row.value), 1)

  const updateProject = (projectKey: ProjectKey, field: 'name' | 'investmentCost' | 'annualBenefit', value: string) => {
    setProjects((currentProjects) => currentProjects.map((project) => {
      if (project.key !== projectKey) return project
      if (field === 'name') return { ...project, name: value }
      return { ...project, [field]: Number(value) }
    }))
  }

  return (
    <section className='rounded-xl bg-white p-6 shadow-sm'>
      <div className='flex flex-wrap items-start justify-between gap-3'>
        <div>
          <h2 className='text-lg font-medium text-slate-900'>Investment Portfolio Planning</h2>
          <p className='mt-1 text-sm text-slate-600'>Allocate limited capital across competing projects by comparing economics and strategic impact.</p>
        </div>
        <div className='rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700'>Capital Allocation</div>
      </div>

      <LearningNotes
        title='Investment Portfolio Planning'
        purpose='Compare multiple investment opportunities and decide where limited capital should be allocated.'
        keyQuestion='If investment budget is limited, which projects should be approved first?'
        whenToUse={['Annual planning', 'Capital budgeting', 'Strategic investment review', 'Board approval preparation']}
        howToRead={['Compare ROI', 'Compare Payback', 'Compare strategic impact', 'Prioritize projects within budget constraints']}
        fpnaTips={[
          'Highest ROI does not always mean highest priority.',
          'Capacity expansion and strategic projects may justify lower ROI.',
          'Capital allocation is one of the most important FP&A responsibilities.',
        ]}
        nextAction={['Evaluate project economics', 'Rank projects by portfolio impact', 'Approve projects that fit within the budget']}
        defaultOpen
      />

      <article className='mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4'>
        <h3 className='text-sm font-semibold text-slate-800'>Input Panel</h3>
        <div className='mt-3 grid gap-3 md:grid-cols-2'>
          <label className='text-sm font-medium text-slate-700'>Available Investment Budget<input className='mt-1 w-full rounded border border-slate-300 bg-white px-2 py-2' type='number' value={budget} onChange={(e) => setBudget(Number(e.target.value))} /></label>
        </div>
        <div className='mt-4 grid gap-3 lg:grid-cols-3'>
          {projects.map((project) => (
            <div key={project.key} className='rounded-lg border border-slate-200 bg-white p-3'>
              <div className='text-xs font-semibold uppercase tracking-wide text-slate-500'>Project {project.key}</div>
              <label className='mt-2 block text-sm font-medium text-slate-700'>Name<input className='mt-1 w-full rounded border border-slate-300 bg-white px-2 py-2' value={project.name} onChange={(e) => updateProject(project.key, 'name', e.target.value)} /></label>
              <label className='mt-2 block text-sm font-medium text-slate-700'>Investment Cost<input className='mt-1 w-full rounded border border-slate-300 bg-white px-2 py-2' type='number' value={project.investmentCost} onChange={(e) => updateProject(project.key, 'investmentCost', e.target.value)} /></label>
              <label className='mt-2 block text-sm font-medium text-slate-700'>Annual Benefit<input className='mt-1 w-full rounded border border-slate-300 bg-white px-2 py-2' type='number' value={project.annualBenefit} onChange={(e) => updateProject(project.key, 'annualBenefit', e.target.value)} /></label>
              <div className='mt-2 rounded bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700'>Strategic Score: {project.strategicScore}</div>
            </div>
          ))}
        </div>
      </article>

      <div className='mt-4 grid gap-3 text-sm md:grid-cols-2 lg:grid-cols-3'>
        <div className='rounded-lg border border-blue-200 bg-blue-50 p-3'><div className='text-blue-700'>Total Budget</div><div className='font-semibold text-blue-900'>{formatMoney(safeNumber(budget))}</div></div>
        <div className='rounded-lg border border-purple-200 bg-purple-50 p-3'><div className='text-purple-700'>Selected Investment</div><div className='font-semibold text-purple-900'>{formatMoney(portfolio.investmentUsed)}</div></div>
        <div className='rounded-lg border border-emerald-200 bg-emerald-50 p-3'><div className='text-emerald-700'>Remaining Budget</div><div className='font-semibold text-emerald-900'>{formatMoney(portfolio.remainingBudget)}</div></div>
        <div className='rounded-lg border bg-slate-50 p-3'><div className='text-slate-500'>Portfolio ROI</div><div className='font-semibold'>{formatPercent(portfolio.portfolioRoi)}</div></div>
        <div className='rounded-lg border border-amber-200 bg-amber-50 p-3'><div className='text-amber-700'>Portfolio Annual Benefit</div><div className='font-semibold text-amber-900'>{formatMoney(portfolio.annualBenefit)}</div></div>
        <div className='rounded-lg border bg-slate-50 p-3'><div className='text-slate-500'>Portfolio Payback</div><div className='font-semibold'>{formatPayback(portfolio.portfolioPayback)}</div></div>
      </div>

      <article className='mt-4 rounded-lg border border-slate-200 bg-white p-4'>
        <h3 className='text-sm font-semibold text-slate-800'>Project Evaluation Table</h3>
        <p className='mt-1 text-xs text-slate-600'>ROI equals Annual Benefit / Investment Cost. Payback equals Investment Cost / Annual Benefit.</p>
        <div className='mt-3 overflow-x-auto'>
          <table className='min-w-full border-collapse text-sm'>
            <thead>
              <tr className='border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500'>
                <th className='px-3 py-2'>Project</th>
                <th className='px-3 py-2 text-right'>Cost</th>
                <th className='px-3 py-2 text-right'>Annual Benefit</th>
                <th className='px-3 py-2 text-right'>ROI %</th>
                <th className='px-3 py-2 text-right'>Payback Years</th>
                <th className='px-3 py-2 text-right'>Strategic Score</th>
                <th className='px-3 py-2 text-right'>Recommended Rank</th>
              </tr>
            </thead>
            <tbody>
              {rankedProjects.map((project) => (
                <tr key={project.key} className='border-b border-slate-100 last:border-0'>
                  <th className='px-3 py-3 text-left font-medium text-slate-800'>{project.name}</th>
                  <td className='px-3 py-3 text-right text-slate-700'>{formatMoney(project.investmentCost)}</td>
                  <td className='px-3 py-3 text-right text-slate-700'>{formatMoney(project.annualBenefit)}</td>
                  <td className='px-3 py-3 text-right text-slate-700'>{formatPercent(project.roi)}</td>
                  <td className='px-3 py-3 text-right text-slate-700'>{formatPayback(project.paybackYears)}</td>
                  <td className='px-3 py-3 text-right text-slate-700'>{project.strategicScore}</td>
                  <td className='px-3 py-3 text-right'><span className='rounded-full bg-slate-900 px-2 py-1 text-xs font-semibold text-white'>#{project.recommendedRank}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>

      <div className='mt-4 grid gap-4 lg:grid-cols-2'>
        <article className='rounded-lg border border-emerald-200 bg-emerald-50 p-4'>
          <h3 className='text-sm font-semibold text-emerald-900'>Approved Projects</h3>
          <ul className='mt-3 space-y-2 text-sm text-emerald-900'>
            {portfolio.selectedProjects.length === 0 ? <li>No projects fit within the current budget.</li> : portfolio.selectedProjects.map((project) => <li key={project.key} className='rounded bg-white/70 p-2'>{project.name} — {formatMoney(project.investmentCost)}</li>)}
          </ul>
        </article>
        <article className='rounded-lg border border-rose-200 bg-rose-50 p-4'>
          <h3 className='text-sm font-semibold text-rose-900'>Rejected Projects</h3>
          <ul className='mt-3 space-y-2 text-sm text-rose-900'>
            {portfolio.rejectedProjects.length === 0 ? <li>No rejected projects under the current budget.</li> : portfolio.rejectedProjects.map((project) => <li key={project.key} className='rounded bg-white/70 p-2'>{project.name} — budget or priority constraint</li>)}
          </ul>
        </article>
      </div>

      <article className='mt-4 rounded-lg border border-slate-200 bg-white p-4'>
        <h3 className='text-sm font-semibold text-slate-800'>Capital Allocation Waterfall</h3>
        <p className='mt-1 text-xs text-slate-600'>Follow capital from total budget to funded projects, remaining budget, and expected annual benefit.</p>
        <div className='mt-3 grid gap-3 md:grid-cols-4'>
          {waterfallRows.map((row, index) => (
            <div key={row.label} className='rounded-lg border border-slate-200 bg-slate-50 p-3'>
              <div className='flex items-center justify-between gap-2'>
                <div className='text-xs font-medium uppercase tracking-wide text-slate-500'>{row.label}</div>
                {index < waterfallRows.length - 1 && <div className='text-slate-400'>→</div>}
              </div>
              <div className='mt-2 h-2 rounded-full bg-slate-200'><div className={`h-2 rounded-full ${row.tone}`} style={{ width: `${Math.max(8, (row.value / maxWaterfallValue) * 100)}%` }} /></div>
              <div className='mt-2 text-lg font-semibold text-slate-900'>{row.display}</div>
            </div>
          ))}
        </div>
      </article>

      <article className={`mt-4 rounded-lg border p-4 ${recommendation.className}`}>
        <h3 className='text-sm font-semibold'>Investment Recommendation</h3>
        <div className='mt-1 text-lg font-semibold'>{recommendation.label}</div>
        <p className='mt-1 text-sm'>{recommendation.description}</p>
      </article>

      <article className='mt-4 rounded-lg border border-slate-200 bg-white p-4'>
        <h3 className='text-sm font-semibold text-slate-800'>Scenario Comparison</h3>
        <p className='mt-1 text-xs text-slate-600'>Compare ROI-first, balanced, and strategic-first portfolio rules under the same budget constraint.</p>
        <div className='mt-3 overflow-x-auto'>
          <table className='min-w-full border-collapse text-sm'>
            <thead>
              <tr className='border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500'>
                <th className='px-3 py-2'>Scenario</th>
                <th className='px-3 py-2'>Selected Projects</th>
                <th className='px-3 py-2 text-right'>Investment Used</th>
                <th className='px-3 py-2 text-right'>Remaining Budget</th>
                <th className='px-3 py-2 text-right'>Annual Benefit</th>
                <th className='px-3 py-2 text-right'>Portfolio ROI</th>
              </tr>
            </thead>
            <tbody>
              {scenarios.map((scenario) => (
                <tr key={scenario.label} className='border-b border-slate-100 last:border-0'>
                  <th className='px-3 py-3 text-left font-medium text-slate-800'>{scenario.label}<div className='text-xs font-normal text-slate-500'>{scenario.focus}</div></th>
                  <td className='px-3 py-3 text-slate-700'>{scenario.selectedProjects.length === 0 ? 'None' : scenario.selectedProjects.map((project) => project.name).join(', ')}</td>
                  <td className='px-3 py-3 text-right text-slate-700'>{formatMoney(scenario.investmentUsed)}</td>
                  <td className='px-3 py-3 text-right text-slate-700'>{formatMoney(scenario.remainingBudget)}</td>
                  <td className='px-3 py-3 text-right text-slate-700'>{formatMoney(scenario.annualBenefit)}</td>
                  <td className='px-3 py-3 text-right text-slate-700'>{formatPercent(scenario.portfolioRoi)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>

      <article className='mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4'>
        <h3 className='text-sm font-semibold text-slate-800'>Learning Flow</h3>
        <ol className='mt-3 grid gap-2 text-sm text-slate-700 md:grid-cols-5'>
          {[
            'Evaluate project economics',
            'Compare ROI and payback',
            'Apply budget constraint',
            'Prioritize investments',
            'Build optimal portfolio',
          ].map((step, index) => (
            <li key={step} className='rounded-lg border border-slate-200 bg-white p-3'>
              <div className='text-xs font-semibold uppercase tracking-wide text-slate-500'>Step {index + 1}</div>
              <div className='mt-1 font-medium text-slate-900'>{step}</div>
            </li>
          ))}
        </ol>
      </article>
    </section>
  )
}
