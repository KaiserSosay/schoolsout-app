import { NextResponse } from 'next/server';
import { render } from '@react-email/render';
import { Resend } from 'resend';
import { createServiceSupabase } from '@/lib/supabase/service';
import { env } from '@/lib/env';
import { computeReminderWindow } from './dates';
import { ReminderEmail } from '@/lib/email/ReminderEmail';
import { signToken } from '@/lib/tokens';

function authorize(req: Request) {
  const auth = req.headers.get('authorization') ?? '';
  return auth === `Bearer ${env.CRON_SECRET}`;
}

export async function GET(req: Request) {
  if (!authorize(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const db = createServiceSupabase();
  const { d3, d7, d14 } = computeReminderWindow();

  const { data: closures } = await db
    .from('closures')
    .select('id, school_id, name, start_date, end_date, emoji')
    .eq('status', 'verified')
    .in('start_date', [d3, d7, d14]);

  let sent = 0;
  const resend = process.env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

  for (const c of closures ?? []) {
    const days = (c.start_date === d3 ? 3 : c.start_date === d7 ? 7 : 14) as 3 | 7 | 14;
    const { data: subs } = await db
      .from('reminder_subscriptions')
      .select('id, user_id, users!inner(email, preferred_language)')
      .eq('school_id', c.school_id)
      .eq('enabled', true);
    for (const s of subs ?? []) {
      // Insert send row first (idempotency via UNIQUE constraint)
      const { data: inserted, error: dedupErr } = await db
        .from('reminder_sends')
        .insert({ subscription_id: s.id, closure_id: c.id, days_before: days })
        .select('id')
        .single();
      if (dedupErr) continue;

      const sub = s as unknown as { id: string; users: { email: string; preferred_language: 'en' | 'es' } };
      const locale = sub.users.preferred_language;
      const unsubscribeUrl = `${env.APP_URL}/api/reminders/unsubscribe?sub=${s.id}&sig=${signToken(s.id)}`;
      const html = await render(ReminderEmail({
        locale,
        closureName: c.name,
        startDate: c.start_date,
        endDate: c.end_date,
        emoji: c.emoji,
        daysBefore: days,
        unsubscribeUrl,
      }));
      if (resend && inserted?.id) {
        await resend.emails.send({
          from: "School's Out! <reminders@schoolsout.net>",
          to: sub.users.email,
          subject: locale === 'es' ? `⏳ ${c.name} en ${days} días` : `⏳ ${c.name} in ${days} days`,
          html,
          headers: { 'List-Unsubscribe': `<${unsubscribeUrl}>` },
          tags: [{ name: 'send_id', value: inserted.id }],
        });
      }
      sent++;
    }
  }

  return NextResponse.json({ ok: true, sent });
}
