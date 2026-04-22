-- Phase 1: Logged-in app tables.
-- Adds: users.display_name, kid_profiles, camps, saved_camps, kid_activity.
-- All new tables have RLS enabled. kid_profiles stores school + age_range only
-- (COPPA design — kid NAMES stay client-side).

-- Parent display name for dashboard greeting ("Welcome back, Rasheid").
alter table public.users add column if not exists display_name text;

-- Kid profiles: server stores age_range + school_id ONLY. Names stay client-side (COPPA design).
create table if not exists public.kid_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  school_id uuid not null references public.schools(id) on delete set null,
  age_range text not null check (age_range in ('4-6','7-9','10-12','13+')),
  ordinal smallint not null default 1,  -- "Kid 1", "Kid 2" — display order, not identity
  created_at timestamptz not null default now()
);
create index if not exists kid_profiles_user_idx on public.kid_profiles (user_id);
alter table public.kid_profiles enable row level security;
drop policy if exists "users read own kids" on public.kid_profiles;
create policy "users read own kids" on public.kid_profiles for select using (auth.uid() = user_id);
drop policy if exists "users write own kids" on public.kid_profiles;
create policy "users write own kids" on public.kid_profiles for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Camps catalog
create table if not exists public.camps (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text,
  ages_min int not null check (ages_min >= 0),
  ages_max int not null check (ages_max >= ages_min),
  price_tier text not null check (price_tier in ('$','$$','$$$')),
  categories text[] not null default '{}',
  website_url text,
  image_url text,
  neighborhood text,
  is_featured boolean not null default false,
  verified boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists camps_categories_idx on public.camps using gin (categories);
create index if not exists camps_featured_verified_idx on public.camps (is_featured desc, verified desc, created_at desc);
alter table public.camps enable row level security;
drop policy if exists "anyone reads camps" on public.camps;
create policy "anyone reads camps" on public.camps for select using (true);

-- Saved camps (wishlist)
create table if not exists public.saved_camps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  camp_id uuid not null references public.camps(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(user_id, camp_id)
);
create index if not exists saved_camps_user_idx on public.saved_camps (user_id, created_at desc);
alter table public.saved_camps enable row level security;
drop policy if exists "users read own saves" on public.saved_camps;
create policy "users read own saves" on public.saved_camps for select using (auth.uid() = user_id);
drop policy if exists "users write own saves" on public.saved_camps;
create policy "users write own saves" on public.saved_camps for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Activity log (what the parent sees as "Kid Activity" on the dashboard)
create table if not exists public.kid_activity (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  action text not null check (action in ('saved_camp','unsaved_camp','viewed_closure','viewed_camp')),
  target_id uuid,
  target_name text not null,
  metadata jsonb default '{}'::jsonb,  -- space for 'mode':'kid'|'parent' etc.
  created_at timestamptz not null default now()
);
create index if not exists kid_activity_user_idx on public.kid_activity (user_id, created_at desc);
alter table public.kid_activity enable row level security;
drop policy if exists "users read own activity" on public.kid_activity;
create policy "users read own activity" on public.kid_activity for select using (auth.uid() = user_id);
drop policy if exists "users write own activity" on public.kid_activity;
create policy "users write own activity" on public.kid_activity for insert with check (auth.uid() = user_id);
