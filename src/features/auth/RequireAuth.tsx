import type { ReactElement } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthProvider'

export function RequireAuth({ children }: { children: ReactElement }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <p className="rounded-xl bg-white p-6 text-sm text-slate-600 shadow-sm">Checking session...</p>
  if (!user) return <Navigate to="/auth" replace state={{ from: location }} />

  return children
}
