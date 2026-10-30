export interface Env {
  SUPABASE_URL: string
  SUPABASE_SERVICE_ROLE_KEY: string
  RESEND_API_KEY: string
  ADMIN_EMAIL: string
  FROM_EMAIL: string
  ALLOWED_ORIGIN: string
  SITE_URL: string
  TURNSTILE_SECRET_KEY?: string
}

const RATE_LIMIT = 5 // inquiries per IP per hour
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string)

function corsHeaders(req: Request, env: Env): Record<string, string> {
  const origin = req.headers.get('Origin') ?? ''
  const allowed = env.ALLOWED_ORIGIN.split(',').map((s) => s.trim())
  if (!allowed.includes(origin)) return {}
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  }
}

const json = (body: unknown, status: number, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...extra } })

async function sha256(text: string) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

function sb(env: Env, path: string, init: RequestInit = {}) {
  return fetch(`${env.SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  })
}

async function verifyTurnstile(env: Env, token: string, ip: string) {
  if (!env.TURNSTILE_SECRET_KEY) return true
  if (!token) return false
  const body = new FormData()
  body.append('secret', env.TURNSTILE_SECRET_KEY)
  body.append('response', token)
  body.append('remoteip', ip)
  const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body })
  const d = (await r.json()) as { success?: boolean }
  return d.success === true
}

function emailHtml(i: { type: string; name: string; email: string; phone: string; message: string; property?: { title: string; url: string } }) {
  const row = (k: string, v: string) =>
    `<tr><td style="padding:8px 0;color:#6b7a90;font-size:13px;width:110px;vertical-align:top">${k}</td><td style="padding:8px 0;color:#0b1f3a;font-size:15px">${v}</td></tr>`
  return `<!doctype html><html><body style="margin:0;background:#f3f6fa;font-family:Helvetica,Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:24px 12px"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border-radius:6px;overflow:hidden">
<tr><td style="background:#0b1f3a;padding:24px 32px"><div style="font-family:Georgia,serif;font-size:24px;color:#fff">PH Real Estate</div>
<div style="height:2px;width:48px;background:#b8935a;margin-top:10px"></div></td></tr>
<tr><td style="padding:32px">
<h1 style="margin:0 0 4px;font-family:Georgia,serif;font-size:22px;color:#0b1f3a">${i.property ? 'New property inquiry' : 'New contact message'}</h1>
<p style="margin:0 0 20px;color:#6b7a90;font-size:14px">Reply to this email to answer ${esc(i.name)} directly.</p>
<table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #e6ecf5;border-bottom:1px solid #e6ecf5">
${i.property ? row('Property', `<a href="${esc(i.property.url)}" style="color:#96753f">${esc(i.property.title)}</a>`) : ''}
${row('Name', esc(i.name))}${row('Email', `<a href="mailto:${esc(i.email)}" style="color:#96753f">${esc(i.email)}</a>`)}${row('Phone', esc(i.phone) || '-')}
${row('Message', esc(i.message).replace(/\n/g, '<br>'))}
</table></td></tr>
<tr><td style="padding:16px 32px;background:#f3f6fa;color:#6b7a90;font-size:12px">Sent from the PH Real Estate website. Manage inquiries in your admin dashboard.</td></tr>
</table></td></tr></table></body></html>`
}

async function handleInquiry(req: Request, env: Env, ctx: ExecutionContext, cors: Record<string, string>) {
  let b: Record<string, unknown>
  try {
    b = (await req.json()) as Record<string, unknown>
  } catch {
    return json({ error: 'Invalid request body.' }, 400, cors)
  }
  const str = (k: string, max: number) => (typeof b[k] === 'string' ? (b[k] as string).trim().slice(0, max) : '')
  const ip = req.headers.get('CF-Connecting-IP') ?? 'unknown'

  // Spam protection: honeypot + minimum fill time + optional Turnstile
  if (str('website', 100)) return json({ ok: true }, 200, cors) // pretend success to bots
  const elapsed = Number(b.elapsed)
  if (!Number.isFinite(elapsed) || elapsed < 2500) return json({ error: 'Please take a moment to complete the form.' }, 400, cors)
  if (!(await verifyTurnstile(env, str('turnstileToken', 2048), ip))) return json({ error: 'Spam check failed. Please retry.' }, 400, cors)

  const type = b.type === 'property' ? 'property' : 'contact'
  const name = str('name', 100)
  const email = str('email', 200)
  const phone = str('phone', 30)
  const message = str('message', 3000)
  const propertyId = str('propertyId', 36)

  const errors: Record<string, string> = {}
  if (name.length < 2) errors.name = 'Enter your full name.'
  if (!EMAIL_RE.test(email)) errors.email = 'Enter a valid email address.'
  if (phone && !/^[0-9+()\-\s]{7,30}$/.test(phone)) errors.phone = 'Enter a valid phone number.'
  if (message.length < 10) errors.message = 'Message must be at least 10 characters.'
  if (type === 'property' && !UUID_RE.test(propertyId)) errors.propertyId = 'Invalid property.'
  if (Object.keys(errors).length) return json({ error: 'Please fix the highlighted fields.', fields: errors }, 422, cors)

  // Rate limiting (per hashed IP, stored in Supabase)
  const ipHash = await sha256(ip + env.SUPABASE_SERVICE_ROLE_KEY.slice(-16))
  const since = new Date(Date.now() - 3600_000).toISOString()
  const rl = await sb(env, `inquiries?ip_hash=eq.${ipHash}&created_at=gte.${encodeURIComponent(since)}&select=id&limit=${RATE_LIMIT}`)
  if (rl.ok && ((await rl.json()) as unknown[]).length >= RATE_LIMIT)
    return json({ error: 'Too many messages. Please try again later.' }, 429, { ...cors, 'Retry-After': '3600' })

  let property: { title: string; url: string } | undefined
  if (type === 'property') {
    const pr = await sb(env, `properties?id=eq.${propertyId}&published=eq.true&select=title,slug&limit=1`)
    const rows = pr.ok ? ((await pr.json()) as { title: string; slug: string }[]) : []
    if (!rows.length) return json({ error: 'This property is no longer available.' }, 404, cors)
    property = { title: rows[0].title, url: `${env.SITE_URL}/properties/${rows[0].slug}` }
  }

  const ins = await sb(env, 'inquiries', {
    method: 'POST',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({ type, property_id: type === 'property' ? propertyId : null, name, email, phone, message, ip_hash: ipHash }),
  })
  if (!ins.ok) return json({ error: 'Could not save your message. Please try again.' }, 500, cors)

  // Email notification (does not block the response; the inquiry is already stored)
  ctx.waitUntil(
    fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: env.FROM_EMAIL,
        to: [env.ADMIN_EMAIL],
        reply_to: email,
        subject: property ? `Property inquiry: ${property.title}` : `Contact message from ${name}`,
        html: emailHtml({ type, name, email, phone, message, property }),
      }),
    }).then(async (r) => {
      if (!r.ok) console.error('Resend error', r.status, await r.text())
    }),
  )
  return json({ ok: true }, 201, cors)
}

export default {
  async fetch(req: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(req.url)
    const cors = corsHeaders(req, env)
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors })
    if (url.pathname === '/api/health') return json({ ok: true }, 200, cors)
    if (url.pathname === '/api/inquiries' && req.method === 'POST') {
      const origin = req.headers.get('Origin')
      if (origin && !cors['Access-Control-Allow-Origin']) return json({ error: 'Origin not allowed.' }, 403)
      try {
        return await handleInquiry(req, env, ctx, cors)
      } catch (e) {
        console.error(e)
        return json({ error: 'Unexpected error.' }, 500, cors)
      }
    }
    return json({ error: 'Not found.' }, 404, cors)
  },
}
