import type { SupabaseClient } from '@supabase/supabase-js';
import { parseIcsString } from '../../../scripts/parse-school-calendars';
import { deriveSchoolYear } from '@/lib/schools/derive-school-year';

// Live-feed iCal sync for one school. Designed to be called from:
//   - scripts/sync-ical-feeds.ts (one-shot manual run)
//   - src/app/api/cron/sync-ical-feeds/route.ts (nightly Vercel cron)
//
// Reuses parseIcsString() + the closure-keyword filter from
// scripts/parse-school-calendars.ts so the live feed and the static
// migration imports treat the same SUMMARY tokens consistently. UPSERTs
// onto the closures unique index (school_id, start_date, name) so a
// re-run is safe and a renamed-by-the-school event becomes a new row
// rather than overwriting an unrelated one.

export type SyncSchool = {
  id: string;
  slug: string;
  ical_feed_url: string | null;
};

export type SyncResult =
  | { ok: true; closuresUpserted: number }
  | { ok: false; error: string };

export async function syncIcalForSchool({
  db,
  fetch: fetchFn,
  school,
}: {
  db: SupabaseClient;
  fetch: typeof fetch;
  school: SyncSchool;
}): Promise<SyncResult> {
  if (!school.ical_feed_url) return { ok: true, closuresUpserted: 0 };

  let body: string;
  try {
    const res = await fetchFn(school.ical_feed_url, { method: 'GET' });
    if (!res.ok) {
      const err = `HTTP ${res.status}`;
      await markSyncError(db, school.id, err);
      return { ok: false, error: err };
    }
    body = await res.text();
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e);
    await markSyncError(db, school.id, err);
    return { ok: false, error: err };
  }

  const { closures } = parseIcsString(body);

  if (closures.length > 0) {
    const rows = closures.map((c) => ({
      school_id: school.id,
      name: c.name,
      start_date: c.start_date,
      end_date: c.end_date,
      category: c.category,
      closed_for_students: c.closed_for_students,
      is_early_release: c.is_early_release,
      status: 'verified',
      source: `ical:${school.slug}`,
      // Required: 2026-04-26 incident. Without this, the renderer
      // buckets every iCal closure into a __UNKNOWN__ section, and the
      // year-coverage helper can't see them. Derived from start_date —
      // U.S. academic year flips Aug 1.
      school_year: deriveSchoolYear(c.start_date),
    }));
    const { error } = await db
      .from('closures')
      .upsert(rows, { onConflict: 'school_id,start_date,name' });
    if (error) {
      await markSyncError(db, school.id, error.message);
      return { ok: false, error: error.message };
    }
  }

  await db
    .from('schools')
    .update({
      ical_last_synced_at: new Date().toISOString(),
      ical_sync_error: null,
    })
    .eq('id', school.id);

  return { ok: true, closuresUpserted: closures.length };
}

async function markSyncError(
  db: SupabaseClient,
  schoolId: string,
  error: string,
) {
  await db
    .from('schools')
    .update({ ical_sync_error: error })
    .eq('id', schoolId);
}
