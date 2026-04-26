import { NextResponse } from 'next/server';
import { z } from 'zod';
import { checkOperatorAccess } from '@/lib/operator/auth';
import { createServiceSupabase } from '@/lib/supabase/service';

// PUT /api/operator/[slug]/coverage
// Body: { closure_id, is_open, notes }
// Upserts a single camp_closure_coverage row. Debounced from the client at
// ~500ms so toggling fast doesn't flood. Same 404-on-anything-else
// indistinguishability as the parent PATCH route.

const bodySchema = z.object({
  closure_id: z.string().uuid(),
  is_open: z.boolean(),
  notes: z.string().trim().max(280).nullable().optional(),
});

export async function PUT(
  req: Request,
  { params }: { params: { slug: string } },
) {
  const access = await checkOperatorAccess(params.slug);
  if (!access.ok) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }
  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'invalid_body', detail: parsed.error.issues },
      { status: 400 },
    );
  }
  const db = createServiceSupabase();
  // Upsert by (camp_id, closure_id) — the unique index on those two columns
  // makes this idempotent. set_by_operator_id is the user who last touched
  // it (auditable).
  const { error } = await db
    .from('camp_closure_coverage')
    .upsert(
      {
        camp_id: access.campId,
        closure_id: parsed.data.closure_id,
        is_open: parsed.data.is_open,
        notes: parsed.data.notes ?? null,
        set_by_operator_id: access.user.id,
      },
      { onConflict: 'camp_id,closure_id' },
    );
  if (error) {
    return NextResponse.json(
      { error: 'upsert_failed', detail: error.message },
      { status: 500 },
    );
  }
  return NextResponse.json({ ok: true });
}
