-- Migration 007: integrity filter columns + session blackout dates + family activities catalog.
-- Purpose: enforce the UX_PRINCIPLES.md "no hallucinations" rule by giving us a place to track
-- link-check state, session-specific closed dates, and curated family-activity alternatives.

-- Camps: track whether the website URL is reachable.
alter table public.camps
  add column if not exists website_status text not null default 'unchecked'
  check (website_status in ('unchecked','ok','broken','timeout'));

alter table public.camps
  add column if not exists website_last_verified_at timestamptz;

-- Camp sessions: allow specific blackout dates (e.g. Memorial Day within a summer session).
alter table public.camp_sessions
  add column if not exists closed_dates date[] not null default '{}';

-- Family activities catalog — manually curated, verified alternatives to camps.
create table if not exists public.family_activities (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text,
  category text not null check (category in ('outdoor','indoor','event','beach','park','museum','playspace','nature','library','cultural','market')),
  ages_min int not null default 0,
  ages_max int not null default 17,
  cost_tier text not null check (cost_tier in ('free','$','$$','$$$')) default 'free',
  cost_note text,
  address text,
  neighborhood text,
  latitude decimal(9,6),
  longitude decimal(9,6),
  website_url text,
  phone text,
  weather_preference text check (weather_preference in ('any','indoor_preferred','outdoor_preferred')) default 'any',
  verified boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists family_activities_category_idx
  on public.family_activities (category, verified);
create index if not exists family_activities_verified_idx
  on public.family_activities (verified) where verified = true;

alter table public.family_activities enable row level security;

-- Anyone can read curated activities (no PII).
drop policy if exists "anyone reads family activities" on public.family_activities;
create policy "anyone reads family activities"
  on public.family_activities for select using (true);
