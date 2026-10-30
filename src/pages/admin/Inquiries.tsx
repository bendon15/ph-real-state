import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import type { Inquiry } from '../../lib/types'
import { fmtDate } from '../../lib/utils'

const STATUSES: Inquiry['status'][] = ['new', 'read', 'replied', 'archived']

export default function AdminInquiries() {
  const [items, setItems] = useState<Inquiry[]>([])
  const [filter, setFilter] = useState('')
  const [open, setOpen] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')

  const load = useCallback(async () => {
    const { data, error } = await supabase.from('inquiries').select('*, properties(title, slug)').order('created_at', { ascending: false })
    if (error) setMsg(error.message)
    setItems((data as Inquiry[]) ?? []); setLoading(false)
  }, [])
  useEffect(() => { load() }, [load])

  async function setStatus(i: Inquiry, status: Inquiry['status']) {
    const { error } = await supabase.from('inquiries').update({ status }).eq('id', i.id)
    if (error) setMsg(error.message)
    setItems((a) => a.map((x) => (x.id === i.id ? { ...x, status } : x)))
  }
  async function toggle(i: Inquiry) {
    setOpen(open === i.id ? null : i.id)
    if (i.status === 'new') setStatus(i, 'read')
  }
  async function remove(i: Inquiry) {
    if (!confirm(`Delete the inquiry from ${i.name}?`)) return
    const { error } = await supabase.from('inquiries').delete().eq('id', i.id)
    setMsg(error ? error.message : 'Deleted.'); load()
  }
  const shown = items.filter((i) => !filter || i.status === filter)

  return (
    <div>
      <h1 className="text-4xl font-bold">Inquiries</h1>
      <div className="mt-5 flex flex-wrap gap-2">
        {['', ...STATUSES].map((s) => (
          <button key={s} onClick={() => setFilter(s)} className={`btn btn-sm capitalize ${filter === s ? 'bg-navy-800 text-white' : 'border border-slate-300 bg-white text-navy-800'}`}>
            {s || 'All'}{s === 'new' && items.some((i) => i.status === 'new') ? ` (${items.filter((i) => i.status === 'new').length})` : ''}
          </button>
        ))}
      </div>
      {msg && <p role="status" className="mt-4 rounded bg-navy-50 p-3 text-sm">{msg}</p>}
      <div className="mt-5 divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white">
        {loading && <p className="p-8 text-center text-slate-500">Loading…</p>}
        {!loading && shown.length === 0 && <p className="p-10 text-center text-sm text-slate-500">No inquiries here yet.</p>}
        {shown.map((i) => (
          <div key={i.id}>
            <button onClick={() => toggle(i)} aria-expanded={open === i.id} className="flex w-full flex-wrap items-center justify-between gap-2 p-4 text-left hover:bg-slate-50">
              <div><p className="text-sm font-semibold text-navy-800">{i.name} {i.status === 'new' && <span className="ml-1 rounded bg-gold px-1.5 py-0.5 text-[10px] text-white">New</span>}</p>
                <p className="text-xs text-slate-500">{i.properties?.title ?? 'General contact'}</p></div>
              <div className="flex items-center gap-3 text-xs text-slate-400"><span className="capitalize">{i.status}</span><span>{fmtDate(i.created_at)}</span></div>
            </button>
            {open === i.id && (
              <div className="border-t border-slate-100 bg-slate-50 p-5 text-sm">
                <p className="whitespace-pre-line text-slate-700">{i.message}</p>
                <p className="mt-4 text-slate-500">{i.email}{i.phone && ` · ${i.phone}`}</p>
                {i.properties && <p className="mt-1"><Link className="text-gold-dark hover:underline" to={`/properties/${i.properties.slug}`} target="_blank">View property</Link></p>}
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <a className="btn-navy btn-sm" href={`mailto:${i.email}?subject=${encodeURIComponent('Re: your inquiry')}`} onClick={() => i.status !== 'replied' && setStatus(i, 'replied')}>Reply by email</a>
                  <select className="input !w-auto !py-1.5 text-xs" aria-label="Status" value={i.status} onChange={(e) => setStatus(i, e.target.value as Inquiry['status'])}>
                    {STATUSES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                  </select>
                  <button className="btn btn-sm bg-red-600 text-white hover:bg-red-700" onClick={() => remove(i)}>Delete</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
