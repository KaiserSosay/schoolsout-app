// Nightly iCal feed sync — fetches every school with a non-null
// ical_feed_url and upserts closures into our DB. Auth via CRON_SECRET
// bearer header so this route is only ever invoked by Vercel cron.

import { NextResponse } from 'next/server';
import { createServiceSupabase } from '@/lib/supabase/service';
import { syncIcalForSchool, type SyncSchool } from '@/lib/ical/sync';
import { env } from '@/lib/env';

function authorize(req: Request) {
  const auth = req.headers.get('authorization') ?? '';
  return auth === `Bearer ${env.CRON_SECRET}`;
}

export async function GET(req: Request) {
  if (!authorize(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const db = createServiceSupabase();
  const { data, error } = await db
    .from('schools')
    .select('id, slug, ical_feed_url')
    .not('ical_feed_url', 'is', null);
  if (error) {
    return NextResponse.json(
      { error: 'db_error', detail: error.message },
      { status: 500 },
    );
  }

  const schools = (data ?? []) as SyncSchool[];
  const summaries = await Promise.all(
    schools.map(async (school) => {
      const result = await syncIcalForSchool({ db, fetch, school });
      return { slug: school.slug, ...result };
    }),
  );

  const failed = summaries.filter((s) => !s.ok).length;
  return NextResponse.json({
    ok: failed === 0,
    schools: summaries.length,
    failed,
    summaries,
  });
}
