import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createServiceSupabase } from '@/lib/supabase/service';
import { env } from '@/lib/env';

export const dynamic = 'force-dynamic';

// DECISION: /k/[token] is outside the next-intl locale rewrite (see
// middleware matcher). The handler mints a server-side Supabase session
// for the token's owner and sets a `so-kid-session=1` cookie so the client
// ModeProvider can lock the UI into Kid Mode. The cookie is NOT httpOnly
// because the client must read it to make the lock decision; it carries no
// secret value — only the flag.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const admin = createServiceSupabase();

  // 1) Look up the token, bail if missing/revoked/expired.
  const { data: row } = await admin
    .from('kid_access_tokens')
    .select('id, user_id, expires_at, revoked_at')
    .eq('token', token)
    .maybeSingle();

  if (
    !row ||
    row.revoked_at ||
    (row.expires_at && new Date(row.expires_at) < new Date())
  ) {
    return NextResponse.redirect(`${env.APP_URL}/en/k/invalid`);
  }

  // 2) Fetch the owner's email so we can mint a magic-link for them.
  const { data: userRes } = await admin.auth.admin.getUserById(row.user_id);
  const email = userRes?.user?.email;
  if (!email) return NextResponse.redirect(`${env.APP_URL}/en/k/invalid`);

  const { data: link } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email,
    options: { redirectTo: `${env.APP_URL}/auth/callback` },
  });
  const tokenHash = link?.properties?.hashed_token;
  if (!tokenHash) return NextResponse.redirect(`${env.APP_URL}/en/k/invalid`);

  // 3) Consume the OTP server-side on THIS response so cookies land here.
  const cookieStore = cookies();
  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => cookieStore.getAll().map(({ name, value }) => ({ name, value })),
        setAll: (cs) =>
          cs.forEach(({ name, value, options }) => {
            try {
              cookieStore.set({ name, value, ...options });
            } catch {
              /* readonly in some contexts */
            }
          }),
      },
    },
  );
  const { error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: 'magiclink',
  });
  if (error) return NextResponse.redirect(`${env.APP_URL}/en/k/invalid`);

  // 4) Mark the session as locked to kid mode.
  cookieStore.set({
    name: 'so-kid-session',
    value: '1',
    httpOnly: false, // DECISION: readable by ModeProvider on the client
    path: '/',
    secure: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
  });

  // 5) Record usage.
  await admin
    .from('kid_access_tokens')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', row.id);

  // 6) Into the app.
  return NextResponse.redirect(`${env.APP_URL}/en/app`);
}
