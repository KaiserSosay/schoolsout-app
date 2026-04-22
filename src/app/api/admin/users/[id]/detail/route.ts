import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabase } from '@/lib/supabase/server';
import { createServiceSupabase } from '@/lib/supabase/service';
import { isAdminEmail } from '@/lib/admin';

// GET /api/admin/users/[id]/detail — lazy-loaded expander data.
//
// DECISION: Kid profiles expose only age_range + school_name. We deliberately
// do NOT return kid names / grades / display_name from the client-side family
// members (they don't live in the DB anyway). If we added them to the DB
// later, this route would also need to omit them.

const paramSchema = z.object({ id: z.string().guid() });

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const sb = createServerSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const parsed = paramSchema.safeParse({ id: params.id });
  if (!parsed.success) return NextResponse.json({ error: 'invalid_id' }, { status: 400 });

  const db = createServiceSupabase();
  const [kidsR, subsR, savesR] = await Promise.all([
    db
      .from('kid_profiles')
      .select('id, age_range, school_id, schools(name)')
      .eq('user_id', parsed.data.id)
      .order('ordinal'),
    db
      .from('reminder_subscriptions')
      .select('id, enabled, age_range, school_id, schools(name)')
      .eq('user_id', parsed.data.id),
    db
      .from('saved_camps')
      .select('id, camp_id, camps(name, slug)')
      .eq('user_id', parsed.data.id),
  ]);

  type KidJoin = {
    age_range: string;
    schools: { name: string } | { name: string }[] | null;
  };
  type SubJoin = {
    enabled: boolean;
    age_range: string;
    schools: { name: string } | { name: string }[] | null;
  };
  type SaveJoin = { camps: { name: string; slug: string } | { name: string; slug: string }[] | null };

  const pickName = (s: { name: string } | { name: string }[] | null): string | null => {
    if (!s) return null;
    if (Array.isArray(s)) return s[0]?.name ?? null;
    return s.name ?? null;
  };

  return NextResponse.json({
    kids: ((kidsR.data ?? []) as KidJoin[]).map((k) => ({
      age_range: k.age_range,
      school_name: pickName(k.schools),
    })),
    subs: ((subsR.data ?? []) as SubJoin[]).map((s) => ({
      enabled: s.enabled,
      age_range: s.age_range,
      school_name: pickName(s.schools),
    })),
    saves: ((savesR.data ?? []) as SaveJoin[])
      .map((s) => {
        const c = Array.isArray(s.camps) ? s.camps[0] : s.camps;
        return c ? { name: c.name, slug: c.slug } : null;
      })
      .filter((x): x is { name: string; slug: string } => x !== null),
  });
}
