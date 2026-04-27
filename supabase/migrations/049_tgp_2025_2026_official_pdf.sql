-- Phase 4.x — replace the 5 derived federal-holiday placeholder rows
-- (migration 045) with the full TGP 2025-2026 Family Calendar from
-- the school's own published PDF.
--
-- Source:    https://www.thegrowingplace.school/campus-life
-- File:      docs/plans/calendar-pdfs/the-growing-place-2025-2026.pdf
-- Captured:  2026-04-26 by Rasheid
-- Header:    "FAMILY CALENDAR 2025-26"
-- Legend:
--   * NO SCHOOL (green) ........... full closure
--   * NOON DISMISSAL (teal) ....... early-release
--   * PARENT-TEACHER CONFERENCES
--     NO CLASSES (yellow) ......... full closure
--   * SPECIAL NOTIFICATIONS
--     (peach) ..................... NOT imported (school in session)
--
-- Strategy: delete the 5 derived rows first (clean replacement),
-- then insert 25 school-confirmed rows. ON CONFLICT DO NOTHING on
-- the inserts protects against double-runs.
--
-- Scope (R5 + R4): the DELETE is filtered narrowly — same school,
-- same school_year, same source — so it can't reach into other
-- migrations' verified data. The 17 existing 2026-2027 rows from
-- migration 035 are a different school_year and untouched.

do $$
declare
  tgp_id uuid;
  derived_deleted int;
  inserted_count int;
