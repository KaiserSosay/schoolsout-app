-- Phase A: Backend foundation for landing page rebuild.
-- Adds two new tables for capturing leads from the marketing site:
--   1. city_requests     — visitors requesting coverage in a new city
--   2. camp_applications — camp operators applying to be listed

-- Table 1: city_requests (from landing "Don't see your city?" form)
create table public.city_requests (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  city text not null,
  state text,
  user_agent text,
  created_at timestamptz not null default now()
);
-- Prevent one email from spamming the same city but allow same email to request multiple cities.
create unique index city_requests_email_city_idx on public.city_requests (lower(email), lower(city));

alter table public.city_requests enable row level security;

-- Anon + authenticated can INSERT; nobody SELECTs except service role.
create policy "anyone can insert city requests"
  on public.city_requests for insert
  to anon, authenticated
  with check (true);

-- Table 2: camp_applications (from "Run a camp? List it" form)
create type camp_application_status as enum ('pending', 'approved', 'rejected');

create table public.camp_applications (
  id uuid primary key default gen_random_uuid(),
  camp_name text not null,
  website text not null,
  ages text not null,
  neighborhood text not null,
  email text not null,
  status camp_application_status not null default 'pending',
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  notes text
);
create index camp_applications_status_idx on public.camp_applications (status, created_at desc);

alter table public.camp_applications enable row level security;

create policy "anyone can submit camp applications"
  on public.camp_applications for insert
  to anon, authenticated
  with check (true);
