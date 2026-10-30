-- PH Real Estate: schema, RLS and storage
create extension if not exists pgcrypto;

-- Admin allow-list. Only users listed here get admin access.
create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null check (char_length(title) between 3 and 200),
  description text not null default '',
  price numeric(14,2) not null check (price >= 0),
  property_type text not null check (property_type in ('house','condo','townhouse','lot','commercial')),
  listing_type text not null check (listing_type in ('sale','rent')),
  status text not null default 'available' check (status in ('available','reserved','sold','rented')),
  address text not null default '',
  city text not null,
  province text not null default '',
  bedrooms int not null default 0 check (bedrooms >= 0),
  bathrooms int not null default 0 check (bathrooms >= 0),
  parking int not null default 0 check (parking >= 0),
  floor_area numeric(10,2) not null default 0 check (floor_area >= 0),
  lot_area numeric(10,2) not null default 0 check (lot_area >= 0),
  amenities text[] not null default '{}',
  images text[] not null default '{}',
  featured boolean not null default false,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists properties_published_idx on public.properties (published, created_at desc);
create index if not exists properties_city_idx on public.properties (lower(city));

create table if not exists public.inquiries (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('contact','property')),
  property_id uuid references public.properties(id) on delete set null,
  name text not null,
  email text not null,
  phone text not null default '',
  message text not null,
  status text not null default 'new' check (status in ('new','read','replied','archived')),
  ip_hash text,
  created_at timestamptz not null default now()
);
create index if not exists inquiries_created_idx on public.inquiries (created_at desc);
create index if not exists inquiries_ip_idx on public.inquiries (ip_hash, created_at desc);

create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
drop trigger if exists properties_touch on public.properties;
create trigger properties_touch before update on public.properties
  for each row execute function public.touch_updated_at();

-- Row Level Security
alter table public.admins enable row level security;
alter table public.properties enable row level security;
alter table public.inquiries enable row level security;

drop policy if exists "admins read self" on public.admins;
create policy "admins read self" on public.admins for select to authenticated using (user_id = auth.uid());

drop policy if exists "public reads published" on public.properties;
create policy "public reads published" on public.properties for select to anon, authenticated using (published = true);
drop policy if exists "admin reads all properties" on public.properties;
create policy "admin reads all properties" on public.properties for select to authenticated using (public.is_admin());
drop policy if exists "admin inserts properties" on public.properties;
create policy "admin inserts properties" on public.properties for insert to authenticated with check (public.is_admin());
drop policy if exists "admin updates properties" on public.properties;
create policy "admin updates properties" on public.properties for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admin deletes properties" on public.properties;
create policy "admin deletes properties" on public.properties for delete to authenticated using (public.is_admin());

-- Inquiries: no anon access at all. Inserts come from the Worker (service role bypasses RLS).
drop policy if exists "admin manages inquiries" on public.inquiries;
create policy "admin manages inquiries" on public.inquiries for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Storage bucket for property images (public read, admin write)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('property-images', 'property-images', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = true, file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg','image/png','image/webp'];

drop policy if exists "public read property images" on storage.objects;
create policy "public read property images" on storage.objects for select to anon, authenticated
  using (bucket_id = 'property-images');
drop policy if exists "admin upload property images" on storage.objects;
create policy "admin upload property images" on storage.objects for insert to authenticated
  with check (bucket_id = 'property-images' and public.is_admin());
drop policy if exists "admin update property images" on storage.objects;
create policy "admin update property images" on storage.objects for update to authenticated
  using (bucket_id = 'property-images' and public.is_admin());
drop policy if exists "admin delete property images" on storage.objects;
create policy "admin delete property images" on storage.objects for delete to authenticated
  using (bucket_id = 'property-images' and public.is_admin());
