import { useEffect, useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { isConfigured, supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/auth'
import { Logo } from '../../components/Layout'

export default function Login() {
  const { session, isAdmin, loading } = useAuth()
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => { if (!loading && session && isAdmin) nav('/admin', { replace: true }) }, [loading, session, isAdmin, nav])
  if (!loading && session && isAdmin) return <Navigate to="/admin" replace />

  async function submit(e: FormEvent) {
    e.preventDefault(); setError(''); setBusy(true)
    const { data, error: err } = await supabase.auth.signInWithPassword({ email, password })
    if (err || !data.user) { setError('Incorrect email or password.'); setBusy(false); return }
    const { data: adm } = await supabase.from('admins').select('user_id').eq('user_id', data.user.id).maybeSingle()
    if (!adm) { await supabase.auth.signOut(); setError('This account does not have admin access.'); setBusy(false); return }
    nav('/admin', { replace: true })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-navy-900 p-5">
      <div className="w-full max-w-sm rounded-lg bg-white p-8 shadow-2xl">
        <Logo />
        <h1 className="mt-6 text-3xl font-bold">Admin sign in</h1>
        {!isConfigured && <p className="mt-3 rounded bg-amber-50 p-3 text-xs text-amber-800">Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.</p>}
        <form onSubmit={submit} className="mt-6 space-y-4">
          <div><label className="label" htmlFor="email">Email</label><input id="email" type="email" required className="input" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" /></div>
          <div><label className="label" htmlFor="pw">Password</label><input id="pw" type="password" required className="input" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" /></div>
          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
          <button className="btn-navy w-full" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
        </form>
      </div>
    </div>
  )
}
