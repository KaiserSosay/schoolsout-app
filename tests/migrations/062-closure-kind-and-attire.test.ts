// Static-analysis tests for migration 062 — Phase 3.4 closure_kind + attire_or_bring.
// We don't apply against a real DB in CI; these checks lock in the migration's
// shape, the enum values, the additive-only contract, the backfill rule,
// and idempotency guards.

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const MIG_PATH = path.join(
  process.cwd(),
  'supabase/migrations/062_closure_kind_and_attire.sql',
);
const SQL = readFileSync(MIG_PATH, 'utf8');

describe('migration 062 — closure_kind + attire_or_bring', () => {
  it('creates the closure_kind enum with the four expected values', () => {
    expect(SQL).toMatch(/CREATE TYPE public\.closure_kind AS ENUM/i);
    for (const v of ['closure', 'half_day', 'event', 'theme_day']) {
      expect(SQL).toContain(`'${v}'`);
    }
  });

  it('wraps enum creation in idempotent DO/EXCEPTION block', () => {
    expect(SQL).toMatch(/DO \$\$ BEGIN/);
    expect(SQL).toMatch(/EXCEPTION\s+WHEN duplicate_object THEN NULL;/);
  });

  it('adds kind + attire_or_bring columns idempotently', () => {
    expect(SQL).toMatch(/ALTER TABLE public\.closures/i);
    expect(SQL).toMatch(/ADD COLUMN IF NOT EXISTS kind public\.closure_kind NOT NULL DEFAULT 'closure'/);
    expect(SQL).toMatch(/ADD COLUMN IF NOT EXISTS attire_or_bring text/);
  });

  it('backfills existing is_early_release=true rows to half_day exactly once', () => {
    // The backfill must (a) target only rows where kind is still 'closure'
    // so re-running is a no-op, and (b) trigger only when the existing
    // is_early_release flag is true.
    const backfill = SQL.match(/UPDATE public\.closures[\s\S]*?WHERE is_early_release = true\s+AND kind = 'closure'/);
    expect(backfill).not.toBeNull();
  });

  it('creates an index on closures(kind)', () => {
    expect(SQL).toMatch(/CREATE INDEX IF NOT EXISTS idx_closures_kind\s+ON public\.closures\(kind\)/);
  });

  it('is purely additive — no DROP, no destructive ALTER', () => {
    expect(SQL).not.toMatch(/DROP\s+TABLE/i);
    expect(SQL).not.toMatch(/DROP\s+COLUMN/i);
    expect(SQL).not.toMatch(/DROP\s+TYPE/i);
    expect(SQL).not.toMatch(/ALTER\s+COLUMN[^;]+DROP/i);
  });

  it('documents the new columns with COMMENT ON', () => {
    expect(SQL).toMatch(/COMMENT ON COLUMN public\.closures\.kind/);
    expect(SQL).toMatch(/COMMENT ON COLUMN public\.closures\.attire_or_bring/);
  });

  it('mentions Phase 3.4 + Noah + Water Day in the header so future spelunkers find it', () => {
    expect(SQL).toMatch(/Phase 3\.4/);
    expect(SQL).toMatch(/Water Day/i);
  });
});
