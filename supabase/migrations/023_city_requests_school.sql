-- Phase 3.0 / Item 3.6: capture the requester's kid's school on the
-- /cities form. Additive only — new nullable column with no backfill.
--
-- Existing rows stay valid (school is NULL for any submission before
-- this migration). Future rows from the landing form's optional input
-- populate it; admin's request-triage view surfaces it inline.

alter table public.city_requests
  add column if not exists school text;

create index if not exists idx_city_requests_school
  on public.city_requests(school)
  where school is not null;
