-- Phase 3.4 — Beyond closures: half days, school events, theme days.
-- Noah's "Water Day" idea (2026-04-26): the kid forgets to bring swim
-- clothes on Water Day at TGP, every other kid is in swim gear, the
-- kid is sad and can't participate. Phase 3.4 prevents that bad
-- morning by surfacing not-just-closures-but-events on every parent
-- and kid surface.
--
-- Schema additions are PURELY ADDITIVE so existing reads, the iCal
-- sync pipeline, the parser, and the reminder cron keep working
-- unchanged. Defaults preserve current semantics: every existing
-- closure becomes kind='closure' with attire_or_bring NULL.
--
-- Adds:
--   1. closure_kind enum:
--        'closure'   — school is closed (today's behavior)
--        'half_day'  — early dismissal / shortened day
--        'event'     — school IS in session, special event happening
--                      (Water Day, Field Day, Picture Day)
--        'theme_day' — school IS in session, dress-up / spirit day
--                      (Pajama Day, Spirit Week, Crazy Hair Day)
--   2. closures.kind column (default 'closure', NOT NULL)
--   3. closures.attire_or_bring text (nullable) — what to wear or
--      bring. Surfaced as a reminder banner on cards + emails.
--   4. Backfill: rows with is_early_release=true are flipped to
--      kind='half_day'. Everything else stays 'closure'.
--   5. idx_closures_kind for the kind-aware queries the UI will run.
--
-- Idempotent: enum is wrapped in DO/EXCEPTION; column adds use
-- IF NOT EXISTS; backfill UPDATE only touches rows where the move
-- is well-defined.
--
-- NOT APPLIED at commit time. Dad applies via:
--   pnpm exec supabase db push --include-all
-- Phase 3.4 read-side code is schema-defensive — it COALESCEs kind
-- to 'closure' and tolerates missing columns until this lands.

-- ---------------------------------------------------------------
-- 1. Enum
-- ---------------------------------------------------------------

DO $$ BEGIN
  CREATE TYPE public.closure_kind AS ENUM (
    'closure',
    'half_day',
    'event',
    'theme_day'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ---------------------------------------------------------------
-- 2. Columns on public.closures
-- ---------------------------------------------------------------

ALTER TABLE public.closures
  ADD COLUMN IF NOT EXISTS kind public.closure_kind NOT NULL DEFAULT 'closure',
  ADD COLUMN IF NOT EXISTS attire_or_bring text;

-- ---------------------------------------------------------------
-- 3. Backfill: existing early-release rows flip to 'half_day'.
--    Bounded WHERE so re-running is a no-op after first apply.
-- ---------------------------------------------------------------

UPDATE public.closures
   SET kind = 'half_day'
 WHERE is_early_release = true
   AND kind = 'closure';

-- ---------------------------------------------------------------
-- 4. Index for kind-aware filtering (parent UI shows/hides by kind).
-- ---------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_closures_kind
  ON public.closures(kind);

-- ---------------------------------------------------------------
-- 5. Comments — for future spelunkers.
-- ---------------------------------------------------------------

COMMENT ON COLUMN public.closures.kind IS
  'Phase 3.4: closure | half_day | event (Water Day) | theme_day (Pajama Day). Default closure preserves migration-001 semantics.';
COMMENT ON COLUMN public.closures.attire_or_bring IS
  'Phase 3.4: short text shown on cards + emails when set, e.g. "Bring swim clothes and a towel". Null means no special instruction.';
