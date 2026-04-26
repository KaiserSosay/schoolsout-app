import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabase } from '@/lib/supabase/server';

// DECISION: `.guid()` instead of `.uuid()` — Zod 4 uuid() rejects the all-zero
// seed UUIDs used for the Miami schools. See Task 18 decision in PROGRESS.md.
const ageRange = z.enum(['4-6', '7-9', '10-12', '13+']);

const postSchema = z.object({
  profiles: z
    .array(
      z.object({
        school_id: z.string().guid(),
        age_range: ageRange,
        ordinal: z.number().int().min(1).max(10),
        // Optional birth_month + birth_year (migration 038, 2026-04-26).
        // Nullable because returning parents who added kids before this
        // shipped have no value yet — the soft-prompt banner on Family
        // settings asks for it on the next visit.
        birth_month: z.number().int().min(1).max(12).nullable().optional(),
        birth_year: z.number().int().min(2005).max(2025).nullable().optional(),
      }),
    )
    .min(1)
    .max(10),
});

export async function GET() {
  const sb = createServerSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data, error } = await sb
    .from('kid_profiles')
    .select(
      'id, school_id, age_range, ordinal, birth_month, birth_year, school:schools(name, district, type)',
    )
    .eq('user_id', user.id)
    .order('ordinal', { ascending: true });

  if (error) return NextResponse.json({ error: 'db_error', detail: error.message }, { status: 500 });
  return NextResponse.json({ profiles: data ?? [] });
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

  // DECISION: Replace-all pattern (delete then insert). RLS restricts both
  // ops to the current user via auth.uid() = user_id, so no cross-tenant risk.
  // If the insert fails, the parent is left with zero kids — acceptable since
  // the POST semantics are idempotent-replace and they can re-submit.
  const { error: delErr } = await sb.from('kid_profiles').delete().eq('user_id', user.id);
  if (delErr) return NextResponse.json({ error: 'db_error', detail: delErr.message }, { status: 500 });

  const rows = parsed.data.profiles.map((p) => ({
    user_id: user.id,
    school_id: p.school_id,
    age_range: p.age_range,
    ordinal: p.ordinal,
    birth_month: p.birth_month ?? null,
    birth_year: p.birth_year ?? null,
  }));
  const { data, error } = await sb
    .from('kid_profiles')
    .insert(rows)
    .select('id, school_id, age_range, ordinal, birth_month, birth_year');
  if (error) return NextResponse.json({ error: 'db_error', detail: error.message }, { status: 500 });

  return NextResponse.json({ profiles: data ?? [] });
}
