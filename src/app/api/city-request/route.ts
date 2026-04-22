import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceSupabase } from '@/lib/supabase/service';

const schema = z.object({
  email: z.string().email().max(320),
  city: z.string().min(2).max(100),
  state: z.string().max(2).optional(),
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: 'invalid_body' }, { status: 400 });

  const ua = req.headers.get('user-agent')?.slice(0, 500) ?? null;
  const db = createServiceSupabase();
  const { error } = await db.from('city_requests').insert({ ...parsed.data, user_agent: ua });

  // DECISION: Unique-constraint collision on (lower(email), lower(city)) = user
  // already requested that city. Treat as success so the UI can show a consistent
  // "we got it" message without leaking whether they've submitted before.
  if (error && error.code !== '23505') {
    return NextResponse.json({ error: 'db_error', detail: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
