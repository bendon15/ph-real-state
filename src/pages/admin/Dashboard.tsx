import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import type { Inquiry } from '../../lib/types'
import { fmtDate } from '../../lib/utils'

export default function Dashboard() {
  const [s, setS] = useState({ props: 0, published: 0, drafts: 0, available: 0, inq: 0, newInq: 0 })
  const [recent, setRecent] = useState<Inquiry[]>([])

  useEffect(() => {
    const c = (t: string, f?: (q: any) => any) => { const q = supabase.from(t).select('id', { count: 'exact', head: true }); return (f ? f(q) : q).then((r: { count: number | null }) => r.count ?? 0) }
    Promise.all([
      c('properties'), c('properties', (q) => q.eq('published', true)), c('properties', (q) => q.eq('published', false)),
      c('properties', (q) => q.eq('status', 'available').eq('published', true)), c('inquiries'), c('inquiries', (q) => q.eq('status', 'new')),
    ]).then(([props, published, drafts, available, inq, newInq]) => setS({ props, published, drafts, available, inq, newInq }))
    supabase.from('inquiries').select('*, properties(title, slug)').order('created_at', { ascending: false }).limit(5).then(({ data }) => setRecent((data as Inquiry[]) ?? []))
  }, [])

  const cards: [string, number][] = [['Total properties', s.props], ['Published', s.published], ['Drafts', s.drafts], ['Available now', s.available], ['All inquiries', s.inq], ['New inquiries', s.newInq]]
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-4xl font-bold">Dashboard</h1><Link to="/admin/properties/new" className="btn-gold">Add property</Link></div>
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        {cards.map(([k, v]) => <div key={k} className="rounded-lg border border-slate-200 bg-white p-5"><p className="font-display text-4xl font-bold text-navy-800">{v}</p><p className="mt-1 text-xs text-slate-500">{k}</p></div>)}
      </div>
      <div className="mt-8 rounded-lg border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-100 p-5"><h2 className="text-2xl font-bold">Recent inquiries</h2><Link to="/admin/inquiries" className="text-sm text-gold-dark hover:underline">View all</Link></div>
        {recent.length === 0 ? <p className="p-8 text-center text-sm text-slate-500">No inquiries yet. They will appear here when visitors send a message.</p> : (
          <ul className="divide-y divide-slate-100">
            {recent.map((i) => (
              <li key={i.id} className="flex flex-wrap items-center justify-between gap-2 p-4 text-sm">
                <div><p className="font-semibold text-navy-800">{i.name} {i.status === 'new' && <span className="ml-1 rounded bg-gold px-1.5 py-0.5 text-[10px] text-white">New</span>}</p>
                  <p className="text-slate-500">{i.properties?.title ?? 'General contact'}</p></div>
                <span className="text-xs text-slate-400">{fmtDate(i.created_at)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
