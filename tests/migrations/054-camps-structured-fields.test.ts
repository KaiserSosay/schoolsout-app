import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

// Static-analysis tests for migration 054 — structured camp fields.
// We don't apply against a real DB in CI; these checks catch what
// we can without one: column names + types match the shape contract,
// every column uses IF NOT EXISTS (idempotent re-run), the existing
// description column is untouched, and array/JSONB defaults are
// present so existing rows don't break on read.

const MIG_PATH = path.join(
  process.cwd(),
  'supabase/migrations/054_camps_structured_fields.sql',
);
const SQL = readFileSync(MIG_PATH, 'utf8');

describe('migration 054 — structured fields schema', () => {
  it('adds the 11 documented columns', () => {
    const required = [
      'tagline',
      'sessions',
      'pricing_tiers',
      'activities',
      'fees',
      'enrollment_window',
      'what_to_bring',
      'lunch_policy',
      'extended_care_policy',
      'logo_url',
      'hero_url',
    ];
    for (const col of required) {
      expect(SQL, `column ${col} should be added`).toMatch(
        new RegExp(`ADD COLUMN IF NOT EXISTS ${col}\\b`),
      );
    }
  });

  it('every ADD COLUMN uses IF NOT EXISTS (idempotent re-run)', () => {
    const adds = SQL.match(/ADD COLUMN(?! IF NOT EXISTS)/g) ?? [];
    expect(adds.length).toBe(0);
  });

  it('JSONB columns get a non-null array/object default so existing rows are safe', () => {
    // sessions, pricing_tiers, fees default to '[]'::jsonb.
    expect(SQL).toMatch(/sessions JSONB NOT NULL DEFAULT '\[\]'::jsonb/);
    expect(SQL).toMatch(/pricing_tiers JSONB NOT NULL DEFAULT '\[\]'::jsonb/);
    expect(SQL).toMatch(/fees JSONB NOT NULL DEFAULT '\[\]'::jsonb/);
    // enrollment_window stays nullable — single-object shape, null = unknown.
    expect(SQL).toMatch(/enrollment_window JSONB[^,]*/);
    expect(SQL).not.toMatch(/enrollment_window JSONB NOT NULL/);
  });

  it('text[] columns default to empty array (not null)', () => {
    expect(SQL).toMatch(/activities TEXT\[\] NOT NULL DEFAULT '\{\}'/);
    expect(SQL).toMatch(/what_to_bring TEXT\[\] NOT NULL DEFAULT '\{\}'/);
  });

  it('plain text columns are nullable (no NOT NULL on text)', () => {
    // tagline / lunch_policy / extended_care_policy / logo_url / hero_url
    // all stay nullable — null = "not yet set" and the parser proposal
    // explicitly leaves these blank when description is too thin.
    expect(SQL).toMatch(/tagline TEXT,/);
    expect(SQL).toMatch(/lunch_policy TEXT,/);
    expect(SQL).toMatch(/extended_care_policy TEXT,/);
    expect(SQL).toMatch(/logo_url TEXT,/);
    // hero_url is the last entry — terminator may be ; instead of ,
    expect(SQL).toMatch(/hero_url TEXT/);
  });

  it('does NOT touch the existing description column', () => {
    expect(SQL).not.toMatch(/DROP COLUMN[^;]*description/);
    expect(SQL).not.toMatch(/ALTER COLUMN description/);
    expect(SQL).not.toMatch(/RENAME COLUMN description/);
  });

  it('does NOT touch any other existing camps column', () => {
    // Parser proposal is delivered separately; nothing in 054 should
    // UPDATE or rewrite existing data. Only ALTER TABLE ... ADD COLUMN.
    expect(SQL).not.toMatch(/UPDATE\s+public\.camps/i);
    expect(SQL).not.toMatch(/DELETE\s+FROM\s+public\.camps/i);
  });

  it('attaches a COMMENT to every new column for future migration writers', () => {
    const required = [
      'tagline',
      'sessions',
      'pricing_tiers',
      'activities',
      'fees',
      'enrollment_window',
      'what_to_bring',
      'lunch_policy',
      'extended_care_policy',
      'logo_url',
      'hero_url',
    ];
    for (const col of required) {
      expect(SQL, `${col} should have a COMMENT`).toMatch(
        new RegExp(`COMMENT ON COLUMN public\\.camps\\.${col}`),
      );
    }
  });

  it('header documents the JSONB shape contracts', () => {
    // The parser script (Phase B) and the admin form (Phase B) both
    // rely on these shapes — keep them documented in the migration.
    expect(SQL).toMatch(/sessions:\s*array of/);
    expect(SQL).toMatch(/pricing_tiers:\s*array of/);
    expect(SQL).toMatch(/fees:\s*array of/);
    expect(SQL).toMatch(/enrollment_window:\s*single object/);
  });

  it('does NOT contain a DO $$ block (pure ALTER TABLE)', () => {
    // Migration 054 should be a flat ALTER TABLE — no need for a
    // DO block since there are no price_tier $$ literals to escape.
    expect(SQL).not.toMatch(/DO \$/);
  });
});
