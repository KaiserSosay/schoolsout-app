-- Migration 008: user_plans — "Plan This Day" wizard saves parent-selected
-- camps + activities keyed by (user_id, closure_id).
--
-- DECISION (PM-authored COPPA exception): `kid_names TEXT[]` stores client-
-- side display names in plaintext. The spec is deliberate — parents explicitly
-- opt in by saving the plan, the plan is meant to be shareable with a
-- co-parent via link, and the row is deletable by the user. Elsewhere in the
-- system kid names are localStorage-only. This is the one place names are
-- server-stored; the exception is documented in PROGRESS.md.

CREATE TABLE IF NOT EXISTS user_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  closure_id UUID REFERENCES closures(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('coverage', 'activities', 'mix')),
  kid_names TEXT[] NOT NULL DEFAULT '{}',
  camps UUID[] NOT NULL DEFAULT '{}',
  activities UUID[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, closure_id)
);

CREATE INDEX IF NOT EXISTS idx_user_plans_user ON user_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_user_plans_closure ON user_plans(closure_id);

ALTER TABLE user_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users read own plans" ON user_plans;
CREATE POLICY "users read own plans" ON user_plans FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "users write own plans" ON user_plans;
CREATE POLICY "users write own plans" ON user_plans FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
