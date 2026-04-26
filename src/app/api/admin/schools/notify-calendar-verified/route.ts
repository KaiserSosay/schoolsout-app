// Admin batch trigger: sends "your school's calendar is now verified"
// emails to everyone who tapped "Notify me" on the unverified-calendar
// placeholder for this school. Idempotent — once a row's notified_at
// is stamped, we skip it on rerun.
//
// Expected flow: when migration 035 (or any future calendar migration)
// flips a school's calendar_status to verified_*, an admin opens the
// admin dashboard and hits this endpoint for that school. The first
// batch out of the gate covers TGP — Noah and Mom are likely on the
// list since they tapped "Notify me" during round-3 testing.

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { Resend } from 'resend';
import { render } from '@react-email/render';
import { requireAdminApi } from '@/lib/auth/requireAdmin';
import { createServiceSupabase } from '@/lib/supabase/service';
import { env } from '@/lib/env';
import { SchoolCalendarVerifiedEmail } from '@/lib/email/SchoolCalendarVerifiedEmail';

const schema = z.object({
  school_id: z.string().min(1),
});

type PendingRow = {
  id: string;
  user_id: string;
};

type UserRow = {
  id: string;
  email: string;
  preferred_language: string | null;
};

type SchoolRow = {
  id: string;
  slug: string;
  name: string;
};

export async function POST(req: Request) {
  const guard = await requireAdminApi();
  if (!guard.ok) return guard.response;

  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }

  const db = createServiceSupabase();
  const { data: school } = (await db
    .from('schools')
    .select('id, slug, name')
    .eq('id', parsed.data.school_id)
    .maybeSingle()) as { data: SchoolRow | null };
  if (!school) {
    return NextResponse.json({ error: 'school_not_found' }, { status: 404 });
  }

  const { data: pending } = (await db
    .from('school_calendar_notifications')
    .select('id, user_id')
    .eq('school_id', school.id)
    .is('notified_at', null)) as { data: PendingRow[] | null };
  const pendingRows = pending ?? [];
  if (pendingRows.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, school: school.slug });
  }

  const userIds = pendingRows.map((r) => r.user_id);
  const { data: users } = (await db
    .from('users')
    .select('id, email, preferred_language')
    .in('id', userIds)) as { data: UserRow[] | null };
  const usersById = new Map((users ?? []).map((u) => [u.id, u]));

  const resend = new Resend(env.RESEND_API_KEY);
  const sentRowIds: string[] = [];
  const failed: Array<{ user_id: string; reason: string }> = [];

  for (const row of pendingRows) {
    const u = usersById.get(row.user_id);
    if (!u) {
      failed.push({ user_id: row.user_id, reason: 'user_missing' });
      continue;
    }
    const locale: 'en' | 'es' = u.preferred_language === 'es' ? 'es' : 'en';
    const schoolPageUrl = `${env.APP_URL}/${locale}/schools/${school.slug}`;
    const html = await render(
      SchoolCalendarVerifiedEmail({
        locale,
        schoolName: school.name,
        schoolPageUrl,
      }),
    );
    const subject =
      locale === 'es'
        ? `${school.name}: el calendario ya está verificado`
        : `${school.name}'s calendar is now verified`;
    const result = await resend.emails.send({
      from: 'Noah at School\'s Out! <hi@schoolsout.net>',
      to: u.email,
      subject,
      html,
    });
    if (result.error) {
      failed.push({ user_id: row.user_id, reason: result.error.message });
    } else {
      sentRowIds.push(row.id);
    }
  }

  if (sentRowIds.length > 0) {
    await db
      .from('school_calendar_notifications')
      .update({ notified_at: new Date().toISOString() })
      .in('id', sentRowIds);
  }

  return NextResponse.json({
    ok: true,
    sent: sentRowIds.length,
    failed: failed.length,
    school: school.slug,
  });
}
