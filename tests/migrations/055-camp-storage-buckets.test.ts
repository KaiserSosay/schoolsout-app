import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

// Static-analysis tests for migration 055 — Supabase Storage buckets
// for camp logos + heroes. We can't apply against a real DB in CI;
// these checks catch what we can without one: bucket creation is
// idempotent, both buckets are public-read, only service role can
// write, and both buckets have size + mime restrictions.

const MIG_PATH = path.join(
  process.cwd(),
  'supabase/migrations/055_camp_storage_buckets.sql',
);
const SQL = readFileSync(MIG_PATH, 'utf8');

describe('migration 055 — camp storage buckets', () => {
  it('creates both camp-logos and camp-heroes buckets', () => {
    expect(SQL).toMatch(/'camp-logos'/);
    expect(SQL).toMatch(/'camp-heroes'/);
  });

  it('bucket INSERT uses ON CONFLICT (id) DO NOTHING (idempotent)', () => {
    expect(SQL).toMatch(/INSERT INTO storage\.buckets[\s\S]*ON CONFLICT \(id\) DO NOTHING/);
  });

  it('marks both buckets as public-read', () => {
    // The INSERT places the public boolean third — true after the name.
    expect(SQL).toMatch(/'camp-logos',\s*'camp-logos',\s*true/);
    expect(SQL).toMatch(/'camp-heroes',\s*'camp-heroes',\s*true/);
  });

  it('caps logo file size at 512 KB and hero at 2 MB', () => {
    // 524288 = 512 * 1024
    expect(SQL).toMatch(/'camp-logos',\s*'camp-logos',\s*true,\s*524288/);
    // 2097152 = 2 * 1024 * 1024
    expect(SQL).toMatch(/'camp-heroes',\s*'camp-heroes',\s*true,\s*2097152/);
  });

  it('restricts logo mimes to png/jpeg/webp/svg, heroes to png/jpeg/webp (no svg)', () => {
    expect(SQL).toMatch(/'camp-logos'[\s\S]*'image\/svg\+xml'/);
    // Heroes block: assert SVG isn't in the heroes ARRAY (vector + 1200x675
    // doesn't make sense for cover photos).
    const heroValuesRow = SQL.match(
      /'camp-heroes',\s*'camp-heroes',\s*true,\s*\d+,\s*\n?\s*ARRAY\[[^\]]*\]/,
    );
    expect(heroValuesRow, 'camp-heroes VALUES row not found').not.toBeNull();
    expect(heroValuesRow![0]).toContain("'image/png'");
    expect(heroValuesRow![0]).toContain("'image/jpeg'");
    expect(heroValuesRow![0]).toContain("'image/webp'");
    expect(heroValuesRow![0]).not.toContain("'image/svg+xml'");
  });

  it('public read policies cover both buckets', () => {
    expect(SQL).toMatch(/CREATE POLICY "Public read on camp-logos"/);
    expect(SQL).toMatch(/CREATE POLICY "Public read on camp-heroes"/);
  });

  it('every CREATE POLICY is preceded by a DROP POLICY IF EXISTS (idempotent)', () => {
    // Count only CREATE POLICY at the start of a line (real statements,
    // not the prose mention inside the comment header).
    const creates = SQL.match(/^CREATE POLICY/gm) ?? [];
    const drops = SQL.match(/^DROP POLICY IF EXISTS/gm) ?? [];
    expect(drops.length).toBe(creates.length);
    expect(creates.length).toBe(8); // 2 buckets × (read + insert + update + delete)
  });

  it('write/update/delete policies all gate on auth.role() = service_role', () => {
    const insertPolicies = SQL.match(/FOR INSERT[\s\S]*?WITH CHECK[\s\S]*?;/g) ?? [];
    const updatePolicies = SQL.match(/FOR UPDATE[\s\S]*?USING[\s\S]*?;/g) ?? [];
    const deletePolicies = SQL.match(/FOR DELETE[\s\S]*?USING[\s\S]*?;/g) ?? [];
    // 2 buckets × 3 write verbs = 6 policies.
    expect(insertPolicies.length).toBe(2);
    expect(updatePolicies.length).toBe(2);
    expect(deletePolicies.length).toBe(2);
    for (const p of [...insertPolicies, ...updatePolicies, ...deletePolicies]) {
      expect(p).toMatch(/auth\.role\(\)\s*=\s*'service_role'/);
    }
  });

  it('does NOT grant public write/update/delete on either bucket', () => {
    // Phase B uploads run via the service-role admin client; never via
    // browser supabase client + user JWT.
    expect(SQL).not.toMatch(/CREATE POLICY[^"]*"Public (insert|update|delete)/i);
  });
});
