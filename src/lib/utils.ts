import type { Property } from './types'

const fmt = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 })
export const php = (n: number) => fmt.format(n)
export const priceLabel = (p: Pick<Property, 'price' | 'listing_type'>) => php(p.price) + (p.listing_type === 'rent' ? ' / month' : '')
export const typeLabel = (t: string) => ({ house: 'House', condo: 'Condominium', townhouse: 'Townhouse', lot: 'Lot', commercial: 'Commercial' } as Record<string, string>)[t] ?? t
export const slugify = (s: string) =>
  s.toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '').trim().replace(/[\s_]+/g, '-').replace(/-+/g, '-').slice(0, 70) +
  '-' + Math.random().toString(36).slice(2, 7)
export const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })
export const FALLBACK_IMG =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='800' height='600'><rect width='800' height='600' fill='%230b1f3a'/><path d='M280 330 400 230l120 100v80H280z' fill='%23b8935a' opacity='.7'/></svg>"

export const API_URL = (import.meta.env.VITE_API_URL as string | undefined) || '/api'
