import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceSupabase } from '@/lib/supabase/service';
import { Resend } from 'resend';
import { env } from '@/lib/env';

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

  const { data: authRes, error: authErr } = await db.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${env.APP_URL}/${locale}/reminders/confirm`,
    data: { preferred_language: locale, coppa_consent_at: new Date().toISOString() },
  });
  let userId = authRes?.user?.id;
  if (authErr || !userId) {
    const { data: list } = await db.auth.admin.listUsers();
    userId = list?.users?.find((u) => u.email === email)?.id;
  }
  if (!userId) return NextResponse.json({ error: 'user_creation_failed' }, { status: 500 });

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
    const resend = new Resend(env.RESEND_API_KEY);
    const subject = locale === 'es'
      ? 'Confirma tu suscripción a School\'s Out!'
      : "Confirm your School's Out! reminder subscription";
    await resend.emails.send({
      from: "School's Out! <hello@schoolsout.net>",
      to: email,
      subject,
      html: locale === 'es'
        ? `<p>Haz clic para confirmar tu correo. Ya casi: revisa tu bandeja por el enlace mágico.</p>`
        : `<p>We sent a magic link to confirm your email. Check your inbox to finish signup.</p>`,
    });
  }

  return NextResponse.json({ ok: true });
}