begin
  select id into tgp_id from public.schools where slug = 'the-growing-place';
  if tgp_id is null then
    raise exception 'TGP school row not found';
  end if;

  -- Step A: Remove the 5 derived federal-holiday placeholder rows.
  delete from public.closures
    where school_id = tgp_id
      and school_year = '2025-2026'
      and source = 'federal_holiday_calendar';
  get diagnostics derived_deleted = row_count;
  raise notice 'Removed % derived federal-holiday rows (expected 5)', derived_deleted;

  -- Step B: Insert 25 verified rows from the official PDF.
  insert into public.closures (
    school_id, name, start_date, end_date, status, source, source_type,
    school_year, category, closed_for_students, is_early_release, confidence
  ) values
    -- AUGUST 2025
    (tgp_id, 'First Day of School', '2025-08-19', '2025-08-19', 'verified', 'official_pdf', 'school_pdf', '2025-2026', 'first_day', false, false, 'high'),

    -- SEPTEMBER 2025
    (tgp_id, 'School Closed for Labor Day', '2025-09-01', '2025-09-01', 'verified', 'official_pdf', 'school_pdf', '2025-2026', 'federal_holiday', true, false, 'high'),

    -- OCTOBER 2025
    (tgp_id, 'School Closed for Professional Development Day', '2025-10-03', '2025-10-03', 'verified', 'official_pdf', 'school_pdf', '2025-2026', 'teacher_workday', true, false, 'high'),
    (tgp_id, 'Fall Fantasy Event - Noon Dismissal', '2025-10-31', '2025-10-31', 'verified', 'official_pdf', 'school_pdf', '2025-2026', 'other', false, true, 'high'),

    -- NOVEMBER 2025
    (tgp_id, 'School Closed for Veterans Day', '2025-11-11', '2025-11-11', 'verified', 'official_pdf', 'school_pdf', '2025-2026', 'federal_holiday', true, false, 'high'),
    (tgp_id, 'Noon Dismissal / Teacher Work Afternoon', '2025-11-21', '2025-11-21', 'verified', 'official_pdf', 'school_pdf', '2025-2026', 'teacher_workday', false, true, 'high'),
    (tgp_id, 'Thanksgiving Break', '2025-11-24', '2025-11-28', 'verified', 'official_pdf', 'school_pdf', '2025-2026', 'break', true, false, 'high'),

    -- DECEMBER 2025
    (tgp_id, 'Parent-Teacher Conferences (No Classes)', '2025-12-05', '2025-12-05', 'verified', 'official_pdf', 'school_pdf', '2025-2026', 'parent_conference', true, false, 'high'),
    (tgp_id, 'Last Day of Kids Club', '2025-12-18', '2025-12-18', 'verified', 'official_pdf', 'school_pdf', '2025-2026', 'other', false, false, 'high'),
    (tgp_id, 'Christmas Service / Noon Dismissal', '2025-12-19', '2025-12-19', 'verified', 'official_pdf', 'school_pdf', '2025-2026', 'religious_holiday', false, true, 'high'),
    (tgp_id, 'Christmas Break', '2025-12-22', '2026-01-02', 'verified', 'official_pdf', 'school_pdf', '2025-2026', 'break', true, false, 'high'),

    -- JANUARY 2026
    (tgp_id, 'School Closed - Professional Development Day', '2026-01-05', '2026-01-05', 'verified', 'official_pdf', 'school_pdf', '2025-2026', 'teacher_workday', true, false, 'high'),
    (tgp_id, 'School Closed for MLK Day', '2026-01-19', '2026-01-19', 'verified', 'official_pdf', 'school_pdf', '2025-2026', 'federal_holiday', true, false, 'high'),

    -- FEBRUARY 2026
    (tgp_id, 'Noon Dismissal / Teacher Work Afternoon', '2026-02-13', '2026-02-13', 'verified', 'official_pdf', 'school_pdf', '2025-2026', 'teacher_workday', false, true, 'high'),
    (tgp_id, 'School Closed for Presidents'' Day', '2026-02-16', '2026-02-16', 'verified', 'official_pdf', 'school_pdf', '2025-2026', 'federal_holiday', true, false, 'high'),

    -- MARCH 2026
    (tgp_id, 'Noon Dismissal', '2026-03-20', '2026-03-20', 'verified', 'official_pdf', 'school_pdf', '2025-2026', 'other', false, true, 'high'),
    (tgp_id, 'Spring Break', '2026-03-23', '2026-03-27', 'verified', 'official_pdf', 'school_pdf', '2025-2026', 'break', true, false, 'high'),

    -- APRIL 2026
    (tgp_id, 'Noon Dismissal / Teacher Work Afternoon', '2026-04-02', '2026-04-02', 'verified', 'official_pdf', 'school_pdf', '2025-2026', 'teacher_workday', false, true, 'high'),
    (tgp_id, 'School Closed for Good Friday', '2026-04-03', '2026-04-03', 'verified', 'official_pdf', 'school_pdf', '2025-2026', 'religious_holiday', true, false, 'high'),
    (tgp_id, 'School Closed for Easter Monday', '2026-04-06', '2026-04-06', 'verified', 'official_pdf', 'school_pdf', '2025-2026', 'religious_holiday', true, false, 'high'),

    -- MAY 2026
    (tgp_id, 'Parent-Teacher Conferences (No Classes)', '2026-05-01', '2026-05-01', 'verified', 'official_pdf', 'school_pdf', '2025-2026', 'parent_conference', true, false, 'high'),
    (tgp_id, 'Noon Dismissal / Teacher Work Afternoon', '2026-05-22', '2026-05-22', 'verified', 'official_pdf', 'school_pdf', '2025-2026', 'teacher_workday', false, true, 'high'),
    (tgp_id, 'School Closed for Memorial Day', '2026-05-25', '2026-05-25', 'verified', 'official_pdf', 'school_pdf', '2025-2026', 'federal_holiday', true, false, 'high'),
    (tgp_id, 'Last Day of Kids Club', '2026-05-27', '2026-05-27', 'verified', 'official_pdf', 'school_pdf', '2025-2026', 'other', false, false, 'high'),
    (tgp_id, 'Last Day of School - Noon Dismissal', '2026-05-28', '2026-05-28', 'verified', 'official_pdf', 'school_pdf', '2025-2026', 'last_day', false, true, 'high')
  on conflict (school_id, start_date, name) do nothing;

  get diagnostics inserted_count = row_count;
  raise notice 'TGP 2025-2026 verified rows inserted: % (expected up to 25)', inserted_count;

  -- Step C: TGP now has both 2025-2026 and 2026-2027 verified — flip
  -- the calendar_status to verified_multi_year and stamp last_synced_at.
  update public.schools
    set calendar_status = 'verified_multi_year',
        last_synced_at = now()
    where slug = 'the-growing-place';
end $$;

-- Final verification block — counts what we expect to see post-migration.
do $$
declare
  total_2025_26 int;
  derived_remaining int;
  tgp_id uuid;
begin
  select id into tgp_id from public.schools where slug = 'the-growing-place';

  select count(*) into total_2025_26 from public.closures
    where school_id = tgp_id
      and school_year = '2025-2026';

  select count(*) into derived_remaining from public.closures
    where school_id = tgp_id
      and school_year = '2025-2026'
      and source = 'federal_holiday_calendar';

  raise notice 'TGP 2025-2026 total closures: % (expected 25)', total_2025_26;
  raise notice 'TGP 2025-2026 derived rows remaining: % (expected 0)', derived_remaining;

  if derived_remaining > 0 then
    raise warning 'Derived rows still present after replacement!';
  end if;
  if total_2025_26 != 25 then
    raise warning 'Expected 25 rows for 2025-2026, got %', total_2025_26;
  end if;
end $$;
