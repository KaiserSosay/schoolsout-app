import { NextResponse } from 'next/server';
import { z } from 'zod';
import { Resend } from 'resend';
import { render } from '@react-email/render';
import { createServiceSupabase } from '@/lib/supabase/service';
import { env } from '@/lib/env';
import { WelcomeEmail } from '@/lib/email/WelcomeEmail';
import { WelcomeBackEmail } from '@/lib/email/WelcomeBackEmail';
import { welcomeSubject } from '@/lib/email/subjects';
import { signToken } from '@/lib/tokens';

const schema = z.object({
  email: z.string().email(),
  // DECISION: `.guid()` instead of `.uuid()` — Zod 4's uuid() rejects the
  // Phase-0 seed UUID `00000000-0000-0000-0000-...` (version digit 0 is
  // non-RFC). `guid()` accepts any UUID-shaped string.
  school_id: z.string().guid(),
  age_range: z.enum(['4-6', '7-9', 'all']),
  locale: z.enum(['en', 'es']),
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: 'invalid_body' }, { status: 400 });

  const { email, school_id, age_range, locale } = parsed.data;
  const db = createServiceSupabase();

  // DECISION (Goal 1 warmth pass): Detect new-vs-returning BEFORE generating
  // the auth link. This lets us pick the right Supabase link type up front
  // (magiclink for returning, invite for new) AND lets the client render a
  // different success pane. We query public.users — which is populated by
  // our Supabase trigger for every auth.users insert — via service role.
  const { data: existingRow } = await db
    .from('users')
    .select('id')
    .eq('email', email)
    .maybeSingle();
  const isReturning = Boolean(existingRow?.id);

  // DECISION: We do NOT embed the returned `action_link` directly. That link
  // hits Supabase's /auth/v1/verify endpoint, which on this project emits an
  // implicit-flow redirect (tokens in the URL hash fragment). A Server
  // Component cannot read a hash fragment, so the confirm page always saw no
  // user and rendered the error state. Instead we build our own callback URL
  // that carries `token_hash` + `type` as query params, then on the server
  // call supabase.auth.verifyOtp({ token_hash, type }) to mint the session.
  let tokenHash: string | undefined;
  let verificationType: string | undefined;
  let userId: string | undefined;

  // DECISION: Post-confirm destination is now the logged-in app. The callback
  // checks kid_profiles count and redirects to /app/onboarding on zero, which
  // kills the old "You're all set" dead end.
  const nextPath = `/${locale}/app`;
  const buildCallbackUrl = (hash: string, t: string) =>
    `${env.APP_URL}/auth/callback?token_hash=${encodeURIComponent(hash)}&type=${encodeURIComponent(
      t,
    )}&next=${encodeURIComponent(nextPath)}`;

  // redirectTo is still passed for Supabase bookkeeping — it becomes the
  // `redirect_to` on the generated link, which we ignore when building our
  // own callback URL but keep as a fallback for any system that inspects it.
  const inviteRedirect = `${env.APP_URL}/auth/callback?next=${encodeURIComponent(nextPath)}`;

  // DECISION: Pick link type from the isReturning detection. Keep the
  // invite→magiclink fallback as a safety net — if the public.users row is
  // stale or a race condition causes invite to fail for an existing user,
  // we still recover via magiclink.
  const primaryType: 'invite' | 'magiclink' = isReturning ? 'magiclink' : 'invite';
  const fallbackType: 'invite' | 'magiclink' = isReturning ? 'invite' : 'magiclink';

  const primaryOptions =
    primaryType === 'invite'
      ? {
          redirectTo: inviteRedirect,
          data: { preferred_language: locale, coppa_consent_at: new Date().toISOString() },
        }
      : { redirectTo: inviteRedirect };

  const primaryResult = await db.auth.admin.generateLink({
    type: primaryType,
    email,
    options: primaryOptions,
  });

  if (
    primaryResult.data?.properties?.hashed_token &&
    primaryResult.data?.properties?.verification_type &&
    primaryResult.data.user
  ) {
    tokenHash = primaryResult.data.properties.hashed_token;
    verificationType = primaryResult.data.properties.verification_type;
    userId = primaryResult.data.user.id;
  } else {
    // Fallback path — inverse link type. Preserves the pre-warmth-pass
    // behavior of "invite first, magiclink on error" without the detection,
    // just inverted by whatever we tried first.
    const fallbackOptions =
      fallbackType === 'invite'
        ? {
            redirectTo: inviteRedirect,
            data: { preferred_language: locale, coppa_consent_at: new Date().toISOString() },
          }
        : { redirectTo: inviteRedirect };

    const fallbackResult = await db.auth.admin.generateLink({
      type: fallbackType,
      email,
      options: fallbackOptions,
    });
    if (
      fallbackResult.data?.properties?.hashed_token &&
      fallbackResult.data?.properties?.verification_type &&
      fallbackResult.data.user
    ) {
      tokenHash = fallbackResult.data.properties.hashed_token;
      verificationType = fallbackResult.data.properties.verification_type;
      userId = fallbackResult.data.user.id;
    }
  }

  if (!tokenHash || !verificationType || !userId) {
    return NextResponse.json({ error: 'link_generation_failed' }, { status: 500 });
  }

  const actionLink = buildCallbackUrl(tokenHash, verificationType);

  // DECISION: Log just a short debug line (no token) so Vercel captures the
  // redirect target when triaging. Useful evidence for future auth regressions.
  console.log('[subscribe] generated', {
    type: verificationType,
    isReturning,
    hasLink: Boolean(actionLink),
    linkHost: new URL(actionLink).host,
    next: nextPath,
  });

  await db.from('users').update({ preferred_language: locale }).eq('id', userId);

  // DECISION (Goal 2): Capture the subscription id on upsert so we can build
  // the HMAC-signed unsubscribe link for the welcome email footer — matching
  // the pattern in src/app/api/cron/send-reminders/route.ts.
  const { data: subRows, error } = await db
    .from('reminder_subscriptions')
    .upsert(
      { user_id: userId, school_id, age_range, enabled: true },
      { onConflict: 'user_id,school_id' },
    )
    .select('id');
  if (error) return NextResponse.json({ error: 'db_error' }, { status: 500 });
  const subscriptionId = subRows?.[0]?.id as string | undefined;
  const unsubscribeUrl = subscriptionId
    ? `${env.APP_URL}/api/reminders/unsubscribe?sub=${subscriptionId}&sig=${signToken(subscriptionId)}`
    : undefined;

  // DECISION: Gate the Resend send on env.RESEND_API_KEY existence for local dev.
  // DECISION: From-address stays `hello@schoolsout.net` — that's what the
  // existing ReminderEmail flow uses and what the schoolsout.net Resend
  // domain is verified for. The "Noah at" friendly name (Cheers vibe)
  // sits on the same verified mailbox.
  if (process.env.RESEND_API_KEY) {
    const subject = welcomeSubject(isReturning, locale);
    try {
      const resend = new Resend(env.RESEND_API_KEY);
      const template = isReturning
        ? WelcomeBackEmail({ locale, magicLinkUrl: actionLink, unsubscribeUrl })
        : WelcomeEmail({ locale, magicLinkUrl: actionLink, unsubscribeUrl });
      const html = await render(template);
      await resend.emails.send({
        from: "Noah at School's Out! <hello@schoolsout.net>",
        to: email,
        subject,
        html,
        headers: unsubscribeUrl ? { 'List-Unsubscribe': `<${unsubscribeUrl}>` } : undefined,
      });
    } catch (err) {
      // DECISION: If Resend send fails, log but don't fail the request — the
      // user can request another link, and the subscription is already saved.
      // The client still receives isReturning so the success pane renders
      // correctly regardless of email delivery.
      console.error('[subscribe] resend send failed', err);
    }
  }

  return NextResponse.json({ ok: true, isReturning });
}
