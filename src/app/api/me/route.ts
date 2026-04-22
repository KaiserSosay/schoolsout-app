import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabase } from '@/lib/supabase/server';

// DECISION: Single /api/me endpoint for the parent's own profile row. GET
// returns the minimal fields the dashboard needs; PATCH lets the onboarding
// form and future settings page update `display_name`. Kid names NEVER go
// here — per COPPA they stay on-device in localStorage.
const patchSchema = z.object({
  display_name: z.string().trim().min(1).max(80),
});

export async function GET() {
  const sb = createServerSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data, error } = await sb
    .from('users')
    .select('id, email, display_name')
    .eq('id', user.id)
    .maybeSingle();
  if (error) return NextResponse.json({ error: 'db_error', detail: error.message }, { status: 500 });

  return NextResponse.json({ user: data ?? { id: user.id, email: user.email, display_name: null } });
}

export async function PATCH(req: Request) {
  const sb = createServerSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const json = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: 'invalid_body' }, { status: 400 });

  const { error } = await sb
    .from('users')
    .update({ display_name: parsed.data.display_name })
    .eq('id', user.id);
  if (error) return NextResponse.json({ error: 'db_error', detail: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
