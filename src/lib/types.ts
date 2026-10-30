export type PropertyType = 'house' | 'condo' | 'townhouse' | 'lot' | 'commercial'
export type ListingType = 'sale' | 'rent'
export type PropertyStatus = 'available' | 'reserved' | 'sold' | 'rented'

export interface Property {
  id: string
  slug: string
  title: string
  description: string
  price: number
  property_type: PropertyType
  listing_type: ListingType
  status: PropertyStatus
  address: string
  city: string
  province: string
  bedrooms: number
  bathrooms: number
  parking: number
  floor_area: number
  lot_area: number
  amenities: string[]
  images: string[]
  featured: boolean
  published: boolean
  created_at: string
}

export interface Inquiry {
  id: string
  type: 'contact' | 'property'
  property_id: string | null
  name: string
  email: string
  phone: string
  message: string
  status: 'new' | 'read' | 'replied' | 'archived'
  created_at: string
  properties?: { title: string; slug: string } | null
}

export const PROPERTY_TYPES: { value: PropertyType; label: string }[] = [
  { value: 'house', label: 'House' },
  { value: 'condo', label: 'Condominium' },
  { value: 'townhouse', label: 'Townhouse' },
  { value: 'lot', label: 'Lot' },
  { value: 'commercial', label: 'Commercial' },
]
