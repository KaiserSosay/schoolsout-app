import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

// Static-analysis test on migration 044 — the enum-extension half of
// the federal-holidays pair. 045 inserts the rows that USE this new
// enum value; the two MUST live in separate files because Postgres
// rejects ALTER TYPE ADD VALUE + a query that uses the new value
// inside one transaction (SQLSTATE 55P04).

const MIG_PATH = path.join(
  process.cwd(),
  'supabase/migrations/044_tgp_federal_holidays_enum.sql',
);

const SQL = readFileSync(MIG_PATH, 'utf8');

describe('migration 044 — closure_status enum gains "derived"', () => {
  it('extends the closure_status enum with "derived"', () => {
    expect(SQL).toMatch(
      /alter type closure_status add value if not exists 'derived'/i,
    );
  });

  it('uses IF NOT EXISTS so re-running on a DB where the value already lives is idempotent', () => {
    expect(SQL).toMatch(/if not exists/i);
  });

  it('contains NO INSERT statements — the row inserts live in pair migration 045', () => {
    expect(SQL).not.toMatch(/\binsert\s+into\b/i);
    expect(SQL).not.toMatch(/\bdo \$\$/);
  });
});
