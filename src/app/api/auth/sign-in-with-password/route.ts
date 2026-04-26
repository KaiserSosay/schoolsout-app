import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabase } from '@/lib/supabase/server';

// Phase 3.5 / mom + Rasheid feedback: magic-link-every-time is real
// friction for a weekly-use product. This route is the password
// alternative — magic link stays the default and existing flow is
// untouched.
//
// Cookie handling lives in @supabase/ssr's createServerSupabase, so
// signInWithPassword on the server client sets the session cookies
// on this Response automatically. No manual cookie wiring needed.

const schema = z.object({
  email: z.string().email(),
  // Match the policy enforced by /api/auth/set-password — keeping this
  // 8+ here means a wrong-password attempt with a short string short-
  // circuits before hitting Supabase.
  password: z.string().min(8),
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }

  const sb = createServerSupabase();
  const { data, error } = await sb.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error || !data.session) {
    return NextResponse.json(
      { error: 'invalid_credentials' },
      { status: 401 },
    );
  }

  return NextResponse.json({ ok: true });
}
