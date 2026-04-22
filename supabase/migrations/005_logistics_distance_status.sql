-- Phase: logistics + geocoding + honest calendar status.
-- DECISION: Using DO block for the enum so the migration is idempotent. Postgres
-- never supported `create type if not exists` on enums, so we catch the
-- duplicate_object exception.
do $$ begin
  create type school_calendar_status as enum (
    'verified_multi_year',  -- 2+ school years fully verified
    'verified_current',     -- current school year verified
    'ai_draft',             -- parsed by AI, awaiting human review (not shown to users yet)
    'needs_research',       -- no calendar data yet
    'unavailable'           -- we tried and couldn't find one
  );
exception when duplicate_object then null;
end $$;

-- Schools get geocoding + honest calendar status
alter table public.schools add column if not exists latitude decimal(9,6);
alter table public.schools add column if not exists longitude decimal(9,6);
alter table public.schools add column if not exists calendar_status school_calendar_status not null default 'needs_research';
alter table public.schools add column if not exists address text;

-- Backfill current invariant: TGP + CGP have verified closures already.
update public.schools set calendar_status = 'verified_current'
  where id in ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002');

-- Camps: logistics + geocoding
alter table public.camps add column if not exists address text;
alter table public.camps add column if not exists latitude decimal(9,6);
alter table public.camps add column if not exists longitude decimal(9,6);
alter table public.camps add column if not exists hours_start time;          -- e.g. 09:00
alter table public.camps add column if not exists hours_end time;            -- e.g. 15:00
alter table public.camps add column if not exists before_care_offered boolean not null default false;
alter table public.camps add column if not exists before_care_start time;    -- e.g. 07:30
alter table public.camps add column if not exists before_care_price_cents int;
alter table public.camps add column if not exists after_care_offered boolean not null default false;
alter table public.camps add column if not exists after_care_end time;       -- e.g. 18:00
alter table public.camps add column if not exists after_care_price_cents int;
alter table public.camps add column if not exists closed_on_holidays boolean not null default true;
alter table public.camps add column if not exists phone text;
alter table public.camps add column if not exists logistics_verified boolean not null default false;

-- Camp sessions (spring break, summer session N, etc.)
create table if not exists public.camp_sessions (
  id uuid primary key default gen_random_uuid(),
  camp_id uuid not null references public.camps(id) on delete cascade,
  name text,
  start_date date not null,
  end_date date not null,
  spots_available int,
  booking_url text,
  verified boolean not null default false,
  created_at timestamptz not null default now(),
  check (end_date >= start_date)
);
create index if not exists camp_sessions_dates_idx on public.camp_sessions (start_date, end_date);
create index if not exists camp_sessions_camp_idx on public.camp_sessions (camp_id);
alter table public.camp_sessions enable row level security;
drop policy if exists "anyone reads camp sessions" on public.camp_sessions;
create policy "anyone reads camp sessions" on public.camp_sessions for select using (true);

-- Saved locations (Home, Work, Grandma's…) per user
create table if not exists public.saved_locations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  label text not null,
  latitude decimal(9,6) not null,
  longitude decimal(9,6) not null,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists saved_locations_user_idx on public.saved_locations (user_id);
alter table public.saved_locations enable row level security;
drop policy if exists "users manage own locations" on public.saved_locations;
create policy "users manage own locations" on public.saved_locations for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Ensure only one primary per user via partial unique index
create unique index if not exists saved_locations_one_primary
  on public.saved_locations (user_id) where is_primary = true;
