-- Phase 5.0 — Calendar View — semantic closure type for visual styling.
-- Adds closures.closure_type so the new month-grid Calendar View can
-- color-code days by reason (federal holiday vs long break vs teacher
-- workday vs religious vs early dismissal vs weather). Existing read
-- paths ignore the column; the calendar UI also derives the value
-- client-side from `name` when this column is missing or null, so
-- shipping the UI does not depend on this migration being applied.
--
-- Schema-defensive principle (mom-test 2026-04-26): never break the
-- public school page on un-migrated DBs. The column adds with a default
-- of 'other' and is nullable; backfill below only flips rows whose
-- name matches a well-known pattern. Re-running is a no-op.
--
-- NOT APPLIED at commit time. Dad applies via:
--   pnpm exec supabase db push --include-all

-- ---------------------------------------------------------------
-- 1. Column
-- ---------------------------------------------------------------

ALTER TABLE public.closures
  ADD COLUMN IF NOT EXISTS closure_type text;

COMMENT ON COLUMN public.closures.closure_type IS
  'Phase 5.0 Calendar View: federal_holiday | long_break | teacher_workday | religious | early_dismissal | weather | other. Used purely for visual styling on the month grid; null is safe and falls back to client-side name pattern matching.';

-- ---------------------------------------------------------------
-- 2. Index — the month grid filters by school + date range and reads
--    closure_type, so a partial covering index keeps the existing
--    closures_school_date_status_idx the primary, and adds a small
--    helper for closure_type-aware queries when present.
-- ---------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_closures_closure_type
  ON public.closures(closure_type)
 WHERE closure_type IS NOT NULL;

-- ---------------------------------------------------------------
-- 3. Backfill — derive type from existing closure name patterns.
--    Bounded WHERE clauses so the migration is safely re-runnable
--    and never overwrites a value that was already set by a future
--    write path.
-- ---------------------------------------------------------------

-- 3a. Federal holidays — a clear list, no ambiguity.
UPDATE public.closures
   SET closure_type = 'federal_holiday'
 WHERE closure_type IS NULL
   AND (
        name ILIKE '%memorial day%'
     OR name ILIKE '%labor day%'
     OR name ILIKE '%columbus day%'
     OR name ILIKE '%indigenous peoples%'
     OR name ILIKE '%veterans day%'
     OR name ILIKE '%thanksgiving day%'
     OR name = 'Thanksgiving'
     OR name ILIKE '%new year%day%'
     OR name = 'New Year''s Day'
     OR name ILIKE '%martin luther king%'
     OR name ILIKE 'mlk%'
     OR name ILIKE '%presidents day%'
     OR name ILIKE '%president''s day%'
     OR name ILIKE '%juneteenth%'
     OR name ILIKE '%independence day%'
     OR name ILIKE '%fourth of july%'
     OR name ILIKE '%july 4%'
   );

-- 3b. Long breaks — multi-day vacation periods.
UPDATE public.closures
   SET closure_type = 'long_break'
 WHERE closure_type IS NULL
   AND (
        name ILIKE '%winter break%'
     OR name ILIKE '%winter recess%'
     OR name ILIKE '%christmas break%'
     OR name ILIKE '%spring break%'
     OR name ILIKE '%spring recess%'
     OR name ILIKE '%summer break%'
     OR name ILIKE '%summer vacation%'
     OR name ILIKE '%fall break%'
     OR name ILIKE '%thanksgiving break%'
     OR name ILIKE '%thanksgiving recess%'
   );

-- 3c. Teacher workdays / planning days.
UPDATE public.closures
   SET closure_type = 'teacher_workday'
 WHERE closure_type IS NULL
   AND (
        name ILIKE '%teacher planning%'
     OR name ILIKE '%teacher workday%'
     OR name ILIKE '%teacher work day%'
     OR name ILIKE '%professional development%'
     OR name ILIKE '%staff development%'
     OR name ILIKE '%pd day%'
     OR name ILIKE '%inservice%'
     OR name ILIKE '%in-service%'
   );

-- 3d. Religious observances (commonly observed by Miami-Dade schools).
UPDATE public.closures
   SET closure_type = 'religious'
 WHERE closure_type IS NULL
   AND (
        name ILIKE '%good friday%'
     OR name ILIKE '%yom kippur%'
     OR name ILIKE '%rosh hashanah%'
     OR name ILIKE '%passover%'
     OR name ILIKE '%easter%'
     OR name ILIKE '%eid%'
   );

-- 3e. Early dismissal (kind=half_day from migration 062 also flags this,
--     but a name-based fallback covers rows that pre-date kind).
UPDATE public.closures
   SET closure_type = 'early_dismissal'
 WHERE closure_type IS NULL
   AND (
        name ILIKE '%early dismissal%'
     OR name ILIKE '%early release%'
     OR name ILIKE '%half day%'
     OR name ILIKE '%half-day%'
   );

-- 3f. Everything else falls back to 'other' so the column has a value
--     for every existing row (cleaner ANALYZE + simpler UI checks).
UPDATE public.closures
   SET closure_type = 'other'
 WHERE closure_type IS NULL;
