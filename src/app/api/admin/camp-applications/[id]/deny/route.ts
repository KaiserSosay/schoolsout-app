import { NextResponse } from 'next/server';
import { z } from 'zod';
import { Resend } from 'resend';
import { render } from '@react-email/render';
import { createServerSupabase } from '@/lib/supabase/server';
import { createServiceSupabase } from '@/lib/supabase/service';
import { isAdminEmail } from '@/lib/admin';
import { env } from '@/lib/env';
import { CampRequestDeniedEmail } from '@/lib/email/CampRequestDeniedEmail';

export const dynamic = 'force-dynamic';

const bodySchema = z
  .object({
    reason: z.string().trim().max(1000).optional().nullable(),
    admin_notes: z.string().trim().max(1000).optional().nullable(),
  })
  .default({});

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const sb = createServerSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { id } = await ctx.params;
  const json = await req.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }

  const db = createServiceSupabase();
  const { data: app, error: loadErr } = await db
    .from('camp_applications')
    .select('id, email, submitted_by_email, camp_name, status')
    .eq('id', id)
    .maybeSingle();
  if (loadErr || !app) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  const { error: updErr } = await db
    .from('camp_applications')
    .update({
      status: 'denied',
      admin_notes: parsed.data.admin_notes ?? null,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);
  if (updErr) {
    return NextResponse.json(
      { error: 'db_error', detail: updErr.message },
      { status: 500 },
    );
  }

  // Email the operator. Swallow failures — the status change is what matters.
  const to = app.submitted_by_email ?? app.email;
  if (to && process.env.RESEND_API_KEY) {
    try {
      const template = CampRequestDeniedEmail({
        locale: 'en',
        campName: app.camp_name,
        reason: parsed.data.reason ?? null,
      });
      const html = await render(template);
      const resend = new Resend(env.RESEND_API_KEY);
      await resend.emails.send({
        from: "School's Out! <hello@schoolsout.net>",
        to,
        subject: 'An update on your camp listing application',
        html,
      });
    } catch (err) {
      console.error('[deny] email failed', err);
    }
  }

  return NextResponse.json({ ok: true });
}
