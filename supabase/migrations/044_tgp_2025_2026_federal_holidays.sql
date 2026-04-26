-- Phase 4.7.x — bridge data for TGP's missing 2025-2026 calendar.
--
-- TGP has 17 verified closures for 2026-2027 (migration 035) but ZERO
-- for the current 2025-2026 school year — the school's PDF for the
-- current year isn't published in a place we can read. Until it is,
-- we ship the federal-holiday subset that ALL American K-5 schools
-- universally observe: Labor Day, Thanksgiving Day, Christmas Day,
-- New Year's Day, Memorial Day. Five dates, deterministic math, all
-- attributed as `derived` from the federal holiday calendar.
--
-- Why not the full 8 (Veterans Day, MLK Day, Presidents' Day too)?
-- Small private K-5 schools commonly stay open on those three. Per
-- R6, false positives destroy trust — a "closed" pill on a day TGP
-- is actually open is the exact Water-Day failure mode the app
-- exists to prevent. The 5-date subset is the universally-observed
-- floor; the variable 3 wait for Mom's PDF tomorrow.
--
-- When the real PDF lands and migration 045 imports it with
-- source='official_pdf', the unique index on (school_id, start_date,
-- name) lets ON CONFLICT DO NOTHING preserve these rows if the PDF
-- repeats them, or upgrade them if the names match exactly. Either
-- way the bridge value is preserved through cutover.
--
-- Schema notes (per R2, verified before writing):
--   * closure_status enum (mig 001) only had ai_draft|verified|rejected.
--     Extended here to include 'derived' so federal-holiday rows are
--     filterable + visually differentiable from school-confirmed.
--   * source / source_type / confidence / category are all unconstrained
--     text columns (mig 022 added them as `add column if not exists`),
--     so the new string values write without further constraint changes.
--   * Unique index closures_school_start_name_unique (mig 029) backs
--     ON CONFLICT.

alter type closure_status add value if not exists 'derived';

-- ALTER TYPE ADD VALUE can't run in the same transaction as a query
-- that uses the new value on some Postgres versions. Supabase's
-- migrate runner applies each migration as its own statement-batch,
-- which is fine — but to belt-and-suspender it, the inserts go in
-- a DO block that re-resolves the enum at exec time.

do $$
declare
  tgp_id uuid;
begin
  select id into tgp_id from public.schools where slug = 'the-growing-place';
  if tgp_id is null then
    raise exception 'school slug the-growing-place not found — fix schools table first';
  end if;

  insert into public.closures (
    school_id, name, start_date, end_date, status, source, source_type,
    school_year, category, closed_for_students, is_early_release, confidence
  ) values
    (tgp_id, 'Labor Day - Federal Holiday', '2025-09-01', '2025-09-01',
      'derived', 'federal_holiday_calendar', 'derived',
      '2025-2026', 'federal_holiday', true, false, 'medium'),
    (tgp_id, 'Thanksgiving Day - Federal Holiday', '2025-11-27', '2025-11-27',
      'derived', 'federal_holiday_calendar', 'derived',
      '2025-2026', 'federal_holiday', true, false, 'medium'),
    (tgp_id, 'Christmas Day - Federal Holiday', '2025-12-25', '2025-12-25',
      'derived', 'federal_holiday_calendar', 'derived',
      '2025-2026', 'federal_holiday', true, false, 'medium'),
    (tgp_id, 'New Year''s Day - Federal Holiday', '2026-01-01', '2026-01-01',
      'derived', 'federal_holiday_calendar', 'derived',
      '2025-2026', 'federal_holiday', true, false, 'medium'),
    (tgp_id, 'Memorial Day - Federal Holiday', '2026-05-25', '2026-05-25',
      'derived', 'federal_holiday_calendar', 'derived',
      '2025-2026', 'federal_holiday', true, false, 'medium')
  on conflict (school_id, start_date, name) do nothing;
end $$;

do $$
declare
  inserted_count int;
  tgp_id uuid;
begin
  select id into tgp_id from public.schools where slug = 'the-growing-place';
  select count(*) into inserted_count from public.closures
    where school_id = tgp_id
      and school_year = '2025-2026'
      and source = 'federal_holiday_calendar';

  raise notice 'TGP 2025-2026 federal holidays present: %', inserted_count;

  if inserted_count != 5 then
    raise warning 'Expected 5 federal holiday rows for TGP, got %', inserted_count;
  end if;
end $$;
