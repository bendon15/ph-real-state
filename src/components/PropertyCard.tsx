import { Link } from 'react-router-dom'
import type { Property } from '../lib/types'
import { FALLBACK_IMG, priceLabel, typeLabel } from '../lib/utils'

const I = ({ d }: { d: string }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>
)

export default function PropertyCard({ p, feature = false }: { p: Property; feature?: boolean }) {
  const place = [p.city, p.province].filter(Boolean).join(', ')
  const img = (
    <img src={p.images[0] || FALLBACK_IMG} alt={p.title} loading="lazy" onError={(e) => { e.currentTarget.src = FALLBACK_IMG }}
      className={`object-cover transition-transform duration-700 group-hover:scale-[1.04] ${feature ? 'absolute inset-0 h-full w-full' : 'h-full w-full'}`} />
  )
  const badge = (
    <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-navy-800">
      {p.status !== 'available' ? p.status.charAt(0).toUpperCase() + p.status.slice(1) : p.listing_type === 'sale' ? 'For sale' : 'For rent'}
    </span>
  )

  if (feature)
    return (
      <Link to={`/properties/${p.slug}`} className="group relative block h-full min-h-[420px] overflow-hidden rounded-3xl bg-navy-800">
        {img}{badge}
        <div className="absolute inset-0 bg-gradient-to-t from-navy-950/90 via-navy-950/20 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-6 text-white sm:p-8">
          <p className="font-display text-4xl font-semibold">{priceLabel(p)}</p>
          <h3 className="mt-1 font-sans text-lg font-semibold text-white">{p.title}</h3>
          <p className="text-sm text-white/75">{place} · {p.bedrooms} bed · {p.bathrooms} bath · {p.floor_area || p.lot_area} sqm</p>
        </div>
      </Link>
    )

  return (
    <Link to={`/properties/${p.slug}`} className="group block">
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-navy-800">{img}{badge}</div>
      <div className="pt-4">
        <div className="flex items-baseline justify-between gap-3">
          <p className="font-display text-2xl font-semibold text-navy-800">{priceLabel(p)}</p>
          <span className="text-xs text-slate-400">{typeLabel(p.property_type)}</span>
        </div>
        <h3 className="mt-1 line-clamp-1 font-sans text-[15px] font-semibold text-navy-800 group-hover:text-gold-dark">{p.title}</h3>
        <p className="text-sm text-slate-500">{place}</p>
        <p className="mt-3 flex gap-5 text-sm text-slate-600">
          {p.property_type !== 'lot' && (<>
            <span className="inline-flex items-center gap-1.5 text-gold-dark"><I d="M3 18v-7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v7M3 15h18M7 9V6h10v3" /><span className="text-slate-600">{p.bedrooms}</span></span>
            <span className="inline-flex items-center gap-1.5 text-gold-dark"><I d="M4 12h16v3a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4v-3zM7 12V6a2 2 0 0 1 4 0" /><span className="text-slate-600">{p.bathrooms}</span></span>
          </>)}
          <span className="inline-flex items-center gap-1.5 text-gold-dark"><I d="M4 4h16v16H4zM4 12h8v8" /><span className="text-slate-600">{p.floor_area || p.lot_area} sqm</span></span>
        </p>
      </div>
    </Link>
  )
}
