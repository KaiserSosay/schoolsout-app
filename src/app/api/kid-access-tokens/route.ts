import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabase } from '@/lib/supabase/server';
import { generateKidAccessToken } from '@/lib/tokens';
import { env } from '@/lib/env';

export const dynamic = 'force-dynamic';

const postSchema = z.object({
  label: z.string().min(1).max(60).optional(),
  expires_days: z.number().int().positive().max(365).nullable().optional(),
});

export async function GET() {
  const sb = createServerSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data, error } = await sb
    .from('kid_access_tokens')
    .select('id, token, label, expires_at, last_used_at, created_at')
    .eq('user_id', user.id)
    .is('revoked_at', null)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: 'db_error', detail: error.message }, { status: 500 });
  }
  return NextResponse.json({ tokens: data ?? [] });
}

export async function POST(req: Request) {
  const sb = createServerSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const json = await req.json().catch(() => null);
  const parsed = postSchema.safeParse(json ?? {});
  if (!parsed.success) return NextResponse.json({ error: 'invalid_body' }, { status: 400 });

  const { label, expires_days } = parsed.data;

  // DECISION: Retry up to 3x on unique-constraint collision. 32^10 space makes
  // this effectively impossible, but we still handle it deterministically.
  let token = '';
  let inserted: { id: string; token: string } | null = null;
  let lastError: string | null = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    token = generateKidAccessToken(10);
    const expires_at =
      expires_days == null
        ? null
        : new Date(Date.now() + expires_days * 86_400_000).toISOString();
    const { data, error } = await sb
      .from('kid_access_tokens')
      .insert({ user_id: user.id, token, label: label ?? null, expires_at })
      .select('id, token')
      .single();
    if (!error && data) {
      inserted = data;
      break;
    }
    lastError = error?.message ?? 'insert_failed';
  }
  if (!inserted) {
    return NextResponse.json({ error: 'db_error', detail: lastError }, { status: 500 });
  }

  return NextResponse.json({
    id: inserted.id,
    token: inserted.token,
    url: `${env.APP_URL}/k/${inserted.token}`,
  });
}
