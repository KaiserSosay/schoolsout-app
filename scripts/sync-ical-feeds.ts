#!/usr/bin/env tsx
/**
 * One-shot manual run of the iCal feed sync. Same logic the nightly cron
 * runs at /api/cron/sync-ical-feeds. Use this to verify a feed change or
 * to backfill closures for a newly-seeded school.
 *
 * Run:
 *   set -a && source .deploy-secrets/env.sh && set +a
 *   pnpm dlx tsx scripts/sync-ical-feeds.ts
 *
 * Optionally pass a slug to sync just one school:
 *   pnpm dlx tsx scripts/sync-ical-feeds.ts gulliver-preparatory-school
 */

import { createClient } from '@supabase/supabase-js';
import { syncIcalForSchool, type SyncSchool } from '@/lib/ical/sync';

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required');
    process.exit(1);
  }

  const onlySlug = process.argv[2];
  const db = createClient(url, key, { auth: { persistSession: false } });

  let q = db
    .from('schools')
    .select('id, slug, ical_feed_url')
    .not('ical_feed_url', 'is', null);
  if (onlySlug) q = q.eq('slug', onlySlug);
  const { data, error } = await q;
  if (error) {
    console.error('Failed to load schools:', error.message);
    process.exit(1);
  }

  const schools = (data ?? []) as SyncSchool[];
  if (schools.length === 0) {
    console.log(
      onlySlug
        ? `No schools matched slug=${onlySlug}.`
        : 'No schools have ical_feed_url set.',
    );
    return;
  }

  console.log(`Syncing ${schools.length} school${schools.length === 1 ? '' : 's'}…`);
  for (const school of schools) {
    const result = await syncIcalForSchool({ db, fetch, school });
    if (result.ok) {
      console.log(`  ✓ ${school.slug}: ${result.closuresUpserted} closures upserted`);
    } else {
      console.log(`  ✗ ${school.slug}: ${result.error}`);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
