import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '../features/auth/AuthProvider'

const links = [
  { to: '/scenarios', label: 'Scenario List' },
  { to: '/scenarios/new', label: 'Scenario Editor' },
  { to: '/compare', label: 'Scenario Compare' },
  { to: '/tags', label: 'Scenario Labels' },
  { to: '/dimensions', label: 'Analysis Dimensions' },
  { to: '/pl', label: 'PL View' },
  { to: '/pl/by-dimension', label: 'PL by Dimension' },
  { to: '/pl/variance', label: 'PL Variance' },
  { to: '/pl/variance-drivers', label: 'Variance Drivers' },
  { to: '/pl/bridge', label: 'PL Bridge' },
  { to: '/pl/ratios', label: 'Ratio Analysis' },
  { to: '/drivers', label: 'Driver Planning' },
  { to: '/drivers/sensitivity', label: 'Sensitivity Analysis' },
  { to: '/drivers/break-even', label: 'Break-even Analysis' },
  { to: '/forecast/rolling', label: 'Rolling Forecast' },
  { to: '/planning/headcount', label: 'Headcount Planning' },
  { to: '/planning/capacity', label: 'Capacity Planning' },
  { to: '/learning-path', label: 'Learning Path' },
]

export function AppShell({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth()

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
          <nav className="mt-3 flex flex-wrap gap-2 text-sm">
            {links.map((link) => (
              <Link key={link.to} to={link.to} className="rounded-full bg-slate-100 px-3 py-1 hover:bg-slate-200">
                {link.label}
              </Link>
            ))}
          </nav>
        )}
      </header>
      <main>{children}</main>
    </div>
  )
}
