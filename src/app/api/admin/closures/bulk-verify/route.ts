import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceSupabase } from '@/lib/supabase/service';
import { requireAdminApi } from '@/lib/auth/requireAdmin';
import { recomputeSchoolStatus } from '@/lib/school-status-recompute';

const bodySchema = z.object({ school_id: z.string().guid() });

export async function POST(req: Request) {
  const gate = await requireAdminApi();
  if (!gate.ok) return gate.response;
  const { user } = gate;

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: 'invalid_body' }, { status: 400 });

  const db = createServiceSupabase();
  const { error } = await db
    .from('closures')
    .update({
      status: 'verified',
      verified_by: user.id,
      verified_at: new Date().toISOString(),
    })
    .eq('school_id', parsed.data.school_id)
    .eq('status', 'ai_draft');
  if (error) return NextResponse.json({ error: 'db_error', detail: error.message }, { status: 500 });

  try {
    const next = await recomputeSchoolStatus(db, parsed.data.school_id);
    return NextResponse.json({ ok: true, calendar_status: next });
  } catch (e) {
    return NextResponse.json(
      { error: 'recompute_failed', detail: (e as Error).message },
      { status: 500 },
    );
  }
}
