import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabase } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const paramsSchema = z.object({ id: z.string().guid() });

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const parsed = paramsSchema.safeParse({ id });
  if (!parsed.success) return NextResponse.json({ error: 'invalid_id' }, { status: 400 });

  const sb = createServerSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  // DECISION: Idempotent — repeated revokes are fine. RLS ensures the row
  // belongs to this user. We don't 404 on already-revoked rows; that's a
  // soft outcome from the caller's perspective.
  const { error } = await sb
    .from('kid_access_tokens')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    return NextResponse.json({ error: 'db_error', detail: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
