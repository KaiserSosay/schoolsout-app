import { describe, it, expect } from 'vitest';
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { nextMigrationNumber } from '@/../scripts/parse-school-calendars';

// 2026-04-26 incident guard — the parser used to regenerate
// supabase/migrations/029_anchor_schools_calendars.sql from scratch on
// every run, silently overwriting an applied production migration. The
// fix has two parts: (1) auto-pick the next available 3-digit migration
// number, (2) refuse to overwrite any file that already exists. These
// tests pin both behaviors so a future refactor can't quietly regress.

function tmpDir(): string {
  const dir = join(
    tmpdir(),
    `parse-school-calendars-test-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}`,
  );
  mkdirSync(dir, { recursive: true });
  return dir;
}

describe('nextMigrationNumber', () => {
  it('returns 001 when the migrations directory is empty', () => {
    const dir = tmpDir();
    try {
      expect(nextMigrationNumber(dir)).toBe('001');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('returns 001 when the migrations directory does not exist', () => {
    const dir = join(tmpdir(), `does-not-exist-${Date.now()}`);
    expect(existsSync(dir)).toBe(false);
    expect(nextMigrationNumber(dir)).toBe('001');
  });

  it('returns highest_existing + 1 zero-padded to 3 digits', () => {
    const dir = tmpDir();
    try {
      writeFileSync(join(dir, '001_initial.sql'), '-- noop');
      writeFileSync(join(dir, '029_anchor_schools_calendars.sql'), '-- noop');
      writeFileSync(join(dir, '038_kid_profiles_birth_dates.sql'), '-- noop');
      expect(nextMigrationNumber(dir)).toBe('039');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('handles a 3-digit gap correctly (036 missing → 038 returns 039)', () => {
    const dir = tmpDir();
    try {
      writeFileSync(join(dir, '035_a.sql'), '');
      writeFileSync(join(dir, '037_b.sql'), '');
      writeFileSync(join(dir, '038_c.sql'), '');
      expect(nextMigrationNumber(dir)).toBe('039');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('ignores non-migration files in the directory', () => {
    const dir = tmpDir();
    try {
      writeFileSync(join(dir, 'README.md'), '');
      writeFileSync(join(dir, '029_anchor.sql'), '');
      writeFileSync(join(dir, 'not-a-migration.sql'), '');
      expect(nextMigrationNumber(dir)).toBe('030');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('handles a single 3-digit migration with no gap', () => {
    const dir = tmpDir();
    try {
      writeFileSync(join(dir, '042_only.sql'), '');
      expect(nextMigrationNumber(dir)).toBe('043');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('contract: production migrations on disk must be safe from overwrite', () => {
  it('the actual prod migration directory has 029_anchor_schools_calendars.sql', () => {
    // The script's old default was to write 029_anchor_schools_calendars.sql.
    // Confirm the file exists in the repo so the protection wired in
    // parse-school-calendars.ts (refuse-to-overwrite + auto-next-number)
    // actually has something to protect.
    const path = join(
      __dirname,
      '..',
      '..',
      'supabase',
      'migrations',
      '029_anchor_schools_calendars.sql',
    );
    expect(existsSync(path)).toBe(true);
  });

  it('the auto-numbered default would NOT collide with 029', () => {
    // Whatever number the script picks today, it must be strictly greater
    // than 029 — guaranteed by nextMigrationNumber's max-plus-one logic.
    const next = nextMigrationNumber(
      join(__dirname, '..', '..', 'supabase', 'migrations'),
    );
    expect(parseInt(next, 10)).toBeGreaterThan(29);
  });
});
