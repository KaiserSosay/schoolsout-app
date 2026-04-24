-- Phase 2.7 Goal 1: Data completeness scoring on camps.
--
-- Adds data_completeness (0.00–1.00) + missing_fields[] + last_enriched_at
-- columns, plus a BEFORE INSERT/UPDATE trigger that keeps them current
-- without the app having to recompute anything. Backfill touches every
-- existing row so the initial scores are populated at migration time.
--
-- Field set (12 total): phone, address, website_url, ages_min, ages_max,
-- hours (start+end, counted as one slot), price (min+max, counted as one),
-- description (>40 chars), categories (at least one), registration_url,
-- registration_deadline. Spec called this "hours_core" + "price" — the
-- underlying schema uses hours_start/hours_end and price_min_cents/
-- price_max_cents, so each pair counts as one filled field when BOTH are
-- present (partial data is not counted).

alter table public.camps
  add column if not exists data_completeness numeric(3,2) default 0.0,
  add column if not exists missing_fields text[] default '{}',
  add column if not exists last_enriched_at timestamptz;

create or replace function public.calc_camp_completeness(c public.camps)
returns numeric
language plpgsql
immutable
as $$
declare
  total int := 10;
  filled int := 0;
begin
  if c.phone is not null then filled := filled + 1; end if;
  if c.address is not null then filled := filled + 1; end if;
  if c.website_url is not null then filled := filled + 1; end if;
  if c.ages_min is not null and c.ages_max is not null then filled := filled + 1; end if;
  if c.hours_start is not null and c.hours_end is not null then filled := filled + 1; end if;
  if c.price_min_cents is not null and c.price_max_cents is not null then filled := filled + 1; end if;
  if c.description is not null and length(c.description) > 40 then filled := filled + 1; end if;
  if c.categories is not null and array_length(c.categories, 1) > 0 then filled := filled + 1; end if;
  if c.registration_url is not null then filled := filled + 1; end if;
  if c.registration_deadline is not null then filled := filled + 1; end if;
  return round(filled::numeric / total, 2);
end;
$$;

create or replace function public.camp_missing_fields(c public.camps)
returns text[]
language plpgsql
immutable
as $$
declare
  m text[] := '{}';
begin
  if c.phone is null then m := array_append(m, 'phone'); end if;
  if c.address is null then m := array_append(m, 'address'); end if;
  if c.website_url is null then m := array_append(m, 'website_url'); end if;
  if c.ages_min is null or c.ages_max is null then m := array_append(m, 'ages'); end if;
  if c.hours_start is null or c.hours_end is null then m := array_append(m, 'hours'); end if;
  if c.price_min_cents is null or c.price_max_cents is null then m := array_append(m, 'price'); end if;
  if c.description is null or length(c.description) <= 40 then m := array_append(m, 'description'); end if;
  if c.categories is null or array_length(c.categories, 1) is null then m := array_append(m, 'categories'); end if;
  if c.registration_url is null then m := array_append(m, 'registration_url'); end if;
  if c.registration_deadline is null then m := array_append(m, 'registration_deadline'); end if;
  return m;
end;
$$;

create or replace function public.trg_update_camp_completeness()
returns trigger
language plpgsql
as $$
begin
  new.data_completeness := public.calc_camp_completeness(new);
  new.missing_fields := public.camp_missing_fields(new);
  return new;
end;
$$;

drop trigger if exists camps_completeness on public.camps;
create trigger camps_completeness
  before insert or update on public.camps
  for each row execute function public.trg_update_camp_completeness();

-- Backfill deliberately OMITTED from this migration.
--
-- A backfill would be `update public.camps set updated_at = updated_at` to
-- fire the trigger on every row and populate data_completeness +
-- missing_fields for existing camps. That's an UPDATE against existing
-- rows, which the overnight ground rules require explicit approval for.
-- The net effect would be to populate only the two newly-added columns
-- (no other data changed), but we defer the statement for Rasheid to
-- review + run.
--
-- Until backfill runs:
--   - Existing 58 camps have data_completeness=0.0 and missing_fields='{}'
--     (column DEFAULTs).
--   - The app + admin compute completeness client-side via the mirrored TS
--     helper in src/lib/camps/completeness.ts so the UI is correct
--     regardless of stored values.
--   - Camps touched by future INSERT/UPDATE (e.g. the enrichment script
--     UPDATEs approved for phone/address/website/hours) get accurate
--     stored values via the trigger.
