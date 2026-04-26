import { createServerSupabase } from '@/lib/supabase/server';
import { createServiceSupabase } from '@/lib/supabase/service';

export type OperatorCheck =
  | { ok: true; user: { id: string; email: string | null }; campId: string; role: 'owner' | 'manager' }
  | { ok: false; reason: 'no_user' | 'no_camp' | 'not_operator' };

// Verify the current cookie-authenticated user has a camp_operators row for
// the camp identified by `slug`. Returns enough info for the page to render
// without re-querying. Both `no_user` and `no_camp` and `not_operator`
// collapse to a 404 in the UI — we never reveal which case it is, so an
// attacker can't probe to learn which slugs exist.
export async function checkOperatorAccess(
  slug: string,
): Promise<OperatorCheck> {
  const sb = createServerSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return { ok: false, reason: 'no_user' };

  const db = createServiceSupabase();
  const { data: camp } = await db
    .from('camps')
    .select('id')
    .eq('slug', slug)
    .maybeSingle();
  if (!camp) return { ok: false, reason: 'no_camp' };

  const { data: op } = await db
    .from('camp_operators')
    .select('role')
    .eq('camp_id', camp.id)
    .eq('user_id', user.id)
    .maybeSingle();
  if (!op) return { ok: false, reason: 'not_operator' };

  return {
    ok: true,
    user: { id: user.id, email: user.email ?? null },
    campId: camp.id,
    role: op.role as 'owner' | 'manager',
  };
}
