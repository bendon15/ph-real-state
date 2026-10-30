import { useEffect, useRef, useState, type FormEvent } from 'react'
import { API_URL } from '../lib/utils'

declare global { interface Window { turnstile?: { render: (el: HTMLElement, o: Record<string, unknown>) => void } } }
const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined

interface Props { type: 'contact' | 'property'; propertyId?: string; propertyTitle?: string; compact?: boolean }

export default function InquiryForm({ type, propertyId, propertyTitle, compact }: Props) {
  const [f, setF] = useState({ name: '', email: '', phone: '', message: propertyTitle ? `Hi, I'm interested in "${propertyTitle}". Please send me more details and available viewing schedules.` : '', website: '' })
  const [state, setState] = useState<'idle' | 'sending' | 'done'>('idle')
  const [error, setError] = useState('')
  const [fields, setFields] = useState<Record<string, string>>({})
  const started = useRef(Date.now())
  const token = useRef('')
  const tsEl = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!SITE_KEY || !tsEl.current) return
    const render = () => window.turnstile?.render(tsEl.current!, { sitekey: SITE_KEY, callback: (t: string) => { token.current = t } })
    if (window.turnstile) return render()
    const s = document.createElement('script')
    s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
    s.async = true
    s.onload = render
    document.head.appendChild(s)
  }, [])

  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value })

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError(''); setFields({})
    const local: Record<string, string> = {}
    if (f.name.trim().length < 2) local.name = 'Enter your full name.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email)) local.email = 'Enter a valid email address.'
    if (f.message.trim().length < 10) local.message = 'Message must be at least 10 characters.'
    if (Object.keys(local).length) return setFields(local)
    setState('sending')
    try {
      const r = await fetch(`${API_URL}/inquiries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...f, type, propertyId, elapsed: Date.now() - started.current, turnstileToken: token.current }),
      })
      const d = await r.json().catch(() => ({}))
      if (!r.ok) { setFields(d.fields ?? {}); setError(d.error ?? 'Something went wrong. Please try again.'); setState('idle'); return }
      setState('done')
    } catch {
      setError('Could not reach the server. Check your connection and try again.')
      setState('idle')
    }
  }

  if (state === 'done')
    return (
      <div role="status" className="rounded-lg border border-gold/40 bg-gold/5 p-6">
        <h3 className="text-2xl">Message sent</h3>
        <p className="mt-2 text-sm text-slate-600">Thank you, {f.name.split(' ')[0]}. An agent will reply to {f.email} within one business day.</p>
      </div>
    )

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <div><label className="label" htmlFor={`n-${type}`}>Full name</label>
        <input id={`n-${type}`} className="input" value={f.name} onChange={set('name')} autoComplete="name" maxLength={100} />
        {fields.name && <p className="err">{fields.name}</p>}</div>
      <div className={compact ? 'space-y-4' : 'grid gap-4 sm:grid-cols-2'}>
        <div><label className="label" htmlFor={`e-${type}`}>Email</label>
          <input id={`e-${type}`} type="email" className="input" value={f.email} onChange={set('email')} autoComplete="email" maxLength={200} />
          {fields.email && <p className="err">{fields.email}</p>}</div>
        <div><label className="label" htmlFor={`p-${type}`}>Phone (optional)</label>
          <input id={`p-${type}`} type="tel" className="input" value={f.phone} onChange={set('phone')} autoComplete="tel" placeholder="+63 9XX XXX XXXX" maxLength={30} />
          {fields.phone && <p className="err">{fields.phone}</p>}</div>
      </div>
      <div><label className="label" htmlFor={`m-${type}`}>Message</label>
        <textarea id={`m-${type}`} rows={compact ? 5 : 6} className="input" value={f.message} onChange={set('message')} maxLength={3000} />
        {fields.message && <p className="err">{fields.message}</p>}</div>
      {/* Honeypot: hidden from people, filled by bots */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>Website<input tabIndex={-1} autoComplete="off" value={f.website} onChange={set('website')} /></label>
      </div>
      {SITE_KEY && <div ref={tsEl} />}
      {error && <p role="alert" className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <button className="btn-gold w-full" disabled={state === 'sending'}>{state === 'sending' ? 'Sending…' : type === 'property' ? 'Send inquiry' : 'Send message'}</button>
    </form>
  )
}
