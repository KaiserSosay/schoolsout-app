-- Phase B prep — add tagline to camp_applications.
--
-- The /list-your-camp form already collects (and the camps table already
-- stores) a one-line tagline (camps.tagline added in migration 054). The
-- public submission route writes to camp_applications first, then admin
-- promotes the application into a camps row. Without the column on
-- camp_applications, an operator's tagline gets dropped on the floor
-- between submission and approval — which is exactly the data we most
-- want to keep verbatim.
--
-- Additive ALTER TABLE per R1: ship migration first, then code that
-- references the new column. Idempotent so a re-run is a no-op.
--
-- NOT auto-applied tonight. Operator runs:
--   pnpm exec supabase db push --include-all
-- then deploys the code that writes to it.

ALTER TABLE public.camp_applications
  ADD COLUMN IF NOT EXISTS tagline TEXT;

COMMENT ON COLUMN public.camp_applications.tagline IS
  'One-line tagline from the /list-your-camp form, ~200 chars. On admin approval the canonical camps.tagline is set from this value.';
