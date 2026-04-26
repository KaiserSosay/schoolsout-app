// Parent demand signaling — POST inserts a (user_id, school_id) row into
// school_calendar_notifications so the parent gets emailed once a school's
// calendar flips to verified. Idempotent on (user_id, school_id).
//
// Anonymous callers get 401 — the placeholder UI redirects them through
// the magic-link sign-in with ?next=/schools/{slug}?action=notify so they
// land back here authenticated. Keeping that flow client-side means
// this route stays a single, narrow surface.

import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { createServiceSupabase } from '@/lib/supabase/service';

export async function POST(req: Request) {
  const sb = createServerSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  let body: { school_id?: string };
  try {
    body = (await req.json()) as { school_id?: string };
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  if (!body.school_id || typeof body.school_id !== 'string') {
    return NextResponse.json({ error: 'school_id_required' }, { status: 400 });
  }

  const db = createServiceSupabase();
  const { error } = await db
    .from('school_calendar_notifications')
    .upsert(
      [{ user_id: user.id, school_id: body.school_id }],
      { onConflict: 'user_id,school_id', ignoreDuplicates: true },
    );
  if (error) {
    return NextResponse.json(
      { error: 'db_error', detail: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
