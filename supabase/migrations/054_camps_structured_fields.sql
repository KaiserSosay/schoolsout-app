-- Phase 4.x — schema for structured camp description fields.
--
-- Purely additive. The existing `description` column (text/markdown) is
-- preserved; new structured fields supplement it for cards, detail
-- pages, and admin editing. NOT applied tonight — Rasheid reviews the
-- parser proposal in `docs/plans/camp-structured-fields-proposal-2026-04-27.md`
-- in the morning, then runs `pnpm exec supabase db push`.
--
-- Schema columns referenced (verified against migration 003 / 005 / 006
-- / 013 / 021 / 024 / 053 on 2026-04-27):
--   public.camps.id (uuid). All new columns are net-new — none of these
--   names exists on the table today (verified via grep against
--   supabase/migrations/*.sql).
--
-- JSONB shape contracts (documented for future migration writers):
--
-- sessions: array of objects, one per session window.
--   {
--     label: text,           -- e.g. "Session One"
--     start_date: date,      -- ISO date
--     end_date: date,        -- ISO date
--     weekly_themes: text[], -- one entry per week, optional
--     notes: text            -- optional, e.g. "no camp June 19"
--   }
--
-- pricing_tiers: array of objects, one per pricing option.
--   {
--     label: text,                       -- e.g. "Half-day"
--     hours: text,                       -- e.g. "9:00 AM – 12:30 PM"
--     session_price_cents: int,          -- per-session in cents
--     both_sessions_price_cents: int,    -- both-session bundle, optional
--     weekly_price_cents: int,           -- weekly rate, optional
--     notes: text                        -- e.g. "non-refundable"
--   }
--
-- fees: array of objects, one per required-or-optional fee.
--   {
--     label: text,                  -- e.g. "Registration fee"
--     amount_cents: int,
--     refundable: boolean,
--     notes: text                   -- e.g. "due at enrollment"
--   }
--
-- enrollment_window: single object, not array.
--   {
--     opens_at: timestamptz,
--     closes_at: timestamptz,       -- nullable for "until full"
--     status: text                  -- 'open' | 'closed' | 'until_full'
--   }
--
-- These shapes mirror the structure visible in TGP's flyer + the
-- existing 305 / Wise Choice / Frost descriptions — common patterns
-- across all 110 verified camps.

ALTER TABLE public.camps
  ADD COLUMN IF NOT EXISTS tagline TEXT,
  ADD COLUMN IF NOT EXISTS sessions JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS pricing_tiers JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS activities TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS fees JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS enrollment_window JSONB,
  ADD COLUMN IF NOT EXISTS what_to_bring TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS lunch_policy TEXT,
  ADD COLUMN IF NOT EXISTS extended_care_policy TEXT,
  ADD COLUMN IF NOT EXISTS logo_url TEXT,
  ADD COLUMN IF NOT EXISTS hero_url TEXT;

COMMENT ON COLUMN public.camps.tagline IS 'Short one-line description for cards and search results';
COMMENT ON COLUMN public.camps.sessions IS 'Array of camp sessions with dates and weekly themes — see migration 054 header for shape';
COMMENT ON COLUMN public.camps.pricing_tiers IS 'Tiered pricing options (e.g., half-day vs full-day) — see migration 054 header for shape';
COMMENT ON COLUMN public.camps.activities IS 'Activity list (e.g., Arts & Crafts, STEM Lab, Water Play)';
COMMENT ON COLUMN public.camps.fees IS 'Required and optional fees beyond tuition — see migration 054 header for shape';
COMMENT ON COLUMN public.camps.enrollment_window IS 'When registration opens/closes — see migration 054 header for shape';
COMMENT ON COLUMN public.camps.what_to_bring IS 'Items parents need to send (sunscreen, water bottle, lunch, swim clothes, etc.)';
COMMENT ON COLUMN public.camps.lunch_policy IS 'Plain-text description: from home, provided, optional via Our Lunches, etc.';
COMMENT ON COLUMN public.camps.extended_care_policy IS 'Plain-text description: before-care + after-care availability and pricing';
COMMENT ON COLUMN public.camps.logo_url IS 'Public URL to camp logo (square aspect ratio recommended). Phase B image upload writes here.';
COMMENT ON COLUMN public.camps.hero_url IS 'Public URL to camp hero/cover image (16:9 recommended). Phase B image upload writes here.';
