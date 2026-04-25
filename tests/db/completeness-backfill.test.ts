import { describe, it, expect } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const skip = !url || !key;

// Phase 3.0 Item 3.8 part B verification: after migration 027 fires the
// migration-017 trigger across every camp row, every verified camp should
// have a non-zero data_completeness score. Skips cleanly when env vars
// are unset (CI / local without prod creds).
describe.skipIf(skip)('camps.data_completeness backfill', () => {
  const db = createClient(url ?? 'http://localhost', key ?? 'placeholder');

  it('every verified camp has data_completeness > 0', async () => {
    const { data, error } = await db
      .from('camps')
      .select('id, slug, data_completeness')
      .eq('verified', true);
    expect(error).toBeNull();
    const rows = data ?? [];
    expect(rows.length).toBeGreaterThan(0);
    const zeros = rows.filter(
      (r: { data_completeness: number | null }) =>
        r.data_completeness === 0 || r.data_completeness === null,
    );
    if (zeros.length > 0) {
      // Print which slugs need attention so a failure isn't a black box.
      console.error(
        '[completeness-backfill] camps with score=0:',
        zeros.map((z: { slug: string }) => z.slug).join(', '),
      );
    }
    expect(zeros).toEqual([]);
  });
});
