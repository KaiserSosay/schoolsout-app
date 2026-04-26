-- Phase 3.5 — round 3 calendar import. Headline: The Growing Place
-- (Noah's family's own school) finally gets verified dates so mom-test
-- 2026-04-26's empty-page failure is closed.
--
-- Sources:
--   docs/plans/calendar-pdfs/the-growing-place-calendar-2025-2026.pdf
--     curated to docs/plans/calendar-pdfs/the-growing-place-calendar-2025-2026.extracted.json
--   docs/plans/calendar-pdfs/palmer-trinity-2025-2026.ics (live feed will sync nightly via cron)
--
-- DO NOT APPLY until Rasheid + Noah review the verification doc at
-- docs/plans/calendar-import-verification-2026-04-26-round3.md.
-- Rerunning is safe: idempotent on the closures unique index (added
-- in migration 029) and on the school UPDATE clauses.
--
-- Schools handled this round:
--   ✅ the-growing-place             (TGP — 17 high-confidence closures from official PDF)
--   ✅ palmer-trinity-school         (iCal feed URL only; nightly cron from migration 032
--                                     will populate closures within 24h of apply)
--   ✅ lehrman-community-day-school  (29 closures already imported by migration 029 —
--                                     only the calendar_status flip is new)
--
-- Schools NOT handled this round (flagged for follow-up):
--   - belen-jesuit-preparatory-school: source OCR text is grid-stripped
--     ("Apr NO CLASS" without dates). Needs vision-API parse — deferred.
--   - 10 round-3 schools (Carrollton, Christopher Columbus, Country Day,
--     Cushman, Hebrew Academy RASG, Lourdes, Beth Am, La Salle,
--     Immaculata-La Salle, St. Brendan): NOT in public.schools table at
--     all. Per the round-3 brief's "STOP and ask Rasheid before inserting
--     a new school" rule, these are blocked pending decision.

do $$
declare
  tgp_id uuid;
  palmer_id uuid;
  lehrman_id uuid;
