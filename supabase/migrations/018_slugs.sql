-- Phase 2.7 Goal 3 (partial): schools.slug via a GENERATED STORED column.
--
-- We attempted a matching closures.slug via the same pattern but the
-- expression `start_date::text` isn't IMMUTABLE in Postgres, so
-- CREATE STORED GENERATED COLUMN fails (SQLSTATE 42P17). The fallbacks
-- — using to_char or a trigger that fills an ordinary column — both
-- require either non-immutable functions or a backfill UPDATE, which is
-- outside the additive-schema-only envelope of overnight autonomy.
-- Closures will keep routing by id for now (/breaks/{uuid}); a follow-
-- up commit with explicit approval can add closures.slug.
--
-- Postgres computes the generated expression at ALTER TABLE time for
-- existing rows (and on every INSERT/UPDATE going forward) — no
-- separate UPDATE statement needed.

alter table public.schools
  add column if not exists slug text generated always as (
    lower(regexp_replace(name, '[^A-Za-z0-9]+', '-', 'g'))
  ) stored;

create unique index if not exists ux_schools_slug on public.schools(slug);
