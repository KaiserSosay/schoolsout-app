-- Phase 3.1 — operator-editable columns on camps that previously only lived
-- on camp_applications (added by 019). The operator dashboard shipping in
-- this branch lets owners fill these in over time, so the camps row needs
-- the same shape as the application form.
--
-- Additive only. No data writes; existing rows get NULL / default '{}'
-- and the data_completeness trigger picks them up on next save.

alter table public.camps
  add column if not exists scholarships_notes text,
  add column if not exists accommodations text,
  add column if not exists photo_urls text[] default '{}';
