import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabase } from '@/lib/supabase/server';
import { createServiceSupabase } from '@/lib/supabase/service';
import { isAdminEmail } from '@/lib/admin';
import { env } from '@/lib/env';

export const dynamic = 'force-dynamic';

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
  search: z.string().trim().max(100).optional(),
});

type UserRow = {
  id: string;
  email: string;
  display_name: string | null;
  preferred_language: string;
  role: string;
  coppa_consent_at: string;
  created_at: string;
  last_seen_at: string | null;
};

export async function GET(req: Request) {
  const sb = createServerSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const url = new URL(req.url);
  const parsed = querySchema.safeParse({
    limit: url.searchParams.get('limit') ?? undefined,
    offset: url.searchParams.get('offset') ?? undefined,
    search: url.searchParams.get('search') ?? undefined,
  });
  if (!parsed.success) return NextResponse.json({ error: 'invalid_query' }, { status: 400 });
  const { limit, offset, search } = parsed.data;

  const db = createServiceSupabase();

  // DECISION: Filter by email fragment with ilike. Matching against the users
  // view only — we'll hydrate counts in a second round of queries. Keeps
  // pagination simple and avoids N+1 over joins.
  let q = db
    .from('users')
    .select(
      'id, email, display_name, preferred_language, role, coppa_consent_at, created_at, last_seen_at',
      { count: 'exact' },
    )
    .order('created_at', { ascending: false });
  if (search) {
    q = q.ilike('email', `%${search}%`);
  }
  const { data: usersData, error, count } = await q.range(offset, offset + limit - 1);
  if (error) return NextResponse.json({ error: 'db_error', detail: error.message }, { status: 500 });

  const rows = (usersData ?? []) as UserRow[];
  const ids = rows.map((r) => r.id);

  // Parallel hydrate.
  const [kidsResp, remindersResp, savedResp] = await Promise.all([
    ids.length
      ? db.from('kid_profiles').select('user_id, age_range').in('user_id', ids)
      : Promise.resolve({ data: [], error: null }),
    ids.length
      ? db
          .from('reminder_subscriptions')
          .select('user_id, enabled')
          .in('user_id', ids)
          .eq('enabled', true)
      : Promise.resolve({ data: [], error: null }),
    ids.length
      ? db.from('saved_camps').select('user_id').in('user_id', ids)
      : Promise.resolve({ data: [], error: null }),
  ]);

  const kidCount = new Map<string, number>();
  const ageRangesByUser = new Map<string, Set<string>>();
  for (const k of (kidsResp.data ?? []) as { user_id: string; age_range: string }[]) {
    kidCount.set(k.user_id, (kidCount.get(k.user_id) ?? 0) + 1);
    const s = ageRangesByUser.get(k.user_id) ?? new Set<string>();
    s.add(k.age_range);
    ageRangesByUser.set(k.user_id, s);
  }
  const reminderCount = new Map<string, number>();
  for (const r of (remindersResp.data ?? []) as { user_id: string }[]) {
    reminderCount.set(r.user_id, (reminderCount.get(r.user_id) ?? 0) + 1);
  }
  const savedCount = new Map<string, number>();
  for (const s of (savedResp.data ?? []) as { user_id: string }[]) {
    savedCount.set(s.user_id, (savedCount.get(s.user_id) ?? 0) + 1);
  }

  const adminEmails = new Set(
    (env.ADMIN_EMAILS || '')
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
  );

  const users = rows.map((r) => ({
    id: r.id,
    email: r.email,
    display_name: r.display_name,
    preferred_language: r.preferred_language,
    role: r.role,
    coppa_consent_at: r.coppa_consent_at,
    created_at: r.created_at,
    last_seen_at: r.last_seen_at,
    kidCount: kidCount.get(r.id) ?? 0,
    ageRanges: Array.from(ageRangesByUser.get(r.id) ?? []).sort(),
    activeReminders: reminderCount.get(r.id) ?? 0,
    savedCamps: savedCount.get(r.id) ?? 0,
    isAdmin: adminEmails.has(r.email.toLowerCase()),
  }));

  return NextResponse.json({ users, total: count ?? users.length });
}
