import { NextResponse } from 'next/server';
import { z } from 'zod';
import { Resend } from 'resend';
import { render } from '@react-email/render';
import { createServerSupabase } from '@/lib/supabase/server';
import { createServiceSupabase } from '@/lib/supabase/service';
import { env } from '@/lib/env';
import { SchoolRequestNotifyEmail } from '@/lib/email/SchoolRequestNotifyEmail';

// Phase 3.0 / Item 3.1 — parents who can't find their school in the
// SchoolAutocomplete tap "+ Add" and we land their typed name here.
//
// TODO: Phase 4 — when a school_request lands, automatically kick off a
// Cowork-style background research job to find the school's calendar PDF
// and propose closure rows for admin review. For now, admin manually
// researches and adds via the schools admin tab.

export const dynamic = 'force-dynamic';

const schema = z.object({
  requested_name: z.string().min(2).max(120),
  city: z.string().max(80).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }
  const { requested_name, city, notes } = parsed.data;

  const sb = createServerSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();

  const db = createServiceSupabase();

  let displayName: string | null = null;
  if (user) {
    const { data: row } = await db
      .from('users')
      .select('display_name')
      .eq('id', user.id)
      .maybeSingle();
    displayName = (row?.display_name as string | null) ?? null;
  }

  const { data: inserted, error } = await db
    .from('school_requests')
    .insert({
      user_id: user?.id ?? null,
      requested_name: requested_name.trim(),
      city: city?.trim() || null,
      notes: notes?.trim() || null,
    })
    .select('id')
    .single();
  if (error || !inserted) {
    console.error('[school-requests] insert failed', error);
    return NextResponse.json({ error: 'db_error' }, { status: 500 });
  }

  // Fire-and-forget admin notification — same pattern as feature-requests.
  if (process.env.RESEND_API_KEY) {
    try {
      const adminUrl = `${env.APP_URL}/en/admin?tab=school-requests&id=${inserted.id}`;
      const template = SchoolRequestNotifyEmail({
        requestedName: requested_name.trim(),
        city: city?.trim() || null,
        notes: notes?.trim() || null,
        submitter: user
          ? { email: user.email ?? null, displayName, isLoggedIn: true }
          : { email: null, displayName: null, isLoggedIn: false },
        adminUrl,
      });
      const html = await render(template);
      const resend = new Resend(env.RESEND_API_KEY);
      await resend.emails.send({
        from: "School's Out! <hello@schoolsout.net>",
        to: env.ADMIN_NOTIFY_EMAIL,
        subject: `🏫 New school requested: ${requested_name.trim().slice(0, 80)}`,
        html,
      });
    } catch (err) {
      console.error('[school-requests] notify send failed', err);
    }
  }

  return NextResponse.json({ ok: true, id: inserted.id });
}
