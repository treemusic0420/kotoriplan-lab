import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'

const links = [
  { to: '/scenarios', label: 'Scenario List' },
  { to: '/scenarios/new', label: 'Scenario Editor' },
  { to: '/compare', label: 'Scenario Compare' },
  { to: '/tags', label: 'Tag Management' },
]

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto min-h-screen max-w-6xl px-4 py-6">
      <header className="mb-6 rounded-xl bg-white p-4 shadow-sm">
        <h1 className="text-xl font-semibold">Kotoriplan Lab</h1>
        <nav className="mt-3 flex flex-wrap gap-2 text-sm">
          {links.map((link) => (
            <Link key={link.to} to={link.to} className="rounded-full bg-slate-100 px-3 py-1 hover:bg-slate-200">
              {link.label}
            </Link>
          ))}
        </nav>
      </header>
      <main>{children}</main>
    </div>
  )
}