begin
  select id into tgp_id from public.schools where slug = 'the-growing-place';
  if tgp_id is null then raise exception 'school slug the-growing-place not found — fix schools table first'; end if;

  select id into palmer_id from public.schools where slug = 'palmer-trinity-school';
  if palmer_id is null then raise exception 'school slug palmer-trinity-school not found — fix schools table first'; end if;

  select id into lehrman_id from public.schools where slug = 'lehrman-community-day-school';
  if lehrman_id is null then raise exception 'school slug lehrman-community-day-school not found — fix schools table first'; end if;

  -- TGP: clear out the 8 district-fanout closures stamped 'rejected' from
  -- an earlier MDCPS-pattern guess. They've never displayed correctly and
  -- they collide on (school_id, start_date, name) with names like "Labor
  -- Day" vs the official "School Closed for Labor Day" we're inserting.
  delete from public.closures
    where school_id = tgp_id
      and status = 'rejected';

  -- TGP: 17 verified closures from the official 2026-27 family calendar PDF.
  -- Source URL fields point at the public calendar landing page so any later
  -- audit can re-verify. school_year='2026-2027' for cross-year filtering.
  insert into public.closures (school_id, name, start_date, end_date, status, source, source_url, source_type, school_year, category, closed_for_students, is_early_release, confidence) values
    (tgp_id, 'First Day of School',                            '2026-08-18', '2026-08-18', 'verified', 'official_pdf', 'https://www.thegrowingplace.school/calendar', 'school_pdf', '2026-2027', 'first_day',         false, false, 'high'),
    (tgp_id, 'School Closed for Labor Day',                    '2026-09-07', '2026-09-07', 'verified', 'official_pdf', 'https://www.thegrowingplace.school/calendar', 'school_pdf', '2026-2027', 'holiday',           true,  false, 'high'),
    (tgp_id, 'Professional Development Day / School Closed',   '2026-10-09', '2026-10-09', 'verified', 'official_pdf', 'https://www.thegrowingplace.school/calendar', 'school_pdf', '2026-2027', 'teacher_workday',   true,  false, 'high'),
    (tgp_id, 'School Closed for Veterans Day',                 '2026-11-11', '2026-11-11', 'verified', 'official_pdf', 'https://www.thegrowingplace.school/calendar', 'school_pdf', '2026-2027', 'holiday',           true,  false, 'high'),
    (tgp_id, 'Noon Dismissal (pre-Thanksgiving)',              '2026-11-20', '2026-11-20', 'verified', 'official_pdf', 'https://www.thegrowingplace.school/calendar', 'school_pdf', '2026-2027', 'early_release',     false, true,  'high'),
    (tgp_id, 'Thanksgiving Break',                             '2026-11-23', '2026-11-27', 'verified', 'official_pdf', 'https://www.thegrowingplace.school/calendar', 'school_pdf', '2026-2027', 'break',             true,  false, 'high'),
    (tgp_id, 'Noon Dismissal (pre-Christmas Break)',           '2026-12-18', '2026-12-18', 'verified', 'official_pdf', 'https://www.thegrowingplace.school/calendar', 'school_pdf', '2026-2027', 'early_release',     false, true,  'high'),
    (tgp_id, 'Christmas Break',                                '2026-12-21', '2027-01-01', 'verified', 'official_pdf', 'https://www.thegrowingplace.school/calendar', 'school_pdf', '2026-2027', 'break',             true,  false, 'high'),
    (tgp_id, 'Teacher Work Day / School Closed',               '2027-01-04', '2027-01-04', 'verified', 'official_pdf', 'https://www.thegrowingplace.school/calendar', 'school_pdf', '2026-2027', 'teacher_workday',   true,  false, 'high'),
    (tgp_id, 'School Closed for MLK Day',                      '2027-01-18', '2027-01-18', 'verified', 'official_pdf', 'https://www.thegrowingplace.school/calendar', 'school_pdf', '2026-2027', 'holiday',           true,  false, 'high'),
    (tgp_id, 'Professional Development Day (February)',        '2027-02-12', '2027-02-12', 'verified', 'official_pdf', 'https://www.thegrowingplace.school/calendar', 'school_pdf', '2026-2027', 'teacher_workday',   true,  false, 'high'),
    (tgp_id, 'School Closed for Presidents Day',               '2027-02-15', '2027-02-15', 'verified', 'official_pdf', 'https://www.thegrowingplace.school/calendar', 'school_pdf', '2026-2027', 'holiday',           true,  false, 'high'),
    (tgp_id, 'Noon Dismissal (pre-Spring Break)',              '2027-03-19', '2027-03-19', 'verified', 'official_pdf', 'https://www.thegrowingplace.school/calendar', 'school_pdf', '2026-2027', 'early_release',     false, true,  'high'),
    (tgp_id, 'Spring Break',                                   '2027-03-22', '2027-03-26', 'verified', 'official_pdf', 'https://www.thegrowingplace.school/calendar', 'school_pdf', '2026-2027', 'break',             true,  false, 'high'),
    (tgp_id, 'School Closed for Easter Monday',                '2027-03-29', '2027-03-29', 'verified', 'official_pdf', 'https://www.thegrowingplace.school/calendar', 'school_pdf', '2026-2027', 'religious_holiday', true,  false, 'high'),
    (tgp_id, 'Noon Dismissal (mid-April)',                     '2027-04-16', '2027-04-16', 'verified', 'official_pdf', 'https://www.thegrowingplace.school/calendar', 'school_pdf', '2026-2027', 'early_release',     false, true,  'high'),
    (tgp_id, 'Last Day of School / Noon Dismissal',            '2027-05-27', '2027-05-27', 'verified', 'official_pdf', 'https://www.thegrowingplace.school/calendar', 'school_pdf', '2026-2027', 'last_day',          false, true,  'high')
  on conflict (school_id, start_date, name) do nothing;

  -- Palmer Trinity: stand the iCal feed up so the migration-032 nightly
  -- cron can sync closures within 24 hours of apply. The cron filters for
  -- closure-keyword SUMMARY tokens, so a 2,322-event Palmer feed will
  -- reduce to a sane closure set (sports games + lunches won't bleed
  -- through the keyword filter).
  update public.schools
    set ical_feed_url = 'https://www.palmertrinity.org/media/calendar/ical/Calendar?showhistory=true'
    where id = palmer_id and ical_feed_url is null;

  -- Status flips. TGP and Lehrman both go from needs_research →
  -- verified_current. (Lehrman already had its closures imported by
  -- migration 029; only the status flip is new here.)
  -- The unverified-school placeholder built last session triggers on
  -- "calendar_status NOT IN verified_*" → these flips drop the placeholder
  -- and surface the closures list on the public school pages.
  update public.schools
    set calendar_status = 'verified_current'
    where slug in ('the-growing-place', 'lehrman-community-day-school');

  -- Palmer Trinity stays at needs_research until the iCal sync cron lands
  -- closures. After the next 5am UTC tick we'd flip it manually (or via
  -- the new admin "Calendar verifications" tab once that ships).
end $$;
