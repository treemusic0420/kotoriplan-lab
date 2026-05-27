import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthProvider'

export function AuthPage() {
  const { user, signIn, signUp } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (user) {
    return <Navigate to="/scenarios" replace />
  }

  const execute = async (action: 'signIn' | 'signUp') => {
    setLoading(true)
    setError(null)
    setMessage(null)
    try {
      if (action === 'signIn') {
        await signIn(email, password)
      } else {
        await signUp(email, password)
        setMessage('Sign up succeeded. If email confirmation is enabled, please verify your email.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="mx-auto max-w-md rounded-2xl bg-white p-8 shadow-sm">
      <h2 className="text-2xl font-semibold tracking-tight">Welcome back</h2>
      <p className="mt-2 text-sm text-slate-600">Sign in to manage your own scenarios securely.</p>

      <div className="mt-6 grid gap-3">
        <label className="grid gap-1 text-sm">
          <span>Email</span>
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="rounded-xl border px-3 py-2" />
        </label>
        <label className="grid gap-1 text-sm">
          <span>Password</span>
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" className="rounded-xl border px-3 py-2" />
        </label>
      </div>

      {error && <p className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
      {message && <p className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p>}

      <div className="mt-6 grid gap-2">
        <button disabled={loading} onClick={() => void execute('signIn')} className="rounded-xl bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-60">
          {loading ? 'Processing...' : 'Sign in'}
        </button>
        <button disabled={loading} onClick={() => void execute('signUp')} className="rounded-xl border px-4 py-2 text-sm text-slate-700 disabled:opacity-60">
          Sign up
        </button>
      </div>
    </section>
  )
}
