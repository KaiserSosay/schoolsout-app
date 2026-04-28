-- Phase B hotfix — add submitted_by_email to camp_applications.
--
-- THE actual cause of the 500 on /api/camp-requests POSTs that two
-- camp operators hit on 2026-04-28. HAR diagnostic captured:
--
--   POST /api/camp-requests → 500
--   { error: 'db_error', detail: "Could not find the 'submitted_by_email'
--     column of 'camp_applications' in the schema cache" }
--
-- Why the column was missing: the route + admin code reference
-- camp_applications.submitted_by_email but no migration ever adds it.
-- The original schema (002) used a single `email` column; later code
-- introduced a parallel `submitted_by_email` field on the inserts and
-- SELECTs without a corresponding migration. Confirmed by audit on
-- 2026-04-28 — see commit message and the column inventory in src/.
--
-- Effect of this migration:
--   - INSERTs against /api/camp-requests stop 500'ing on the column-
--     missing schema-cache error.
--   - Admin SELECTs that include 'submitted_by_email' (the camp
--     applications queue + the deny endpoint) start returning the
--     submitter's email correctly. Before this migration, those
--     surfaces would have 500'd the moment a row existed — but no
--     row ever made it past the failing INSERT, so the breakage
--     stayed silent in admin.
--
-- Idempotent (ADD COLUMN IF NOT EXISTS). NOT auto-applied. Operator
-- runs:
--   pnpm exec supabase db push --include-all
-- before deploying the code, then `git push`.
--
-- Per R1: this column is referenced unconditionally in the route's
-- INSERT, so the safe ordering is migration first, code deploy second.

ALTER TABLE public.camp_applications
  ADD COLUMN IF NOT EXISTS submitted_by_email TEXT;

COMMENT ON COLUMN public.camp_applications.submitted_by_email IS
  'Operator email submitted via /list-your-camp. Duplicates the legacy email column on inserts; admin queue + deny notify use this preferentially with email as fallback.';
