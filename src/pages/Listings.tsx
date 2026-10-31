import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { PROPERTY_TYPES, type Property } from '../lib/types'
import PropertyCard from '../components/PropertyCard'

const PAGE = 9

export default function Listings() {
  const [sp, setSp] = useSearchParams()
  const [items, setItems] = useState<Property[]>([])
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const g = (k: string) => sp.get(k) ?? ''
  const page = Math.max(1, Number(g('page')) || 1)

  useEffect(() => {
    setLoading(true)
    let q = supabase.from('properties').select('*', { count: 'exact' }).eq('published', true)
    const s = g('q').replace(/[%,()]/g, ' ').trim()
    if (s) q = q.or(`title.ilike.%${s}%,city.ilike.%${s}%,province.ilike.%${s}%,address.ilike.%${s}%`)
    if (g('type')) q = q.eq('property_type', g('type'))
    if (g('listing')) q = q.eq('listing_type', g('listing'))
    if (g('min')) q = q.gte('price', Number(g('min')))
    if (g('max')) q = q.lte('price', Number(g('max')))
    if (g('beds')) q = q.gte('bedrooms', Number(g('beds')))
    const sort = g('sort')
    q = sort === 'price_asc' ? q.order('price', { ascending: true }) : sort === 'price_desc' ? q.order('price', { ascending: false }) : q.order('created_at', { ascending: false })
    q.range((page - 1) * PAGE, page * PAGE - 1).then(({ data, count: c, error: e }) => {
      if (e) setError('Could not load properties. Please try again.'); else setError('')
      setItems((data as Property[]) ?? []); setCount(c ?? 0); setLoading(false)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sp])

  const set = (k: string, v: string) => {
    const n = new URLSearchParams(sp)
    if (v) n.set(k, v); else n.delete(k)
    if (k !== 'page') n.delete('page')
    setSp(n)
  }
  const pages = Math.ceil(count / PAGE)

  return (
    <div className="wrap py-12">
      <h1 className="text-5xl font-semibold">Properties</h1>
      <p className="mt-2 text-slate-500">{loading ? 'Searching…' : `${count} ${count === 1 ? 'property' : 'properties'} found`}</p>

      <div className="mt-8 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
        <input className="input lg:col-span-2" placeholder="Search by city, area or title" aria-label="Search" defaultValue={g('q')} key={g('q')} onKeyDown={(e) => e.key === 'Enter' && set('q', e.currentTarget.value)} onBlur={(e) => e.currentTarget.value !== g('q') && set('q', e.currentTarget.value)} />
        <select className="input" aria-label="Buy or rent" value={g('listing')} onChange={(e) => set('listing', e.target.value)}>
          <option value="">Buy or rent</option><option value="sale">For sale</option><option value="rent">For rent</option>
        </select>
        <select className="input" aria-label="Property type" value={g('type')} onChange={(e) => set('type', e.target.value)}>
          <option value="">All types</option>{PROPERTY_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <input className="input" type="number" min={0} placeholder="Min price (PHP)" aria-label="Minimum price" defaultValue={g('min')} onBlur={(e) => set('min', e.target.value)} />
        <input className="input" type="number" min={0} placeholder="Max price (PHP)" aria-label="Maximum price" defaultValue={g('max')} onBlur={(e) => set('max', e.target.value)} />
        <select className="input" aria-label="Minimum bedrooms" value={g('beds')} onChange={(e) => set('beds', e.target.value)}>
          <option value="">Any bedrooms</option>{[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}+ bedrooms</option>)}
        </select>
        <div className="flex gap-3">
          <select className="input" aria-label="Sort" value={g('sort')} onChange={(e) => set('sort', e.target.value)}>
            <option value="">Newest</option><option value="price_asc">Price: low to high</option><option value="price_desc">Price: high to low</option>
          </select>
          <button className="btn-outline whitespace-nowrap" onClick={() => setSp(new URLSearchParams())}>Clear</button>
        </div>
      </div>

      {error && <p role="alert" className="mt-8 rounded bg-red-50 p-4 text-red-700">{error}</p>}
      {!loading && !error && items.length === 0 && (
        <div className="mt-10 rounded-2xl border border-dashed border-slate-300 p-12 text-center">
          <p className="font-display text-2xl text-navy-800">No properties match your search</p>
          <p className="mt-1 text-slate-500">Try a different city or widen your price range.</p>
        </div>
      )}
      <div className="mt-8 grid gap-7 sm:grid-cols-2 lg:grid-cols-3">{items.map((p) => <PropertyCard key={p.id} p={p} />)}</div>

      {pages > 1 && (
        <nav className="mt-12 flex items-center justify-center gap-2" aria-label="Pagination">
          <button className="btn-outline btn-sm" disabled={page <= 1} onClick={() => set('page', String(page - 1))}>Previous</button>
          <span className="px-3 text-sm text-slate-600">Page {page} of {pages}</span>
          <button className="btn-outline btn-sm" disabled={page >= pages} onClick={() => set('page', String(page + 1))}>Next</button>
        </nav>
      )}
    </div>
  )
}
