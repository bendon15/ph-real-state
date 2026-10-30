import { useEffect, useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { PROPERTY_TYPES, type Property } from '../../lib/types'
import { slugify } from '../../lib/utils'
import { imagePath } from './Properties'

type Form = Omit<Property, 'id' | 'slug' | 'created_at'>
const empty: Form = { title: '', description: '', price: 0, property_type: 'house', listing_type: 'sale', status: 'available', address: '', city: '', province: '', bedrooms: 0, bathrooms: 0, parking: 0, floor_area: 0, lot_area: 0, amenities: [], images: [], featured: false, published: false }

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <div><label className="label">{label}</label>{children}</div>
}

export default function PropertyForm() {
  const { id } = useParams()
  const nav = useNavigate()
  const [f, setF] = useState<Form>(empty)
  const [amen, setAmen] = useState('')
  const [loading, setLoading] = useState(!!id)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => {
    if (!id) return
    supabase.from('properties').select('*').eq('id', id).maybeSingle().then(({ data }) => {
      if (data) { const { id: _i, slug: _s, created_at: _c, ...rest } = data as Property; setF(rest); setAmen(rest.amenities.join(', ')) } else setErr('Property not found.')
      setLoading(false)
    })
  }, [id])

  const txt = (k: keyof Form) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value })
  const num = (k: keyof Form) => (e: ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: Math.max(0, Number(e.target.value) || 0) })

  async function upload(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''
    if (!files.length) return
    setUploading(true); setErr('')
    const urls: string[] = []
    for (const file of files) {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { setErr(`${file.name}: use JPG, PNG or WebP.`); continue }
      if (file.size > 5 * 1024 * 1024) { setErr(`${file.name} is larger than 5 MB.`); continue }
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const path = `${crypto.randomUUID()}.${ext}`
      const { error } = await supabase.storage.from('property-images').upload(path, file, { contentType: file.type, cacheControl: '31536000' })
      if (error) { setErr(`Upload failed: ${error.message}`); continue }
      urls.push(supabase.storage.from('property-images').getPublicUrl(path).data.publicUrl)
    }
    setF((cur) => ({ ...cur, images: [...cur.images, ...urls] }))
    setUploading(false)
  }
  const move = (i: number, d: number) => { const a = [...f.images]; const j = i + d; if (j < 0 || j >= a.length) return; [a[i], a[j]] = [a[j], a[i]]; setF({ ...f, images: a }) }
  async function removeImg(i: number) {
    const url = f.images[i]
    setF({ ...f, images: f.images.filter((_, k) => k !== i) })
    const p = imagePath(url); if (p) await supabase.storage.from('property-images').remove([p])
  }

  async function save(e: FormEvent, publish?: boolean) {
    e.preventDefault(); setErr('')
    if (f.title.trim().length < 3) return setErr('Enter a title (at least 3 characters).')
    if (!f.city.trim()) return setErr('Enter the city.')
    if (f.price <= 0) return setErr('Enter a price greater than zero.')
    setSaving(true)
    const payload = { ...f, title: f.title.trim(), city: f.city.trim(), amenities: amen.split(',').map((s) => s.trim()).filter(Boolean), published: publish ?? f.published }
    const { error } = id ? await supabase.from('properties').update(payload).eq('id', id) : await supabase.from('properties').insert({ ...payload, slug: slugify(f.title) })
    setSaving(false)
    if (error) return setErr(error.message)
    nav('/admin/properties')
  }

  if (loading) return <p className="text-slate-500">Loading…</p>

  return (
    <form onSubmit={(e) => save(e)} className="max-w-4xl space-y-8">
      <div className="flex items-center justify-between"><h1 className="text-4xl font-bold">{id ? 'Edit property' : 'Add property'}</h1><Link to="/admin/properties" className="text-sm text-gold-dark hover:underline">Cancel</Link></div>

      <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-2xl font-bold">Basics</h2>
        <Field label="Title"><input className="input" value={f.title} onChange={txt('title')} maxLength={200} required /></Field>
        <Field label="Description"><textarea className="input" rows={6} value={f.description} onChange={txt('description')} /></Field>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Price (PHP)"><input type="number" min={0} className="input" value={f.price || ''} onChange={num('price')} /></Field>
          <Field label="Listing"><select className="input" value={f.listing_type} onChange={txt('listing_type')}><option value="sale">For sale</option><option value="rent">For rent (monthly)</option></select></Field>
          <Field label="Property type"><select className="input" value={f.property_type} onChange={txt('property_type')}>{PROPERTY_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}</select></Field>
        </div>
        <Field label="Availability"><select className="input sm:max-w-xs" value={f.status} onChange={txt('status')}><option value="available">Available</option><option value="reserved">Reserved</option><option value="sold">Sold</option><option value="rented">Rented</option></select></Field>
      </section>

      <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-2xl font-bold">Location</h2>
        <Field label="Street address or subdivision"><input className="input" value={f.address} onChange={txt('address')} /></Field>
        <div className="grid gap-4 sm:grid-cols-2"><Field label="City"><input className="input" value={f.city} onChange={txt('city')} required /></Field><Field label="Province or region"><input className="input" value={f.province} onChange={txt('province')} /></Field></div>
      </section>

      <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-2xl font-bold">Details</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          <Field label="Bedrooms"><input type="number" min={0} className="input" value={f.bedrooms} onChange={num('bedrooms')} /></Field>
          <Field label="Bathrooms"><input type="number" min={0} className="input" value={f.bathrooms} onChange={num('bathrooms')} /></Field>
          <Field label="Parking"><input type="number" min={0} className="input" value={f.parking} onChange={num('parking')} /></Field>
          <Field label="Floor area (sqm)"><input type="number" min={0} className="input" value={f.floor_area} onChange={num('floor_area')} /></Field>
          <Field label="Lot area (sqm)"><input type="number" min={0} className="input" value={f.lot_area} onChange={num('lot_area')} /></Field>
        </div>
        <Field label="Amenities (separate with commas)"><input className="input" value={amen} onChange={(e) => setAmen(e.target.value)} placeholder="Swimming pool, Gym, 24/7 security" /></Field>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-2xl font-bold">Photos</h2>
        <p className="mt-1 text-sm text-slate-500">The first photo is the cover. JPG, PNG or WebP, up to 5 MB each.</p>
        <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={upload} disabled={uploading} className="mt-4 text-sm" aria-label="Upload photos" />
        {uploading && <p className="mt-2 text-sm text-slate-500">Uploading…</p>}
        <ul className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {f.images.map((src, i) => (
            <li key={src} className="overflow-hidden rounded border border-slate-200">
              <div className="relative"><img src={src} alt={`Photo ${i + 1}`} className="aspect-[4/3] w-full object-cover" />{i === 0 && <span className="absolute left-2 top-2 rounded bg-gold px-2 py-0.5 text-xs font-semibold text-white">Cover</span>}</div>
              <div className="flex justify-between gap-1 p-2">
                <button type="button" className="btn-outline btn-sm" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move earlier">Earlier</button>
                <button type="button" className="btn-outline btn-sm" onClick={() => move(i, 1)} disabled={i === f.images.length - 1} aria-label="Move later">Later</button>
                <button type="button" className="btn btn-sm bg-red-600 text-white hover:bg-red-700" onClick={() => removeImg(i)}>Remove</button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-6">
        <label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={f.featured} onChange={(e) => setF({ ...f, featured: e.target.checked })} className="h-4 w-4 accent-[#b8935a]" />Show on the homepage as a featured property</label>
      </section>

      {err && <p role="alert" className="rounded bg-red-50 p-3 text-sm text-red-700">{err}</p>}
      <div className="flex flex-wrap gap-3">
        <button className="btn-navy" disabled={saving || uploading}>{saving ? 'Saving…' : 'Save changes'}</button>
        {!f.published && <button type="button" className="btn-gold" disabled={saving || uploading} onClick={(e) => save(e, true)}>Save and publish</button>}
        {f.published && <button type="button" className="btn-outline" disabled={saving || uploading} onClick={(e) => save(e, false)}>Save as draft</button>}
      </div>
    </form>
  )
}
