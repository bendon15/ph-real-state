import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Property } from '../lib/types'
import { FALLBACK_IMG, php, priceLabel, typeLabel } from '../lib/utils'
import InquiryForm from '../components/InquiryForm'

export default function PropertyDetail() {
  const { slug } = useParams()
  const [p, setP] = useState<Property | null>(null)
  const [state, setState] = useState<'loading' | 'ok' | 'missing'>('loading')
  const [idx, setIdx] = useState(0)
  const [lightbox, setLightbox] = useState(false)

  useEffect(() => {
    setState('loading'); setIdx(0)
    supabase.from('properties').select('*').eq('slug', slug ?? '').eq('published', true).maybeSingle()
      .then(({ data }) => { if (data) { setP(data as Property); setState('ok'); document.title = `${(data as Property).title} | PH Real Estate` } else setState('missing') })
    return () => { document.title = 'PH Real Estate' }
  }, [slug])

  useEffect(() => {
    if (!lightbox || !p) return
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightbox(false)
      if (e.key === 'ArrowRight') setIdx((i) => (i + 1) % p.images.length)
      if (e.key === 'ArrowLeft') setIdx((i) => (i - 1 + p.images.length) % p.images.length)
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [lightbox, p])

  if (state === 'loading') return <p className="wrap py-20 text-slate-500">Loading property…</p>
  if (state === 'missing' || !p)
    return <div className="wrap py-24 text-center"><h1 className="text-4xl">Property not found</h1><p className="mt-2 text-slate-500">It may have been sold or removed.</p><Link to="/properties" className="btn-navy mt-6">Browse properties</Link></div>

  const imgs = p.images.length ? p.images : [FALLBACK_IMG]
  const facts: [string, string][] = [
    ['Type', typeLabel(p.property_type)],
    ...(p.property_type !== 'lot' ? [['Bedrooms', String(p.bedrooms)], ['Bathrooms', String(p.bathrooms)], ['Parking', String(p.parking)]] as [string, string][] : []),
    ...(p.floor_area ? [['Floor area', `${p.floor_area} sqm`]] as [string, string][] : []),
    ...(p.lot_area ? [['Lot area', `${p.lot_area} sqm`]] as [string, string][] : []),
    ['Status', p.status.charAt(0).toUpperCase() + p.status.slice(1)],
  ]

  return (
    <div className="wrap py-10">
      <Link to="/properties" className="text-sm text-gold-dark hover:underline">Back to properties</Link>
      <div className="mt-4 grid gap-10 lg:grid-cols-[1fr_380px]">
        <div>
          <button className="block w-full overflow-hidden rounded-lg bg-navy-800" onClick={() => setLightbox(true)} aria-label="Enlarge photo">
            <img src={imgs[idx]} alt={`${p.title}, photo ${idx + 1}`} className="aspect-[16/10] w-full object-cover" onError={(e) => { e.currentTarget.src = FALLBACK_IMG }} />
          </button>
          {imgs.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {imgs.map((src, i) => (
                <button key={src + i} onClick={() => setIdx(i)} aria-label={`Show photo ${i + 1}`} className={`h-20 w-28 shrink-0 overflow-hidden rounded border-2 ${i === idx ? 'border-gold' : 'border-transparent opacity-70 hover:opacity-100'}`}>
                  <img src={src} alt="" loading="lazy" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}

          <h1 className="mt-8 text-4xl font-bold sm:text-5xl">{p.title}</h1>
          <p className="mt-2 text-slate-500">{[p.address, p.city, p.province].filter(Boolean).join(', ')}</p>
          <p className="mt-4 font-display text-4xl font-bold text-gold-dark">{priceLabel(p)}</p>

          <dl className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-slate-200 bg-slate-200 sm:grid-cols-3">
            {facts.map(([k, v]) => <div key={k} className="bg-white p-4"><dt className="text-xs text-slate-500">{k}</dt><dd className="mt-1 font-semibold text-navy-800">{v}</dd></div>)}
          </dl>

          <h2 className="mt-10 text-3xl font-bold">About this property</h2>
          <p className="mt-3 whitespace-pre-line leading-relaxed text-slate-600">{p.description || 'Contact us for full details on this property.'}</p>

          {p.amenities.length > 0 && (<>
            <h2 className="mt-10 text-3xl font-bold">Amenities</h2>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {p.amenities.map((a) => <li key={a} className="flex items-center gap-2 text-slate-600"><span className="h-1.5 w-1.5 rounded-full bg-gold" />{a}</li>)}
            </ul>
          </>)}
          {p.listing_type === 'sale' && <p className="mt-10 text-xs text-slate-400">Indicative price {php(p.price)}. Taxes, transfer fees and other charges are not included.</p>}
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold">Ask about this property</h2>
            <p className="mb-5 mt-1 text-sm text-slate-500">We reply within one business day.</p>
            <InquiryForm type="property" propertyId={p.id} propertyTitle={p.title} compact />
          </div>
        </aside>
      </div>

      {lightbox && (
        <div role="dialog" aria-modal="true" aria-label="Photo viewer" className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" onClick={() => setLightbox(false)}>
          <button className="absolute right-4 top-4 rounded bg-white/10 px-3 py-2 text-white" onClick={() => setLightbox(false)}>Close</button>
          {imgs.length > 1 && <>
            <button className="absolute left-4 rounded bg-white/10 px-3 py-2 text-white" onClick={(e) => { e.stopPropagation(); setIdx((idx - 1 + imgs.length) % imgs.length) }}>Prev</button>
            <button className="absolute right-4 mt-24 rounded bg-white/10 px-3 py-2 text-white sm:mt-0" onClick={(e) => { e.stopPropagation(); setIdx((idx + 1) % imgs.length) }}>Next</button>
          </>}
          <img src={imgs[idx]} alt="" className="max-h-full max-w-full object-contain" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  )
}
