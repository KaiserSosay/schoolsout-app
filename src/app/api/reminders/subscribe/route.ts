import { NextResponse } from 'next/server';
import { z } from 'zod';
import { Resend } from 'resend';
import { render } from '@react-email/render';
import { createServiceSupabase } from '@/lib/supabase/service';
import { env } from '@/lib/env';
import { ConfirmEmail } from '@/lib/email/ConfirmEmail';

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

  // DECISION: Use generateLink() instead of inviteUserByEmail(). inviteUserByEmail
  // sends Supabase's built-in English-only email from noreply@mail.app.supabase.io —
  // which confused users (two emails, one without a link). generateLink RETURNS
  // the action_link WITHOUT sending — we then embed it in our single branded
  // bilingual Resend email.
  let actionLink: string | undefined;
  let userId: string | undefined;

  const inviteResult = await db.auth.admin.generateLink({
    type: 'invite',
    email,
    options: {
      redirectTo: `${env.APP_URL}/${locale}/reminders/confirm`,
      data: { preferred_language: locale, coppa_consent_at: new Date().toISOString() },
    },
  });

  if (inviteResult.data?.properties?.action_link && inviteResult.data.user) {
    actionLink = inviteResult.data.properties.action_link;
    userId = inviteResult.data.user.id;
  } else {
    // DECISION: Fall back to magiclink when invite fails (user likely already
    // exists). magiclink works for existing users; invite only works for new.
    const magicResult = await db.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: { redirectTo: `${env.APP_URL}/${locale}/reminders/confirm` },
    });
    if (magicResult.data?.properties?.action_link && magicResult.data.user) {
      actionLink = magicResult.data.properties.action_link;
      userId = magicResult.data.user.id;
    }
  }

  if (!actionLink || !userId) {
    return NextResponse.json({ error: 'link_generation_failed' }, { status: 500 });
  }

  await db.from('users').update({ preferred_language: locale }).eq('id', userId);

  const { error } = await db
    .from('reminder_subscriptions')
    .upsert(
      { user_id: userId, school_id, age_range, enabled: true },
      { onConflict: 'user_id,school_id' },
    );
  if (error) return NextResponse.json({ error: 'db_error' }, { status: 500 });

  // DECISION: Gate the Resend send on env.RESEND_API_KEY existence for local dev.
  if (process.env.RESEND_API_KEY) {
    const subject =
      locale === 'es'
        ? "Confirma tu suscripción a School's Out!"
        : "Confirm your School's Out! reminder subscription";
    try {
      const resend = new Resend(env.RESEND_API_KEY);
      const html = await render(ConfirmEmail({ locale, confirmUrl: actionLink }));
      await resend.emails.send({
        from: "School's Out! <hello@schoolsout.net>",
        to: email,
        subject,
        html,
      });
    } catch (err) {
      // DECISION: If Resend send fails, log but don't fail the request — the
      // user can request another link, and the subscription is already saved.
      console.error('[subscribe] resend send failed', err);
    }
  }

  return NextResponse.json({ ok: true });
}
