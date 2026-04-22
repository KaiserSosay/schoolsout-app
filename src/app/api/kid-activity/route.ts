import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabase } from '@/lib/supabase/server';

const postSchema = z.object({
  action: z.enum(['viewed_closure', 'viewed_camp']),
  target_id: z.string().guid().optional(),
  target_name: z.string().min(1).max(200),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export async function GET() {
  const sb = createServerSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data, error } = await sb
    .from('kid_activity')
    .select('id, action, target_id, target_name, metadata, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) return NextResponse.json({ error: 'db_error', detail: error.message }, { status: 500 });
  return NextResponse.json({ activity: data ?? [] });
}

export async function POST(req: Request) {
  const sb = createServerSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const json = await req.json().catch(() => null);
  const parsed = postSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: 'invalid_body' }, { status: 400 });

  const { action, target_id, target_name, metadata } = parsed.data;
  const { error } = await sb.from('kid_activity').insert({
    user_id: user.id,
    action,
    target_id: target_id ?? null,
    target_name,
    metadata: metadata ?? {},
  });
  if (error) return NextResponse.json({ error: 'db_error', detail: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
