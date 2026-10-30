import { useState } from 'react'
import { Link, NavLink, Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../lib/auth'

const nav = [{ to: '/admin', label: 'Dashboard', end: true }, { to: '/admin/properties', label: 'Properties' }, { to: '/admin/inquiries', label: 'Inquiries' }]

export default function AdminLayout() {
  const { session, isAdmin, loading, signOut } = useAuth()
  const [open, setOpen] = useState(false)
  if (loading) return <div className="p-10 text-center text-slate-500">Checking access…</div>
  if (!session || !isAdmin) return <Navigate to="/admin/login" replace />

  return (
    <div className="min-h-screen bg-slate-50 md:flex">
      <aside className={`${open ? 'block' : 'hidden'} bg-navy-900 p-5 text-slate-300 md:block md:w-60 md:shrink-0`}>
        <Link to="/" className="font-display text-2xl font-bold text-white">PH Real Estate</Link>
        <p className="mb-6 mt-1 text-xs text-gold-light">Admin dashboard</p>
        <nav className="space-y-1" aria-label="Admin">
          {nav.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} onClick={() => setOpen(false)}
              className={({ isActive }) => `block rounded px-3 py-2 text-sm font-medium ${isActive ? 'bg-gold text-white' : 'hover:bg-white/10'}`}>{n.label}</NavLink>
          ))}
        </nav>
        <div className="mt-8 border-t border-white/10 pt-4 text-xs">
          <p className="truncate text-slate-400">{session.user.email}</p>
          <button className="mt-2 text-gold-light hover:underline" onClick={signOut}>Sign out</button>
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between bg-white px-5 py-3 shadow-sm md:hidden">
          <span className="font-display text-xl font-bold text-navy-800">Admin</span>
          <button className="btn-outline btn-sm" onClick={() => setOpen(!open)}>{open ? 'Close' : 'Menu'}</button>
        </div>
        <div className="p-5 sm:p-8"><Outlet /></div>
      </div>
    </div>
  )
}
