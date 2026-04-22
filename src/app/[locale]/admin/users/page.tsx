import { createServiceSupabase } from '@/lib/supabase/service';
import { UsersClient, type AdminUserRow } from '@/components/admin/UsersClient';
import { env } from '@/lib/env';

export const dynamic = 'force-dynamic';

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

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const { search } = await searchParams;
  const db = createServiceSupabase();

  let q = db
    .from('users')
    .select(
      'id, email, display_name, preferred_language, role, coppa_consent_at, created_at, last_seen_at',
      { count: 'exact' },
    )
    .order('created_at', { ascending: false });
  if (search) q = q.ilike('email', `%${search}%`);
  const { data: userData, count } = await q.range(0, 49);
  const rows = (userData ?? []) as UserRow[];
  const ids = rows.map((r) => r.id);

  const [kidsR, subsR, savesR] = await Promise.all([
    ids.length
      ? db.from('kid_profiles').select('user_id, age_range').in('user_id', ids)
      : Promise.resolve({ data: [] }),
    ids.length
      ? db
          .from('reminder_subscriptions')
          .select('user_id')
          .in('user_id', ids)
          .eq('enabled', true)
      : Promise.resolve({ data: [] }),
    ids.length
      ? db.from('saved_camps').select('user_id').in('user_id', ids)
      : Promise.resolve({ data: [] }),
  ]);

  const kidCount = new Map<string, number>();
  const ageRangesByUser = new Map<string, Set<string>>();
  for (const k of (kidsR.data ?? []) as { user_id: string; age_range: string }[]) {
    kidCount.set(k.user_id, (kidCount.get(k.user_id) ?? 0) + 1);
    const s = ageRangesByUser.get(k.user_id) ?? new Set<string>();
    s.add(k.age_range);
    ageRangesByUser.set(k.user_id, s);
  }
  const reminderCount = new Map<string, number>();
  for (const r of (subsR.data ?? []) as { user_id: string }[]) {
    reminderCount.set(r.user_id, (reminderCount.get(r.user_id) ?? 0) + 1);
  }
  const savedCount = new Map<string, number>();
  for (const s of (savesR.data ?? []) as { user_id: string }[]) {
    savedCount.set(s.user_id, (savedCount.get(s.user_id) ?? 0) + 1);
  }

  const adminEmails = new Set(
    (env.ADMIN_EMAILS || '')
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
  );

  const users: AdminUserRow[] = rows.map((r) => ({
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

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-black text-ink">Users</h2>
        <p className="text-xs font-bold text-muted">
          Email is the primary identifier. Click a row to expand kids (age range + school only), reminder subscriptions, and saved camps. COPPA delete cascades through every linked table.
        </p>
      </div>
      <UsersClient
        initialUsers={users}
        initialTotal={count ?? users.length}
        initialSearch={search ?? ''}
      />
    </div>
  );
}
