// Focused single-kid birth-date update. The general /api/kid-profiles
// POST is a replace-all, which is fine for onboarding but heavy for
// "the soft-prompt banner asked Mom for one kid's birthday and she
// answered." This endpoint patches just the birth_month + birth_year
// columns for one kid the caller owns. RLS on kid_profiles confines
// the update to user_id = auth.uid().

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabase } from '@/lib/supabase/server';

const schema = z.object({
  kid_id: z.string().guid(),
  birth_month: z.number().int().min(1).max(12),
  birth_year: z.number().int().min(2005).max(2025),
});

export async function POST(req: Request) {
  const sb = createServerSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }

  const { kid_id, birth_month, birth_year } = parsed.data;
  const { error } = await sb
    .from('kid_profiles')
    .update({ birth_month, birth_year })
    .eq('id', kid_id)
    .eq('user_id', user.id); // belt-and-suspenders alongside RLS
  if (error) {
    return NextResponse.json(
      { error: 'db_error', detail: error.message },
      { status: 500 },
    );
  }
  return NextResponse.json({ ok: true });
}
