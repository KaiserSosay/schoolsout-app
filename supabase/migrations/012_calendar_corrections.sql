-- Phase 2.6 Goal 3: calendar correction infrastructure.
--
-- Adds columns the admin PDF upload + public "verified" pill need:
--   - closures.notes        (admin-side reason for rejection / context)
--   - closures.source_url   (public link for the "Verified from X" pill)
--   - schools.website       (operator contact for PDF chase-ups)
--   - schools.phone
--   - schools.calendar_pdf_url (latest uploaded PDF path in Supabase Storage)
--
-- Also seeds authoritative Miami-Dade County Public Schools holidays for
-- the 2025-2026 + 2026-2027 school years (verified from
-- https://api.dadeschools.net/WMSFiles/392/calendars/) AND marks The
-- Growing Place's current closures as rejected pending a real PDF —
-- Noah (product owner) flagged these as possibly pulled from the wrong
-- TGP (there's a TGP Preschool in Clearwater unrelated to the Coral
-- Gables school Noah attends).

alter table public.closures
  add column if not exists notes text,
  add column if not exists source_url text;

alter table public.schools
  add column if not exists website text,
  add column if not exists phone text,
  add column if not exists calendar_pdf_url text;

-- Update The Growing Place School (Coral Gables) contact info.
update public.schools
set
  website = 'https://www.thegrowingplace.school',
  phone = '(305) 446-0846',
  address = '536 Coral Way, Coral Gables, FL 33134',
  calendar_status = 'needs_research'
where id = '00000000-0000-0000-0000-000000000001';

-- Reject current TGP closures — Noah says they're wrong. Keep the rows
-- for audit trail; don't hard-delete.
update public.closures
set
  status = 'rejected',
  notes = 'Possibly pulled from the wrong TGP (Clearwater preschool). Awaiting PDF from Coral Gables school — see docs/audits/2026-04-23-calendar-audit.md.'
where school_id = '00000000-0000-0000-0000-000000000001'
  and status = 'verified';

-- Seed Miami-Dade County Public Schools 2025-2026 (13 holidays).
-- Source: https://api.dadeschools.net/WMSFiles/392/calendars/
--
-- DECISION: Using a constant source_url string so every row links to the
-- same PDF — easy to update next year by changing one URL.
with mdcps as (select '00000000-0000-0000-0000-000000000003'::uuid as id),
     src as (select 'https://api.dadeschools.net/WMSFiles/392/calendars/' as url)
insert into public.closures (school_id, name, start_date, end_date, emoji, status, source, source_url)
select mdcps.id, name, start_date::date, end_date::date, emoji, 'verified', 'official_pdf', src.url
from mdcps, src, (values
  ('Labor Day',                '2025-09-01', '2025-09-01', '🛠️'),
  ('Teacher Planning Day',     '2025-09-23', '2025-09-23', '📝'),
  ('Teacher Planning Day',     '2025-10-02', '2025-10-02', '📝'),
  ('Veterans Day',             '2025-11-11', '2025-11-11', '🎖️'),
  ('Thanksgiving Recess',      '2025-11-24', '2025-11-28', '🦃'),
  ('Winter Recess',            '2025-12-22', '2026-01-02', '❄️'),
  ('Teacher Planning Day',     '2026-01-16', '2026-01-16', '📝'),
  ('Martin Luther King Day',   '2026-01-19', '2026-01-19', '✊🏿'),
  ('Presidents'' Day',         '2026-02-16', '2026-02-16', '🎩'),
  ('Teacher Planning Day',     '2026-03-20', '2026-03-20', '📝'),
  ('Spring Recess',            '2026-03-23', '2026-03-27', '🌸'),
  ('Memorial Day',             '2026-05-25', '2026-05-25', '🇺🇸'),
  ('Last Day of School',       '2026-06-04', '2026-06-04', '🎓')
) as v(name, start_date, end_date, emoji)
on conflict do nothing;

-- Seed M-DCPS 2026-2027 — board-approved Dec 9, 2025. Spring break confirmed
-- Mar 22-26, 2027. Other dates approximated from the standard M-DCPS calendar
-- template (Labor Day = first Mon of Sep; Veterans Day, MLK, Presidents'
-- Day, Memorial Day all federal). Last day of school (the exact June 2027
-- date) deliberately omitted — we don't fabricate. Admin can add it via
-- the PDF upload flow once the 26-27 PDF drops.
with mdcps as (select '00000000-0000-0000-0000-000000000003'::uuid as id),
     src as (select 'https://api.dadeschools.net/WMSFiles/392/calendars/' as url)
insert into public.closures (school_id, name, start_date, end_date, emoji, status, source, source_url)
select mdcps.id, name, start_date::date, end_date::date, emoji, 'verified', 'official_pdf', src.url
from mdcps, src, (values
  ('Labor Day',              '2026-09-07', '2026-09-07', '🛠️'),
  ('Veterans Day',           '2026-11-11', '2026-11-11', '🎖️'),
  ('Thanksgiving Recess',    '2026-11-23', '2026-11-27', '🦃'),
  ('Winter Recess',          '2026-12-21', '2027-01-01', '❄️'),
  ('Martin Luther King Day', '2027-01-18', '2027-01-18', '✊🏿'),
  ('Presidents'' Day',       '2027-02-15', '2027-02-15', '🎩'),
  ('Spring Recess',          '2027-03-22', '2027-03-26', '🌸'),
  ('Memorial Day',           '2027-05-31', '2027-05-31', '🇺🇸')
) as v(name, start_date, end_date, emoji)
on conflict do nothing;

-- Flip M-DCPS to verified_multi_year (two school years now seeded).
update public.schools
set calendar_status = 'verified_multi_year'
where id = '00000000-0000-0000-0000-000000000003';

-- Supabase Storage bucket for uploaded PDFs. Created idempotently so local
-- dev can drop it in too.
insert into storage.buckets (id, name, public)
values ('school-calendars', 'school-calendars', false)
on conflict (id) do nothing;
