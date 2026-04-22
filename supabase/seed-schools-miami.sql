-- Miami schools seed — 9 additional schools (10 total with existing Growing Place).
-- Idempotent: on conflict (id) do nothing.
--
-- DECISION: We do NOT seed approximate `ai_draft` closures for the 9 new schools.
-- The parent task permits either answer; fabricating even "approximate" school
-- calendar dates risks giving parents wrong information if UI accidentally
-- rendered them without the ⚠️ flag. Leaving the new schools with zero
-- closures is the honest default; Subagent B/C will show "No closures yet —
-- we're verifying the calendar" rather than made-up dates. Verified calendars
-- can be imported later via the existing AI ingest pipeline.

insert into public.schools (id, name, district, city, state, type) values
  ('00000000-0000-0000-0000-000000000002', 'Coral Gables Preparatory Academy', 'Miami-Dade Public',     'Miami', 'FL', 'charter'),
  ('00000000-0000-0000-0000-000000000003', 'Miami-Dade County Public Schools', 'Miami-Dade Public',     'Miami', 'FL', 'public'),
  ('00000000-0000-0000-0000-000000000004', 'Gulliver Preparatory School',      'Miami-Dade Private',    'Miami', 'FL', 'private'),
  ('00000000-0000-0000-0000-000000000005', 'Ransom Everglades School',         'Miami-Dade Private',    'Miami', 'FL', 'private'),
  ('00000000-0000-0000-0000-000000000006', 'Palmer Trinity School',            'Miami-Dade Private',    'Miami', 'FL', 'private'),
  ('00000000-0000-0000-0000-000000000007', 'Belen Jesuit Preparatory School',  'Miami-Dade Private',    'Miami', 'FL', 'private'),
  ('00000000-0000-0000-0000-000000000008', 'Riviera Schools',                  'Miami-Dade Private',    'Miami', 'FL', 'private'),
  ('00000000-0000-0000-0000-000000000009', 'Westminster Christian School',     'Miami-Dade Private',    'Miami', 'FL', 'private'),
  ('00000000-0000-0000-0000-000000000010', 'Miami Catholic Schools (diocesan)','Archdiocese of Miami',  'Miami', 'FL', 'private')
on conflict (id) do nothing;
