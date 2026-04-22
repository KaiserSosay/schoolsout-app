import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabase } from '@/lib/supabase/server';

const paramsSchema = z.object({ id: z.string().guid() });
const patchSchema = z.object({
  label: z.string().trim().min(1).max(80).optional(),
  is_primary: z.literal(true).optional(),
});

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const sb = createServerSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { id } = await ctx.params;
  const p = paramsSchema.safeParse({ id });
  if (!p.success) return NextResponse.json({ error: 'invalid_id' }, { status: 400 });

  // RLS already restricts to this user, but the explicit eq(user_id) is an
  // extra belt so service-role callers (hypothetical future) stay scoped.
  const { error } = await sb
    .from('saved_locations')
    .delete()
    .eq('id', p.data.id)
    .eq('user_id', user.id);
  if (error) return NextResponse.json({ error: 'db_error', detail: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const sb = createServerSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { id } = await ctx.params;
  const p = paramsSchema.safeParse({ id });
  if (!p.success) return NextResponse.json({ error: 'invalid_id' }, { status: 400 });

  const json = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: 'invalid_body' }, { status: 400 });

  // If marking primary, first clear any existing primary for this user so the
  // partial unique index holds.
  if (parsed.data.is_primary === true) {
    const { error: clearErr } = await sb
      .from('saved_locations')
      .update({ is_primary: false })
      .eq('user_id', user.id)
      .eq('is_primary', true);
    if (clearErr) return NextResponse.json({ error: 'db_error', detail: clearErr.message }, { status: 500 });
  }

  const patch: { label?: string; is_primary?: boolean } = {};
  if (parsed.data.label !== undefined) patch.label = parsed.data.label;
  if (parsed.data.is_primary === true) patch.is_primary = true;

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'nothing_to_update' }, { status: 400 });
  }

  const { data, error } = await sb
    .from('saved_locations')
    .update(patch)
    .eq('id', p.data.id)
    .eq('user_id', user.id)
    .select('id, label, latitude, longitude, is_primary')
    .maybeSingle();
  if (error) return NextResponse.json({ error: 'db_error', detail: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  return NextResponse.json(data);
}
