import { describe, it, expect, beforeAll } from 'vitest';
import { createServiceSupabase } from '@/lib/supabase/service';
import { getUpcomingClosures } from '@/lib/closures';

const skip = !process.env.NEXT_PUBLIC_SUPABASE_URL;

describe.skipIf(skip)('getUpcomingClosures', () => {
  beforeAll(async () => {
    if (skip) return;
    const db = createServiceSupabase();
    await db.from('closures').update({ status: 'verified' }).eq('school_id', '00000000-0000-0000-0000-000000000001');
  });

  it('returns only verified closures for a school, ordered by start_date', async () => {
    const rows = await getUpcomingClosures('00000000-0000-0000-0000-000000000001', new Date('2026-04-21'));
    expect(rows.length).toBeGreaterThan(0);
    rows.forEach((r) => expect(new Date(r.start_date).getTime()).toBeGreaterThanOrEqual(new Date('2026-04-21').getTime()));
    for (let i = 1; i < rows.length; i++) {
      expect(new Date(rows[i].start_date) >= new Date(rows[i - 1].start_date)).toBe(true);
    }
  });
});
