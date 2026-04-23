import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceSupabase } from '@/lib/supabase/service';
import { requireAdminApi } from '@/lib/auth/requireAdmin';
import { recomputeSchoolStatus } from '@/lib/school-status-recompute';

const bodySchema = z.object({ closure_id: z.string().guid() });

export async function POST(req: Request) {
  const gate = await requireAdminApi();
  if (!gate.ok) return gate.response;
  const { user } = gate;

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: 'invalid_body' }, { status: 400 });

  // DECISION: Writes go through the service role because the `closures` table
  // RLS only exposes anon SELECT for verified rows — the admin user has no
  // special INSERT/UPDATE policy, so we use the privileged client (gated by
  // the email check above).
  const db = createServiceSupabase();
  const { data, error } = await db
    .from('closures')
    .update({
      status: 'verified',
      verified_by: user.id,
      verified_at: new Date().toISOString(),
    })
    .eq('id', parsed.data.closure_id)
    .select('id, school_id')
    .maybeSingle();
  if (error) return NextResponse.json({ error: 'db_error', detail: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  try {
    await recomputeSchoolStatus(db, data.school_id);
  } catch (e) {
    return NextResponse.json(
      { error: 'recompute_failed', detail: (e as Error).message },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
