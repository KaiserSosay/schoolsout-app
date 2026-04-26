import { redirect } from 'next/navigation';
import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { createServiceSupabase } from '@/lib/supabase/service';
import { isAdminEmail } from '@/lib/admin';

export type AdminRole = 'admin' | 'superadmin';

// Two-path admin check:
//   1. Primary: users.role ∈ {'admin', 'superadmin'} (DB-driven, rotatable)
//   2. Fallback: isAdminEmail(user.email) via env ADMIN_EMAILS (deploy-time)
//
// Having both is deliberate: the DB role is the long-term source of truth,
// but the env allowlist is a break-glass that works even if the users table
// is corrupted or RLS is misconfigured. Whichever matches first, we log
// which path granted access.
// Exported variant of resolveAdminRole. Callers (e.g. /app layout) use this
// to surface admin-only UI without redirecting non-admins. Returns the role
// when the user has one, otherwise null. Never throws.
export async function getAdminRole(
  userId: string,
  email: string | null,
): Promise<AdminRole | null> {
  return resolveAdminRole(userId, email);
}

async function resolveAdminRole(
  userId: string,
  email: string | null,
): Promise<AdminRole | null> {
  try {
    const db = createServiceSupabase();
    const { data } = await db
      .from('users')
      .select('role')
      .eq('id', userId)
      .maybeSingle();
    const role = (data?.role as string | undefined) ?? null;
    if (role === 'admin' || role === 'superadmin') return role;
  } catch (err) {
    console.warn('[auth] role lookup failed, falling back to env', err);
  }
  if (isAdminEmail(email)) return 'admin';
  return null;
}

// For Server Components (pages + layouts): redirects on failure. Use at the
// top of every /admin/* server component so unauthorized visitors never see
// DB data, just a redirect.
export async function requireAdminPage(opts?: { redirectTo?: string }): Promise<{
  user: { id: string; email: string | null };
  role: AdminRole;
}> {
  const redirectTo = opts?.redirectTo ?? '/en';
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    console.warn('[auth] admin redirect: anon → redirect to', redirectTo);
    redirect(redirectTo);
  }

  const role = await resolveAdminRole(user.id, user.email ?? null);
  if (!role) {
    console.warn(
      '[auth] admin redirect: user',
      user.id,
      'no admin role → redirect',
    );
    redirect(redirectTo);
  }
  return { user: { id: user.id, email: user.email ?? null }, role };
}

// For API Route Handlers: returns a NextResponse on failure. Call and early-
// return the response if ok=false.
type AdminApiResult =
  | { ok: true; user: { id: string; email: string | null }; role: AdminRole }
  | { ok: false; response: NextResponse };

export async function requireAdminApi(): Promise<AdminApiResult> {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    console.warn('[auth] admin api 401: anon');
    return {
      ok: false,
      response: NextResponse.json({ error: 'unauthorized' }, { status: 401 }),
    };
  }
  const role = await resolveAdminRole(user.id, user.email ?? null);
  if (!role) {
    console.warn('[auth] admin api 403: user', user.id, 'no admin role');
    return {
      ok: false,
      response: NextResponse.json({ error: 'forbidden' }, { status: 403 }),
    };
  }
  return { ok: true, user: { id: user.id, email: user.email ?? null }, role };
}
