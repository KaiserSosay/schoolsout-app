import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { env } from '@/lib/env';
import type { EmailOtpType } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

// DECISION: absolute origin from APP_URL ensures we don't leak preview-deployment
// URLs into redirects. Both `code` (PKCE) and `token_hash+type` (admin-generated
// link) paths are supported so whichever query-param shape arrives, we can mint
// the session server-side and set Supabase SSR cookies before redirecting.
//
// DECISION: After a successful verify we look up `kid_profiles` for the current
// user. Zero profiles => onboarding. One or more => honour `next` (falling back
// to /{locale}/app). The old "You're all set" destination was a dead end.
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const tokenHash = url.searchParams.get('token_hash');
  const type = url.searchParams.get('type'); // e.g. 'invite', 'magiclink', 'signup', 'recovery'
  const next = url.searchParams.get('next') ?? '/en/app';
  const origin = env.APP_URL;

  // DECISION: failure destination mirrors the locale encoded in `next`. When
  // `next` starts with `/en/` or `/es/` we route failures to the matching
  // locale's confirm-failed page so the user doesn't see a language mismatch.
  const localeMatch = next.match(/^\/(en|es)(\/|$)/);
  const locale = localeMatch?.[1] ?? 'en';
  const failUrl = (reason: string) =>
    `${origin}/${locale}/reminders/confirm-failed?reason=${encodeURIComponent(reason)}`;

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

  // DECISION: post-verify destination resolver. Onboarded users go to `next`
  // (sanitised to a same-origin /en|/es path), non-onboarded users to /app/onboarding.
  async function resolveDestination(): Promise<string> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return `${origin}${next}`;

    // Sanitise next: must be a same-origin locale-prefixed path.
    const safeNext = /^\/(en|es)(\/|$)/.test(next) ? next : `/${locale}/app`;

    try {
      const { count } = await supabase
        .from('kid_profiles')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id);
      if (!count || count === 0) {
        return `${origin}/${locale}/app/onboarding`;
      }
    } catch (err) {
      // DECISION: swallow — if the kid_profiles lookup fails we still send the
      // user into the app; the onboarding page is idempotent so a retry is safe.
      console.error('[auth/callback] kid_profiles count failed', err);
    }
    return `${origin}${safeNext}`;
  }

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as EmailOtpType,
    });
    if (!error) {
      console.log('[auth/callback] verifyOtp ok', { type });
      const dest = await resolveDestination();
      return NextResponse.redirect(dest);
    }
    console.error('[auth/callback] verifyOtp failed:', error.message);
    return NextResponse.redirect(failUrl(error.message));
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      console.log('[auth/callback] exchangeCodeForSession ok');
      const dest = await resolveDestination();
      return NextResponse.redirect(dest);
    }
    console.error('[auth/callback] exchangeCodeForSession failed:', error.message);
    return NextResponse.redirect(failUrl(error.message));
  }

  console.error(
    '[auth/callback] missing code and token_hash params:',
    Object.fromEntries(url.searchParams),
  );
  return NextResponse.redirect(failUrl('missing_params'));
}
