import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

// Static-analysis tests for migration 059 — TGP structured-field
// gap-fill. We don't apply against a real DB in CI; these checks
// verify the SQL is shaped correctly: every UPDATE is R5-compliant
// (gap-fill only, never overwrite), targets a single camp, and the
// structured field values match the parser proposal.

const MIG_PATH = path.join(
  process.cwd(),
  'supabase/migrations/059_tgp_structured_fields.sql',
);
const SQL = readFileSync(MIG_PATH, 'utf8');

describe('migration 059 — TGP structured fields', () => {
  it('targets only the TGP slug — no other camps touched', () => {
    // Every UPDATE / SELECT against public.camps must be slug-gated.
    const updates = SQL.match(/UPDATE\s+public\.camps[\s\S]*?(?=;)/gi) ?? [];
    expect(updates.length).toBeGreaterThan(0);
    for (const u of updates) {
      expect(u, 'each UPDATE must filter on TGP slug').toMatch(
        /slug\s*=\s*'the-growing-place-summer-camp'/,
      );
    }
  });

  it('every UPDATE is R5-compliant gap-fill (IS NULL or empty array)', () => {
    // Each UPDATE must include either `field IS NULL` or
    // `field = '[]'::jsonb` / `field = '{}'::text[]` in its WHERE.
    const updates = SQL.match(/UPDATE\s+public\.camps[\s\S]*?(?=;)/gi) ?? [];
    for (const u of updates) {
      const hasNullGuard = /IS NULL/i.test(u);
      const hasEmptyJsonbGuard = /=\s*'\[\]'::jsonb/.test(u);
      const hasEmptyTextArrayGuard = /=\s*'\{\}'::text\[\]/.test(u);
      expect(
        hasNullGuard || hasEmptyJsonbGuard || hasEmptyTextArrayGuard,
        'UPDATE must guard on null / empty (R5 — gap-fill, never overwrite)',
      ).toBe(true);
    }
  });

  it('does not DELETE, DROP, or ALTER any column or row', () => {
    expect(SQL).not.toMatch(/DELETE\s+FROM/i);
    expect(SQL).not.toMatch(/DROP\s+(?:COLUMN|TABLE|TYPE)/i);
    expect(SQL).not.toMatch(/ALTER\s+(?:COLUMN|TYPE|TABLE\s+public\.camps\s+(?:DROP|ALTER))/i);
  });

  it('populates all 8 structured-field columns', () => {
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
    ];
    for (const col of required) {
      expect(SQL, `column ${col} should be set`).toMatch(
        new RegExp(`SET ${col}\\s*=`),
      );
    }
  });

  it('TGP session data matches the parser proposal', () => {
    expect(SQL).toMatch(/Session One/);
    expect(SQL).toMatch(/Session Two/);
    expect(SQL).toMatch(/2026-06-15/);
    expect(SQL).toMatch(/2026-07-02/);
    expect(SQL).toMatch(/2026-07-06/);
    expect(SQL).toMatch(/2026-07-24/);
    expect(SQL).toMatch(/How Do Dinosaurs Play with Their Friends\?/);
  });

  it('TGP pricing tiers carry both half-day and full-day cents amounts', () => {
    expect(SQL).toMatch(/Half-day/);
    expect(SQL).toMatch(/Full-day/);
    // Half-day session price: $700 = 70000 cents
    expect(SQL).toMatch(/"session_price_cents":\s*70000/);
    // Full-day session price: $800 = 80000 cents
    expect(SQL).toMatch(/"session_price_cents":\s*80000/);
    // Half-day weekly: $285 = 28500 cents
    expect(SQL).toMatch(/"weekly_price_cents":\s*28500/);
    // Full-day weekly: $315 = 31500 cents
    expect(SQL).toMatch(/"weekly_price_cents":\s*31500/);
  });

  it('TGP fees include reg + security + tuition deposit, all non-refundable', () => {
    expect(SQL).toMatch(/Registration fee/);
    expect(SQL).toMatch(/Security fee/);
    expect(SQL).toMatch(/Camp tuition deposit/);
    // Both flat fees are $150 = 15000 cents
    const fifteenK = SQL.match(/"amount_cents":\s*15000/g) ?? [];
    expect(fifteenK.length).toBeGreaterThanOrEqual(2);
    // Refundable false at least 3 times (one per fee)
    const nonRef = SQL.match(/"refundable":\s*false/g) ?? [];
    expect(nonRef.length).toBe(3);
  });

  it('TGP enrollment_window opens 2026-04-02 with status until_full', () => {
    expect(SQL).toMatch(/"opens_at":\s*"2026-04-02T15:00:00Z"/);
    expect(SQL).toMatch(/"status":\s*"until_full"/);
  });

  it('verification block raises if any field is still null/empty after apply', () => {
    expect(SQL).toMatch(/RAISE EXCEPTION[^;]*structured-field gap-fill incomplete/);
  });

  it('wraps the whole migration in a single transaction', () => {
    expect(SQL).toMatch(/^\s*BEGIN;/m);
    expect(SQL).toMatch(/COMMIT;\s*$/m);
  });
});
