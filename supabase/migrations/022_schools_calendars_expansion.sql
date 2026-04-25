-- Phase 2.7+ data drop: extend schools + closures to absorb the 316-school
-- Miami-Dade research import (data/schools/miami-schools-research-2026-04-24.*)
-- and the M-DCPS district calendar fan-out (Approach A from the plan).
--
-- Additive only: every column is `add column if not exists`, every enum
-- value is added defensively. Nothing is dropped except the schools.slug
-- GENERATED expression (replaced with a regular text column so research-
-- chosen slugs like 'mdcps-district' can be inserted).
--
-- Existing closures from migration 012 stay intact; the import script
-- dedupes by (school_id, start_date, name) so re-running is safe.

------------------------------------------------------------------------------
-- 1. Expand school_type enum to cover all 7 research categories.
------------------------------------------------------------------------------
do $$ begin
  alter type school_type add value if not exists 'magnet';
exception when duplicate_object then null;
end $$;
do $$ begin
  alter type school_type add value if not exists 'preschool';
exception when duplicate_object then null;
end $$;
do $$ begin
  alter type school_type add value if not exists 'religious';
exception when duplicate_object then null;
end $$;
do $$ begin
  alter type school_type add value if not exists 'independent';
exception when duplicate_object then null;
end $$;

------------------------------------------------------------------------------
-- 2. Schools: relax NOT NULL on city/state, add research-shape columns.
--    Drop the GENERATED constraint on slug so explicit slugs are allowed.
------------------------------------------------------------------------------
-- Allow city to be NULL — research derives it from address but for some
-- schools (e.g. the synthetic district row) it's not meaningful.
alter table public.schools alter column city drop not null;
alter table public.schools alter column state set default 'FL';

-- Drop the GENERATED constraint added in migration 018; existing slug values
-- (auto-generated) are preserved as plain text.
alter table public.schools alter column slug drop expression if exists;

alter table public.schools
  add column if not exists short_name text,
  add column if not exists neighborhood text,
  add column if not exists grade_range_min text,
  add column if not exists grade_range_max text,
  add column if not exists email text,
  add column if not exists is_mdcps boolean not null default false,
  add column if not exists religious_affiliation text,
  add column if not exists enrollment_approx integer,
  add column if not exists district_calendar_slug text,
  add column if not exists early_release_pattern text,
  add column if not exists data_source text default 'manual-curated',
  add column if not exists data_source_url text,
  add column if not exists data_source_notes text,
  add column if not exists verified_fields text[] default '{}',
  add column if not exists last_verified_at timestamptz,
  add column if not exists last_contacted_for_calendar_at timestamptz,
  add column if not exists last_contacted_by uuid references public.users(id);

create index if not exists idx_schools_type
  on public.schools(type);
create index if not exists idx_schools_district_calendar_slug
  on public.schools(district_calendar_slug)
  where district_calendar_slug is not null;
create index if not exists idx_schools_is_mdcps
  on public.schools(is_mdcps);
create index if not exists idx_schools_calendar_status
  on public.schools(calendar_status);

------------------------------------------------------------------------------
-- 3. Closures: add research-shape columns + the district fan-out marker.
------------------------------------------------------------------------------
alter table public.closures
  add column if not exists school_year text,
  add column if not exists category text,
  add column if not exists day_count integer,
  add column if not exists closed_for_students boolean not null default true,
  add column if not exists closed_for_staff boolean,
  add column if not exists is_early_release boolean not null default false,
  add column if not exists source_type text,
  add column if not exists confidence text,
  add column if not exists derived_from_district boolean not null default false;

create index if not exists idx_closures_school_year
  on public.closures(school_year);
create index if not exists idx_closures_start_date
  on public.closures(start_date);
create index if not exists idx_closures_school_id_year
  on public.closures(school_id, school_year);
create index if not exists idx_closures_derived_from_district
  on public.closures(derived_from_district)
  where derived_from_district = true;

-- Backfill school_year on the closures migration 012 already seeded so
-- they sort + group consistently with the imported rows.
update public.closures set school_year = '2025-2026'
 where school_year is null
   and start_date >= '2025-07-01' and start_date <= '2026-06-30';
update public.closures set school_year = '2026-2027'
 where school_year is null
   and start_date >= '2026-07-01' and start_date <= '2027-06-30';

------------------------------------------------------------------------------
-- 4. Free up the 'riviera-schools' slug so research can install
--    riviera-day-school + riviera-preparatory-school as separate rows.
--    The legacy combined row stays for audit; URLs that pointed at it
--    are unlikely (it had no closures), and the import script will set
--    one of the two new rows as the canonical Riviera entry.
------------------------------------------------------------------------------
update public.schools
set slug = 'riviera-schools-legacy'
where id = '00000000-0000-0000-0000-000000000008'
  and slug = 'riviera-schools';

------------------------------------------------------------------------------
-- 5. Public-pages support (Phase 2.7.2):
--    - follows_district_pattern: admin-set hint that a non-MDCPS school is
--      believed to follow the district calendar. Drives the amber "These are
--      MDCPS dates, this school may differ" banner on the unofficial template.
--      Defaults to false so we never imply a match we can't back up.
--    - unofficial_disclaimer_dismissed_at: opt-out marker if a school admin
--      asks us to drop the "unofficial" framing on their listing.
--    - closed_permanently: keeps closed schools off the sitemap + index. We
--      keep the row for ID stability (it may still be referenced from old
--      closures or saved plans) but stop SEO-promoting it.
------------------------------------------------------------------------------
alter table public.schools
  add column if not exists follows_district_pattern boolean not null default false,
  add column if not exists unofficial_disclaimer_dismissed_at timestamptz,
  add column if not exists closed_permanently boolean not null default false;

create index if not exists idx_schools_closed_permanently
  on public.schools(closed_permanently)
  where closed_permanently = false;
