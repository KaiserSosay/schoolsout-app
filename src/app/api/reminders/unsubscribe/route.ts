import { NextResponse } from 'next/server';
import { createServiceSupabase } from '@/lib/supabase/service';
import { env } from '@/lib/env';
import { verifyToken } from '@/lib/tokens';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const sub = url.searchParams.get('sub');
  const sig = url.searchParams.get('sig');
  if (!sub || !sig || !verifyToken(sub, sig)) {
    return NextResponse.json({ error: 'invalid_token' }, { status: 400 });
  }
  const db = createServiceSupabase();
  const { error } = await db.from('reminder_subscriptions').update({ enabled: false }).eq('id', sub);
  if (error) return NextResponse.json({ error: 'db_error' }, { status: 500 });

  // Best-effort: a parent unsubscribing from reminder emails almost always
  // means "I'm done with this app", not just "stop the email". Kill every
  // session they have so a stolen device or borrowed browser doesn't keep
  // tracking them. Failure here is non-fatal — the unsubscribe still wins.
  const { data } = await db
    .from('reminder_subscriptions')
    .select('user_id')
    .eq('id', sub)
    .single();
  if (data?.user_id) {
    await revokeAllSessions(data.user_id).catch(() => {
      /* logged below; do not block redirect */
    });
  }

  return NextResponse.redirect(new URL('/en', url));
}

async function revokeAllSessions(userId: string) {
  // GoTrue exposes /auth/v1/admin/users/{id}/logout for service-role clients
  // to invalidate every refresh token a user holds. supabase-js's typed
  // admin.signOut takes a JWT we don't have from a magic-link click, so we
  // call the REST endpoint directly with the service role key.
  const res = await fetch(
    `${env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/users/${userId}/logout`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ scope: 'global' }),
    },
  );
  if (!res.ok) {
    console.warn(
      `[unsubscribe] session-revocation failed for user ${userId}: HTTP ${res.status}`,
    );
  }
}
