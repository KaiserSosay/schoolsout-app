-- Phase 2.7 — 96-camp research data drop: expand camps schema.
--
-- Purely additive (new nullable columns with defaults). No enum
-- changes, no UPDATEs. The research import script carries the data
-- in; the trigger from migration 017 will recompute data_completeness
-- on each touch so the admin dashboard stays accurate.
--
-- Note: the spec called this migration 020, but 020 was already used
-- for the page_views analytics table shipped in Goal 6. Renumbered.

alter table public.camps
  add column if not exists operator_name text,
  add column if not exists email text,
  add column if not exists city text,
  add column if not exists sessions jsonb default '[]',
  add column if not exists next_session_start_date date,
  add column if not exists breaks_covered text[] default '{}',
  add column if not exists single_day_available boolean,
  add column if not exists special_needs_friendly boolean,
  add column if not exists scholarships_available boolean,
  add column if not exists lunch_included boolean,
  add column if not exists accreditations text[] default '{}',
  add column if not exists licensing text,
  add column if not exists capacity int,
  add column if not exists price_notes text,
  add column if not exists data_source_url text,
  add column if not exists data_source_notes text,
  add column if not exists verified_fields text[] default '{}',
  add column if not exists out_of_primary_coverage boolean default false,
  add column if not exists needs_review boolean default false;

-- Convenience indexes for the public browse + admin filter.
create index if not exists idx_camps_neighborhood on public.camps(neighborhood);
create index if not exists idx_camps_verified_data_source on public.camps(verified, data_source);
create index if not exists idx_camps_next_session_start on public.camps(next_session_start_date);
