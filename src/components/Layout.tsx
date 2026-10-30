import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'

const links = [
  { to: '/', label: 'Home' },
  { to: '/properties', label: 'Properties' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
]

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2.5" aria-label="PH Real Estate home">
      <svg width="30" height="30" viewBox="0 0 100 100" aria-hidden="true">
        <rect width="100" height="100" rx="16" fill={light ? '#b8935a' : '#0b1f3a'} />
        <path d="M20 54 50 27l30 27v21H20z" fill={light ? '#0b1f3a' : '#b8935a'} />
      </svg>
      <span className={`font-display text-2xl font-bold ${light ? 'text-white' : 'text-navy-800'}`}>PH Real Estate</span>
    </Link>
  )
}

export default function Layout() {
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()
  useEffect(() => { setOpen(false); window.scrollTo(0, 0) }, [pathname])

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="wrap flex h-16 items-center justify-between">
          <Logo />
          <nav className="hidden items-center gap-8 md:flex" aria-label="Main">
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} end={l.to === '/'}
                className={({ isActive }) => `text-sm font-medium transition-colors hover:text-gold-dark ${isActive ? 'text-gold-dark' : 'text-navy-800'}`}>
                {l.label}
              </NavLink>
            ))}
            <Link to="/contact" className="btn-navy btn-sm">Talk to an agent</Link>
          </nav>
          <button className="rounded p-2 md:hidden" onClick={() => setOpen(!open)} aria-expanded={open} aria-label="Toggle menu">
            <svg width="24" height="24" fill="none" stroke="#0b1f3a" strokeWidth="2"><path d={open ? 'M5 5l14 14M19 5 5 19' : 'M3 7h18M3 12h18M3 17h18'} /></svg>
          </button>
        </div>
        {open && (
          <nav className="border-t border-slate-200 bg-white px-5 pb-4 md:hidden" aria-label="Mobile">
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} end={l.to === '/'} className="block border-b border-slate-100 py-3 text-navy-800">{l.label}</NavLink>
            ))}
          </nav>
        )}
      </header>
      <main className="flex-1"><Outlet /></main>
      <footer className="bg-navy-900 text-slate-300">
        <div className="wrap grid gap-10 py-14 md:grid-cols-3">
          <div>
            <Logo light />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-400">Homes, condominiums and lots across the Philippines, with licensed guidance from first viewing to turnover.</p>
          </div>
          <div>
            <h3 className="font-sans text-sm font-semibold text-gold-light">Explore</h3>
            <ul className="mt-4 space-y-2 text-sm">
              {links.map((l) => <li key={l.to}><Link className="hover:text-white" to={l.to}>{l.label}</Link></li>)}
            </ul>
          </div>
          <div>
            <h3 className="font-sans text-sm font-semibold text-gold-light">Contact</h3>
            <p className="mt-4 text-sm leading-relaxed text-slate-400">Bonifacio Global City, Taguig<br />Metro Manila, Philippines<br />Mon to Sat, 9:00 AM to 6:00 PM</p>
          </div>
        </div>
        <div className="border-t border-white/10 py-5 text-center text-xs text-slate-500">© {new Date().getFullYear()} PH Real Estate. All rights reserved.</div>
      </footer>
    </div>
  )
}
