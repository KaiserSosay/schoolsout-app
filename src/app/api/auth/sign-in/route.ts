import { NextResponse } from 'next/server';
import { z } from 'zod';
import { Resend } from 'resend';
import { render } from '@react-email/render';
import { createServiceSupabase } from '@/lib/supabase/service';
import { env } from '@/lib/env';
import { WelcomeEmail } from '@/lib/email/WelcomeEmail';
import { WelcomeBackEmail } from '@/lib/email/WelcomeBackEmail';
import { welcomeSubject } from '@/lib/email/subjects';

// DECISION: dedicated sign-in endpoint, separate from /api/reminders/subscribe.
// Sign-in must NOT subscribe a user to anything — they may already be a
// returning user landing here from the top nav. We just want to send them a
// magic link (or invite link if the email is unknown) and bounce them through
// /auth/callback. Reuses the same generateLink + WelcomeBack/Welcome templates
// so the warm copy stays consistent with the signup flow.

const NEXT_RE = /^\/(en|es)(\/|$)/;

const schema = z.object({
  email: z.string().email(),
  locale: z.enum(['en', 'es']),
  // Optional same-origin destination preserved through the magic-link round
  // trip (e.g. /en/app/camps/frost-science-summer). Sanitised below.
  next: z.string().optional(),
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: 'invalid_body' }, { status: 400 });

  const { email, locale } = parsed.data;
  const safeNext = parsed.data.next && NEXT_RE.test(parsed.data.next)
    ? parsed.data.next
    : `/${locale}/app`;

  const db = createServiceSupabase();

  const { data: existingRow } = await db
    .from('users')
    .select('id')
    .eq('email', email)
    .maybeSingle();
  const isReturning = Boolean(existingRow?.id);

  const buildCallbackUrl = (hash: string, t: string) =>
    `${env.APP_URL}/auth/callback?token_hash=${encodeURIComponent(hash)}&type=${encodeURIComponent(
      t,
    )}&next=${encodeURIComponent(safeNext)}`;
  const inviteRedirect = `${env.APP_URL}/auth/callback?next=${encodeURIComponent(safeNext)}`;

  const primaryType: 'invite' | 'magiclink' = isReturning ? 'magiclink' : 'invite';
  const fallbackType: 'invite' | 'magiclink' = isReturning ? 'invite' : 'magiclink';

  const primaryOptions =
    primaryType === 'invite'
      ? {
          redirectTo: inviteRedirect,
          data: { preferred_language: locale, coppa_consent_at: new Date().toISOString() },
        }
      : { redirectTo: inviteRedirect };

  let tokenHash: string | undefined;
  let verificationType: string | undefined;

  const primaryResult = await db.auth.admin.generateLink({
    type: primaryType,
    email,
    options: primaryOptions,
  });

  if (
    primaryResult.data?.properties?.hashed_token &&
    primaryResult.data?.properties?.verification_type
  ) {
    tokenHash = primaryResult.data.properties.hashed_token;
    verificationType = primaryResult.data.properties.verification_type;
  } else {
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
      fallbackResult.data?.properties?.verification_type
    ) {
      tokenHash = fallbackResult.data.properties.hashed_token;
      verificationType = fallbackResult.data.properties.verification_type;
    }
  }

  if (!tokenHash || !verificationType) {
    return NextResponse.json({ error: 'link_generation_failed' }, { status: 500 });
  }

  const actionLink = buildCallbackUrl(tokenHash, verificationType);

  if (process.env.RESEND_API_KEY) {
    try {
      const resend = new Resend(env.RESEND_API_KEY);
      const template = isReturning
        ? WelcomeBackEmail({ locale, magicLinkUrl: actionLink })
        : WelcomeEmail({ locale, magicLinkUrl: actionLink });
      const html = await render(template);
      await resend.emails.send({
        from: "Noah at School's Out! <hello@schoolsout.net>",
        to: email,
        subject: welcomeSubject(isReturning, locale),
        html,
      });
    } catch (err) {
      console.error('[auth/sign-in] resend send failed', err);
    }
  }

  return NextResponse.json({ ok: true, isReturning });
}
