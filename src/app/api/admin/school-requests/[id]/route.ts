import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceSupabase } from '@/lib/supabase/service';
import { requireAdminApi } from '@/lib/auth/requireAdmin';

// Phase 3.0 / Item 3.1 — admin triage for `school_requests`. Status can be
// nudged to researching / added / rejected. When marking as added the admin
// supplies a `linked_school_id` pointing at the row in `schools` they
// created.

export const dynamic = 'force-dynamic';

const bodySchema = z.object({
  status: z.enum(['pending', 'researching', 'added', 'rejected']),
  linked_school_id: z.string().uuid().optional().nullable(),
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
  const { status, linked_school_id } = parsed.data;

  if (status === 'added' && !linked_school_id) {
    return NextResponse.json(
      { error: 'invalid_body', detail: 'added requires linked_school_id' },
      { status: 400 },
    );
  }

  const db = createServiceSupabase();
  const update: Record<string, unknown> = {
    status,
    reviewed_by: user.id,
    reviewed_at: new Date().toISOString(),
  };
  if (linked_school_id !== undefined) update.linked_school_id = linked_school_id;

  const { data: updated, error } = await db
    .from('school_requests')
    .update(update)
    .eq('id', id)
    .select(
      'id, user_id, requested_name, city, notes, status, reviewed_by, reviewed_at, linked_school_id, created_at',
    )
    .single();
  if (error || !updated) {
    return NextResponse.json(
      { error: 'db_error', detail: error?.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, request: updated });
}
