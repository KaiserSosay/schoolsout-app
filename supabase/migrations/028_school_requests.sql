-- Phase 3.0 / Item 3.1 — school autocomplete + admin notification flow.
--
-- The /app/settings page now uses an autocomplete that searches the
-- existing `schools` table by name. When a parent types a school we
-- don't have, they tap "+ Add my school" and we capture the request
-- here for admin review. Admin gets emailed via Resend
-- (SchoolRequestNotifyEmail) and triages from /admin?tab=school-requests.
--
-- Per SHIPPING_RULES.md R1 — this migration ships ALONE in its own
-- commit. The feature code that references `school_requests` ships in a
-- follow-up commit only after this migration has been applied to prod.
--
-- Source for `schools.id` shape: migration 022 created `schools` with
-- a UUID primary key; FKs below reference it.

CREATE TABLE IF NOT EXISTS public.school_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  requested_name TEXT NOT NULL,
  city TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'researching', 'added', 'rejected')),
  reviewed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  linked_school_id UUID REFERENCES public.schools(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_school_requests_status
  ON public.school_requests (status, created_at DESC);

ALTER TABLE public.school_requests ENABLE ROW LEVEL SECURITY;

-- Service-role-only policy. The admin dashboard reads/writes via the
-- service-role Supabase client; parents POST through `/api/school-
-- requests` which also uses the service-role client (the user is opting
-- in by submitting their school name + optional email, no PII concerns
-- per COPPA — no kid data flows here).
CREATE POLICY "service role full access on school_requests"
  ON public.school_requests
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

COMMENT ON TABLE public.school_requests IS
  'Phase 3.0 Item 3.1 — parent-submitted school names not yet in our schools table. Admin triages via /admin?tab=school-requests.';
