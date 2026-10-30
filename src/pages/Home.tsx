import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Property } from '../lib/types'
import { PROPERTY_TYPES } from '../lib/types'
import PropertyCard from '../components/PropertyCard'

const CITIES = ['Makati', 'Taguig', 'Quezon City', 'Cebu City', 'Davao City', 'Tagaytay']

export default function Home() {
  const nav = useNavigate()
  const [featured, setFeatured] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState({ city: '', type: '', listing: 'sale' })

  useEffect(() => {
    supabase.from('properties').select('*').eq('published', true).eq('featured', true).order('created_at', { ascending: false }).limit(6)
      .then(({ data }) => { setFeatured((data as Property[]) ?? []); setLoading(false) })
  }, [])

  const search = (e: FormEvent) => {
    e.preventDefault()
    const p = new URLSearchParams()
    if (q.city) p.set('q', q.city)
    if (q.type) p.set('type', q.type)
    p.set('listing', q.listing)
    nav(`/properties?${p}`)
  }

  return (
    <>
      <section className="relative isolate overflow-hidden bg-navy-900">
        <img src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1800&q=80" alt="" className="absolute inset-0 -z-10 h-full w-full object-cover opacity-40" onError={(e) => { e.currentTarget.style.display = 'none' }} />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-navy-950 via-navy-900/80 to-transparent" />
        <div className="wrap py-24 sm:py-32 lg:py-40">
          <h1 className="max-w-3xl text-5xl font-bold leading-[1.05] text-white sm:text-6xl lg:text-7xl">A home worth coming home to, anywhere in the Philippines.</h1>
          <p className="mt-6 max-w-xl text-lg text-slate-300">Verified listings in Metro Manila, Cebu, Davao and Tagaytay, with agents who handle the paperwork.</p>
          <form onSubmit={search} className="mt-10 grid max-w-4xl gap-3 rounded-lg bg-white p-3 shadow-2xl sm:grid-cols-[1fr_1fr_auto_auto]">
            <input className="input" placeholder="City or keyword (e.g. Makati)" aria-label="City or keyword" value={q.city} onChange={(e) => setQ({ ...q, city: e.target.value })} />
            <select className="input" aria-label="Property type" value={q.type} onChange={(e) => setQ({ ...q, type: e.target.value })}>
              <option value="">All property types</option>
              {PROPERTY_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <select className="input" aria-label="Buy or rent" value={q.listing} onChange={(e) => setQ({ ...q, listing: e.target.value })}>
              <option value="sale">Buy</option><option value="rent">Rent</option>
            </select>
            <button className="btn-gold">Search</button>
          </form>
        </div>
      </section>

      <section className="wrap py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div><h2 className="text-4xl font-bold sm:text-5xl">Featured properties</h2><p className="mt-2 text-slate-500">Hand-picked by our agents this month.</p></div>
          <Link to="/properties" className="btn-outline">View all listings</Link>
        </div>
        {loading ? <p className="mt-10 text-slate-500">Loading properties…</p> : featured.length === 0 ? (
          <p className="mt-10 rounded-lg border border-dashed border-slate-300 p-10 text-center text-slate-500">No featured listings yet. Check back soon or browse all properties.</p>
        ) : (
          <div className="mt-10 grid gap-7 sm:grid-cols-2 lg:grid-cols-3">{featured.map((p) => <PropertyCard key={p.id} p={p} />)}</div>
        )}
      </section>

      <section className="bg-navy-50 py-20">
        <div className="wrap">
          <h2 className="text-4xl font-bold">Browse by city</h2>
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {CITIES.map((c) => (
              <Link key={c} to={`/properties?q=${encodeURIComponent(c)}`} className="rounded-lg border border-navy-100 bg-white px-4 py-6 text-center font-display text-xl font-semibold text-navy-800 transition-colors hover:border-gold hover:text-gold-dark">{c}</Link>
            ))}
          </div>
        </div>
      </section>

      <section className="wrap grid gap-12 py-20 md:grid-cols-3">
        {[
          ['Verified listings', 'Every property is checked for title status and accurate details before it goes live.'],
          ['Local expertise', 'Our agents know the barangays, developers and price trends in each city they cover.'],
          ['Paperwork handled', 'From reservation to transfer of title, we guide you through each step so nothing is missed.'],
        ].map(([t, d]) => (
          <div key={t} className="border-t-2 border-gold pt-5"><h3 className="text-2xl font-bold">{t}</h3><p className="mt-2 leading-relaxed text-slate-600">{d}</p></div>
        ))}
      </section>

      <section className="bg-navy-800 py-16 text-center">
        <div className="wrap">
          <h2 className="text-4xl font-bold text-white">Selling or renting out a property?</h2>
          <p className="mx-auto mt-3 max-w-xl text-slate-300">List with us and reach serious buyers and tenants across the country.</p>
          <Link to="/contact" className="btn-gold mt-8">Contact our team</Link>
        </div>
      </section>
    </>
  )
}
