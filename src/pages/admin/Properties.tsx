import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import type { Property } from '../../lib/types'
import { FALLBACK_IMG, priceLabel } from '../../lib/utils'

export const imagePath = (url: string) => decodeURIComponent(url.split('/property-images/')[1] ?? '')

export default function AdminProperties() {
  const [items, setItems] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')
  const load = useCallback(async () => {
    const { data, error } = await supabase.from('properties').select('*').order('created_at', { ascending: false })
    if (error) setMsg(error.message)
    setItems((data as Property[]) ?? []); setLoading(false)
  }, [])
  useEffect(() => { load() }, [load])

  async function toggle(p: Property, field: 'published' | 'featured') {
    const { error } = await supabase.from('properties').update({ [field]: !p[field] }).eq('id', p.id)
    setMsg(error ? error.message : field === 'published' ? (p.published ? 'Unpublished.' : 'Published.') : 'Updated.')
    load()
  }
  async function remove(p: Property) {
    if (!confirm(`Delete "${p.title}"? This also removes its photos and cannot be undone.`)) return
    const paths = p.images.map(imagePath).filter(Boolean)
    if (paths.length) await supabase.storage.from('property-images').remove(paths)
    const { error } = await supabase.from('properties').delete().eq('id', p.id)
    setMsg(error ? error.message : 'Deleted.')
    load()
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-4xl font-bold">Properties</h1><Link to="/admin/properties/new" className="btn-gold">Add property</Link></div>
      {msg && <p role="status" className="mt-4 rounded bg-navy-50 p-3 text-sm text-navy-800">{msg}</p>}
      <div className="mt-6 overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs text-slate-500"><tr><th className="p-3">Property</th><th className="p-3">Price</th><th className="p-3">Availability</th><th className="p-3">Visibility</th><th className="p-3 text-right">Actions</th></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {loading && <tr><td colSpan={5} className="p-8 text-center text-slate-500">Loading…</td></tr>}
            {!loading && items.length === 0 && <tr><td colSpan={5} className="p-10 text-center text-slate-500">No properties yet. Add your first listing to get started.</td></tr>}
            {items.map((p) => (
              <tr key={p.id}>
                <td className="p-3"><div className="flex items-center gap-3"><img src={p.images[0] || FALLBACK_IMG} alt="" className="h-12 w-16 rounded object-cover" />
                  <div><p className="font-semibold text-navy-800">{p.title}</p><p className="text-xs text-slate-500">{p.city} · {p.listing_type === 'sale' ? 'For sale' : 'For rent'}</p></div></div></td>
                <td className="p-3 whitespace-nowrap">{priceLabel(p)}</td>
                <td className="p-3 capitalize">{p.status}</td>
                <td className="p-3"><span className={`rounded px-2 py-0.5 text-xs font-semibold ${p.published ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600'}`}>{p.published ? 'Published' : 'Draft'}</span>{p.featured && <span className="ml-1 rounded bg-gold/15 px-2 py-0.5 text-xs font-semibold text-gold-dark">Featured</span>}</td>
                <td className="p-3"><div className="flex flex-wrap justify-end gap-1.5">
                  <button className="btn-outline btn-sm" onClick={() => toggle(p, 'published')}>{p.published ? 'Unpublish' : 'Publish'}</button>
                  <button className="btn-outline btn-sm" onClick={() => toggle(p, 'featured')}>{p.featured ? 'Unfeature' : 'Feature'}</button>
                  <Link className="btn-navy btn-sm" to={`/admin/properties/${p.id}`}>Edit</Link>
                  <button className="btn btn-sm bg-red-600 text-white hover:bg-red-700" onClick={() => remove(p)}>Delete</button></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
