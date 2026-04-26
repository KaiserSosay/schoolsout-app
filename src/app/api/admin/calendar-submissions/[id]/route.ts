// Phase 4.7.1 — admin triage for school_calendar_submissions. Status flips
// to approved | rejected | incorporated. The submission row never auto-
// writes to the closures table; an admin still lands the dates via a normal
// migration when ready (R6 trust posture).

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceSupabase } from '@/lib/supabase/service';
import { requireAdminApi } from '@/lib/auth/requireAdmin';

export const dynamic = 'force-dynamic';

const bodySchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected', 'incorporated']),
  review_notes: z.string().max(2000).optional().nullable(),
});

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const gate = await requireAdminApi();
  if (!gate.ok) return gate.response;
  const { user } = gate;

  const { id } = await ctx.params;
  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }

  const db = createServiceSupabase();
  const update: Record<string, unknown> = {
    status: parsed.data.status,
    reviewed_by: user.id,
    reviewed_at: new Date().toISOString(),
  };
  if (parsed.data.review_notes !== undefined) {
    update.review_notes = parsed.data.review_notes;
  }

  const { data, error } = await db
    .from('school_calendar_submissions')
    .update(update)
    .eq('id', id)
    .select(
      'id, school_id, submitter_email, submitter_name, submitter_role, proposed_updates, notes, domain_verified, status, reviewed_by, reviewed_at, review_notes, created_at',
    )
    .single();
  if (error || !data) {
    return NextResponse.json(
      { error: 'db_error', detail: error?.message },
      { status: 500 },
    );
  }
  return NextResponse.json({ ok: true, submission: data });
}
