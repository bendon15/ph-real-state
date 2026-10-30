import { Link } from 'react-router-dom'
import type { Property } from '../lib/types'
import { FALLBACK_IMG, priceLabel, typeLabel } from '../lib/utils'

export default function PropertyCard({ p }: { p: Property }) {
  const unavailable = p.status !== 'available'
  return (
    <Link to={`/properties/${p.slug}`} className="group block overflow-hidden rounded-lg border border-slate-200 bg-white transition-shadow hover:shadow-xl">
      <div className="relative aspect-[4/3] overflow-hidden bg-navy-800">
        <img src={p.images[0] || FALLBACK_IMG} alt={p.title} loading="lazy"
          onError={(e) => { e.currentTarget.src = FALLBACK_IMG }}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        <span className="absolute left-3 top-3 rounded bg-navy-800/90 px-2.5 py-1 text-xs font-semibold text-white">
          {p.listing_type === 'sale' ? 'For sale' : 'For rent'}
        </span>
        {unavailable && <span className="absolute right-3 top-3 rounded bg-gold px-2.5 py-1 text-xs font-semibold capitalize text-white">{p.status}</span>}
      </div>
      <div className="p-5">
        <p className="font-display text-2xl font-bold text-gold-dark">{priceLabel(p)}</p>
        <h3 className="mt-1 line-clamp-1 font-sans text-base font-semibold text-navy-800">{p.title}</h3>
        <p className="mt-1 text-sm text-slate-500">{[p.city, p.province].filter(Boolean).join(', ')} · {typeLabel(p.property_type)}</p>
        <dl className="mt-4 flex gap-5 border-t border-slate-100 pt-4 text-sm">
          {p.property_type !== 'lot' && (<>
            <div><dt className="sr-only">Bedrooms</dt><dd><b className="text-navy-800">{p.bedrooms}</b> bed</dd></div>
            <div><dt className="sr-only">Bathrooms</dt><dd><b className="text-navy-800">{p.bathrooms}</b> bath</dd></div>
          </>)}
          <div><dt className="sr-only">Area</dt><dd><b className="text-navy-800">{p.floor_area || p.lot_area}</b> sqm</dd></div>
        </dl>
      </div>
    </Link>
  )
}
