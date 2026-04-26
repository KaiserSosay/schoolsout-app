import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabase } from '@/lib/supabase/server';
import { validatePassword } from '@/lib/auth/passwords';

// Set or change the password on the currently-authenticated account.
// Reachable from Settings → Account once the UI surface ships, and
// also useful for any future "first-time password setup" magic-link
// landing page.

const schema = z.object({
  password: z.string(),
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }

  const sb = createServerSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const v = validatePassword(parsed.data.password);
  if (!v.ok) {
    return NextResponse.json({ error: v.reason }, { status: 400 });
  }

  const { error } = await sb.auth.updateUser({ password: parsed.data.password });
  if (error) {
    return NextResponse.json(
      { error: 'update_failed', detail: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
