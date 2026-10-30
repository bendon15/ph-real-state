# PH Real Estate

Real estate website for the Philippine market. React + Vite + TypeScript + Tailwind on **Cloudflare Pages**, a **Cloudflare Worker** API, **Supabase** (Postgres, Auth, Storage) and **Resend** email.

## Architecture

| Part | Where | What it does |
|---|---|---|
| Public site and admin UI | `src/` (Cloudflare Pages) | Browsing, filters, galleries, inquiry forms, admin dashboard |
| Inquiry API | `worker/` (Cloudflare Worker) | Validates, rate-limits, stores inquiries, emails the admin via Resend |
| Database, auth, images | `supabase/migrations/` | Tables, Row Level Security, `property-images` bucket |

Security model:
- The browser only has the Supabase **anon** key. RLS lets the public read **published** properties only.
- Admin access requires a Supabase Auth user listed in the `admins` table (`is_admin()` is enforced in every write policy and storage policy).
- `inquiries` has no public access. Only the Worker (service role key, stored as a Worker secret) can insert; only admins can read or manage.
- Spam protection: honeypot field, minimum fill time, 5 inquiries per IP per hour (hashed IP), optional Cloudflare Turnstile.
- The Worker only accepts requests from origins listed in `ALLOWED_ORIGIN`.

## 1. Supabase

1. Create a project at supabase.com.
2. SQL Editor: run `supabase/migrations/001_init.sql`. Optionally run `002_seed_sample.sql` for demo listings.
3. Authentication > Users > **Add user** (email and password, tick "Auto confirm"). Also turn **off** public sign-ups under Authentication > Providers > Email.
4. Make that user an admin (SQL Editor):
   ```sql
   insert into public.admins (user_id) select id from auth.users where email = 'you@example.com';
   ```
5. Project Settings > API: copy the **Project URL**, **anon key** and **service_role key**.

## 2. Resend

1. Create an API key at resend.com and verify your sending domain.
2. Use an address on that domain for `FROM_EMAIL`. Until the domain is verified, Resend only allows `onboarding@resend.dev` sending to your own account email.

## 3. Deploy the Worker

```bash
npm install
npx wrangler login
# edit worker/wrangler.toml [vars]: SUPABASE_URL, ADMIN_EMAIL, FROM_EMAIL, ALLOWED_ORIGIN, SITE_URL
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY -c worker/wrangler.toml
npx wrangler secret put RESEND_API_KEY -c worker/wrangler.toml
npx wrangler secret put TURNSTILE_SECRET_KEY -c worker/wrangler.toml   # optional
npm run worker:deploy
```

Recommended: serve the API on your own domain by uncommenting `routes` in `worker/wrangler.toml` (for example `yourdomain.com/api/*`) so the site calls `/api/inquiries` on the same origin. Otherwise set `VITE_API_URL` to the Worker URL (`https://ph-real-estate-api.<subdomain>.workers.dev/api`) and include your site's origin in `ALLOWED_ORIGIN`.

## 4. Deploy the site (Cloudflare Pages)

Dashboard: Workers & Pages > Create > Pages > Connect to Git, with:

- Build command: `npm run build`
- Build output directory: `dist`
- Environment variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_URL`, `VITE_TURNSTILE_SITE_KEY` (optional)

Or from the CLI: `npm run pages:deploy`. SPA routing (`public/_redirects`) and security headers (`public/_headers`) are included.

After the first deploy, add your final Pages or custom domain to `ALLOWED_ORIGIN` and `SITE_URL` in `worker/wrangler.toml`, then redeploy the Worker.

## Local development

```bash
cp .env.example .env            # fill VITE_* values
cp worker/.dev.vars.example worker/.dev.vars   # fill worker secrets; set the plain vars in wrangler.toml
npm run worker:dev              # Worker on :8787
npm run dev                     # site on :5173 (proxies /api to the Worker)
```

Admin: `/admin/login`. Checks: `npm run build` and `npm run typecheck:worker`.

## Admin features

Dashboard statistics; add, edit, delete, publish and unpublish properties; feature on homepage; set availability (available, reserved, sold, rented); multi-image upload with reordering and cover photo; inquiry inbox with status tracking, reply by email and delete.

## Notes

- Listing images are stored in the public `property-images` bucket (5 MB, JPG/PNG/WebP).
- The sample seed uses remote Unsplash photos. Replace them with your own uploads.
- Placeholder office address, statistics and copy in the footer, About and Contact pages are examples. Edit them before launch.
