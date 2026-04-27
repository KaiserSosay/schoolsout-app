-- Phase 4.7.x — bridge data for TGP's missing 2025-2026 calendar.
--
-- Pair migration: 044_tgp_federal_holidays_enum.sql adds the
-- 'derived' value to the closure_status enum that this migration
-- uses. Splitting the two is mandatory — Postgres rejects ALTER
-- TYPE ADD VALUE + a query that uses the new value within a single
-- transaction (SQLSTATE 55P04). Supabase runs each migration file
-- in its own transaction, so 044 commits before 045 starts.
--
-- TGP has 17 verified closures for 2026-2027 (migration 035) but
-- ZERO for the current 2025-2026 school year — the school's PDF
-- for the current year isn't published in a place we can read.
-- Until it is, we ship the federal-holiday subset every American
-- K-5 universally observes: Labor Day, Thanksgiving Day, Christmas
-- Day, New Year's Day, Memorial Day. Five rows, deterministic
-- dates, all attributed source=federal_holiday_calendar /
-- status=derived / confidence=medium.
--
-- Why only 5 of the 8 federal holidays? Small private K-5 schools
-- commonly stay open on Veterans Day, MLK Day, and Presidents'
-- Day. Importing those would create exactly the false-positive
-- class R6 was written to prevent — a "closed" pill on a day TGP
-- is actually open is the Water-Day bad-morning failure mode the
-- app exists to solve. The 5-date subset is the universally-
-- observed floor; the variable 3 wait for the school's actual PDF.
--
-- Schema notes (verified per R2 against the actual migration files):
--   * closure_status enum gains 'derived' in mig 044 (pair).
--   * source / source_type / confidence / category are unconstrained
--     text columns (mig 022), so the new string values write straight.
--   * Unique index closures_school_start_name_unique (mig 029) backs
--     the ON CONFLICT DO NOTHING — re-running is idempotent.
--
-- When the real PDF lands, mig 046+ imports it with source='official_pdf'
-- and the unique index either preserves or upgrades these rows
-- depending on name match. Bridge value is preserved through cutover.

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
