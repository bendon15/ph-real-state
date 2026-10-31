import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { PROPERTY_TYPES, type Property } from '../lib/types'
import { FALLBACK_IMG, priceLabel } from '../lib/utils'
import PropertyCard from '../components/PropertyCard'

const CITIES = ['Makati', 'Taguig', 'Quezon City', 'Cebu City', 'Davao City', 'Tagaytay']
const HERO = 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80'

export default function Home() {
  const nav = useNavigate()
  const [featured, setFeatured] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState({ city: '', type: '', listing: 'sale' })

  useEffect(() => {
    supabase.from('properties').select('*').eq('published', true).eq('featured', true).order('created_at', { ascending: false }).limit(5)
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
  const lead = featured[0]

  return (
    <>
      <section className="wrap grid items-center gap-12 pb-24 pt-12 lg:grid-cols-[1.15fr_1fr] lg:pt-16">
        <div>
          <h1 className="text-5xl font-semibold leading-[1.04] sm:text-6xl lg:text-[4.5rem]">Find the home that fits your life in the Philippines.</h1>
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-slate-600">Verified houses, condos and lots in Metro Manila, Cebu, Davao and Tagaytay, with licensed agents who handle the paperwork.</p>
          <div className="mt-9 flex flex-wrap items-center gap-5">
            <Link to="/properties" className="btn-navy">Browse properties</Link>
            <Link to="/contact" className="text-sm font-semibold text-navy-800 underline decoration-gold decoration-2 underline-offset-8 hover:text-gold-dark">Talk to an agent</Link>
          </div>
        </div>
        <div className="relative mx-auto w-full max-w-md lg:max-w-none">
          <div className="absolute inset-0 translate-x-4 translate-y-4 rounded-b-3xl rounded-t-full border border-gold" aria-hidden="true" />
          <div className="relative aspect-[4/5] overflow-hidden rounded-b-3xl rounded-t-full bg-navy-800">
            <img src={lead?.images[0] || HERO} alt={lead ? lead.title : 'Modern Philippine home'} className="h-full w-full object-cover" onError={(e) => { e.currentTarget.src = FALLBACK_IMG }} />
          </div>
          {lead && (
            <Link to={`/properties/${lead.slug}`} className="absolute -left-2 bottom-8 max-w-[15rem] rounded-2xl bg-white p-4 shadow-2xl sm:-left-8">
              <p className="font-display text-2xl font-semibold text-navy-800">{priceLabel(lead)}</p>
              <p className="mt-0.5 line-clamp-1 text-sm text-slate-600">{lead.title}</p>
              <p className="text-xs text-slate-400">{lead.city}</p>
            </Link>
          )}
        </div>
      </section>

      <form onSubmit={search} className="wrap relative z-10 -mt-10">
        <div className="grid gap-2 rounded-3xl bg-white p-3 shadow-[0_20px_60px_-15px_rgba(11,31,58,0.25)] ring-1 ring-navy-100 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_0.7fr_auto] lg:rounded-full lg:pl-6">
          <input className="!border-0 !ring-0 input bg-transparent" placeholder="City or keyword, e.g. Makati" aria-label="City or keyword" value={q.city} onChange={(e) => setQ({ ...q, city: e.target.value })} />
          <select className="!border-0 !ring-0 input bg-transparent" aria-label="Property type" value={q.type} onChange={(e) => setQ({ ...q, type: e.target.value })}>
            <option value="">All property types</option>{PROPERTY_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <select className="!border-0 !ring-0 input bg-transparent" aria-label="Buy or rent" value={q.listing} onChange={(e) => setQ({ ...q, listing: e.target.value })}>
            <option value="sale">Buy</option><option value="rent">Rent</option>
          </select>
          <button className="btn-gold">Search</button>
        </div>
      </form>

      <section className="wrap py-24">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div><h2 className="text-4xl font-semibold sm:text-5xl">Featured properties</h2><p className="mt-2 text-slate-500">Hand-picked by our agents this month.</p></div>
          <Link to="/properties" className="btn-outline">View all listings</Link>
        </div>
        {loading ? <p className="mt-10 text-slate-500">Loading properties…</p> : featured.length === 0 ? (
          <p className="mt-10 rounded-3xl border border-dashed border-slate-300 p-12 text-center text-slate-500">No featured listings yet. Browse all properties instead.</p>
        ) : (
          <div className="mt-10 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            <div className="sm:col-span-2 lg:row-span-2"><PropertyCard p={featured[0]} feature /></div>
            {featured.slice(1).map((p) => <PropertyCard key={p.id} p={p} />)}
          </div>
        )}
      </section>

      <section className="wrap pb-24">
        <h2 className="text-4xl font-semibold sm:text-5xl">Browse by city</h2>
        <div className="mt-8 flex flex-wrap gap-x-10 gap-y-2">
          {CITIES.map((c) => <Link key={c} to={`/properties?q=${encodeURIComponent(c)}`} className="font-display text-4xl text-navy-800/30 transition-colors hover:text-gold-dark sm:text-6xl">{c}</Link>)}
        </div>
      </section>

      <section className="wrap grid gap-10 pb-24 md:grid-cols-3">
        {[['Verified listings', 'Every property is checked for title status and accurate details before it goes live.'],
          ['Local expertise', 'Our agents know the barangays, developers and price trends in each city they cover.'],
          ['Paperwork handled', 'From reservation to transfer of title, we guide you through each step so nothing is missed.']].map(([t, d]) => (
          <div key={t} className="border-t-2 border-gold pt-5"><h3 className="text-2xl font-semibold">{t}</h3><p className="mt-2 leading-relaxed text-slate-600">{d}</p></div>
        ))}
      </section>

      <section className="wrap pb-24">
        <div className="rounded-3xl bg-navy-800 px-8 py-16 text-center">
          <h2 className="text-4xl font-semibold text-white">Selling or renting out a property?</h2>
          <p className="mx-auto mt-3 max-w-xl text-slate-300">List with us and reach serious buyers and tenants across the country.</p>
          <Link to="/contact" className="btn-gold mt-8">Contact our team</Link>
        </div>
      </section>
    </>
  )
}
