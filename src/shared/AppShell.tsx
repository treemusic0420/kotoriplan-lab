import { Link, matchPath, useLocation } from 'react-router-dom'
import { useEffect, type ReactNode } from 'react'
import { useAuth } from '../features/auth/AuthProvider'
import { getLearningModuleIdForPath, markModuleCompleted } from './learningProgress'

type NavLinkItem = {
  to: string
  label: string
  activePatterns?: string[]
  activeWhen?: (pathname: string) => boolean
}

type NavGroup = {
  title: string
  links: NavLinkItem[]
}

const learningPathLink: NavLinkItem = { to: '/learning-path', label: 'Learning Path' }

const navGroups: NavGroup[] = [
  {
    title: 'Core',
    links: [
      {
        to: '/scenarios',
        label: 'Scenario List',
        activeWhen: (pathname) => pathname === '/scenarios' || /^\/scenarios\/(?!new$|compare$)[^/]+$/.test(pathname),
      },
      {
        to: '/scenarios/new',
        label: 'Scenario Editor',
        activeWhen: (pathname) => pathname === '/scenarios/new' || /^\/scenarios\/[^/]+\/edit$/.test(pathname),
      },
      { to: '/compare', label: 'Scenario Compare', activePatterns: ['/compare', '/scenarios/compare'] },
      { to: '/tags', label: 'Scenario Labels' },
      { to: '/dimensions', label: 'Analysis Dimensions' },
    ],
  },
  {
    title: 'P&L Analysis',
    links: [
      { to: '/pl', label: 'PL View' },
      { to: '/pl/by-dimension', label: 'PL by Dimension' },
      { to: '/pl/variance', label: 'PL Variance' },
      { to: '/pl/variance-drivers', label: 'Variance Drivers' },
      { to: '/pl/bridge', label: 'PL Bridge' },
      { to: '/pl/ratios', label: 'Ratio Analysis' },
    ],
  },
  {
    title: 'Driver Planning',
    links: [
      { to: '/drivers', label: 'Driver Planning' },
      { to: '/drivers/sensitivity', label: 'Sensitivity Analysis' },
      { to: '/drivers/break-even', label: 'Break-even Analysis' },
    ],
  },
  {
    title: 'Operational Planning',
    links: [
      { to: '/planning/headcount', label: 'Headcount Planning' },
      { to: '/planning/capacity', label: 'Capacity Planning' },
      { to: '/planning/capex', label: 'CapEx Planning' },
      { to: '/planning/investment-portfolio', label: 'Investment Portfolio Planning' },
    ],
  },
  {
    title: 'Forecast & Strategy',
    links: [
      { to: '/forecast/rolling', label: 'Rolling Forecast' },
      { to: '/planning/long-range', label: 'Long Range Planning' },
      { to: '/planning/scenario-planning', label: 'Scenario Planning' },
      { to: '/planning/strategic-initiative', label: 'Strategic Initiative Planning' },
      { to: '/planning/strategic-driver-tree', label: 'Strategic Driver Tree' },
    ],
  },
  {
    title: 'Financial Statements',
    links: [
      { to: '/planning/cash-flow', label: 'Cash Flow Planning' },
      { to: '/planning/balance-sheet', label: 'Balance Sheet Planning' },
    ],
  },
]

const isActiveLink = (pathname: string, link: NavLinkItem) => {
  if (link.activeWhen?.(pathname)) return true

  const patterns = link.activePatterns ?? [link.to]

  return patterns.some((pattern) => Boolean(matchPath({ path: pattern, end: true }, pathname)))
}

const isActiveGroup = (pathname: string, group: NavGroup) => group.links.some((link) => isActiveLink(pathname, link))

const linkClassName = (isActive: boolean, isFeatured = false) => {
  const base = 'rounded-full px-3 py-1 font-medium transition-colors whitespace-nowrap'

  if (isFeatured) {
    return `${base} ${
      isActive
        ? 'bg-indigo-700 text-white shadow-sm'
        : 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200 hover:bg-indigo-100 focus-visible:bg-indigo-100'
    }`
  }

  return `${base} ${
    isActive
      ? 'bg-slate-900 text-white shadow-sm'
      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900 focus-visible:bg-slate-200 focus-visible:text-slate-900'
  }`
}

const groupButtonClassName = (isActive: boolean) =>
  `rounded-full px-3 py-1 font-medium transition-colors whitespace-nowrap focus:outline-none ${
    isActive
      ? 'bg-slate-900 text-white shadow-sm'
      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-950 focus:bg-slate-100 focus:text-slate-950'
  }`

export function AppShell({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth()
  const { pathname } = useLocation()

  useEffect(() => {
    const moduleId = getLearningModuleIdForPath(pathname)

    if (user && moduleId) {
      markModuleCompleted(moduleId)
    }
  }, [pathname, user])

  return (
    <div className="mx-auto min-h-screen max-w-6xl px-4 py-6">
      <header className="mb-6 rounded-xl bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-xl font-semibold">Kotoriplan Lab</h1>
          {user ? (
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <span>{user.email}</span>
              <button onClick={() => void signOut()} className="rounded-full border px-3 py-1 hover:bg-slate-100">Sign out</button>
            </div>
          ) : (
            <Link to="/auth" className="rounded-full border px-3 py-1 text-sm hover:bg-slate-100">Sign in</Link>
          )}
        </div>
        {user && (
          <nav className="relative z-40 mt-3 text-sm" aria-label="Primary navigation">
            <div className="flex flex-wrap items-center gap-1">
              <Link
                to={learningPathLink.to}
                className={linkClassName(isActiveLink(pathname, learningPathLink), true)}
                aria-current={isActiveLink(pathname, learningPathLink) ? 'page' : undefined}
              >
                {learningPathLink.label}
              </Link>
              {navGroups.map((group) => {
                const isGroupActive = isActiveGroup(pathname, group)

                return (
                  <div key={group.title} className="group relative flex items-center">
                    <span className="px-1 text-slate-300" aria-hidden="true">|</span>
                    <button
                      type="button"
                      className={groupButtonClassName(isGroupActive)}
                      aria-haspopup="true"
                    >
                      {group.title}
                    </button>
                    <div className="invisible absolute left-2 top-full z-50 w-64 pt-2 opacity-0 transition duration-150 ease-out group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                      <div className="rounded-xl border border-slate-100 bg-white p-3 shadow-lg shadow-slate-900/10 ring-1 ring-slate-900/5">
                        <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-slate-400">{group.title}</p>
                        <div className="flex flex-col gap-1">
                          {group.links.map((link) => {
                            const isActive = isActiveLink(pathname, link)

                            return (
                              <Link
                                key={link.to}
                                to={link.to}
                                className={linkClassName(isActive)}
                                aria-current={isActive ? 'page' : undefined}
                              >
                                {link.label}
                              </Link>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </nav>
        )}
      </header>
      <main>{children}</main>
    </div>
  )
}
