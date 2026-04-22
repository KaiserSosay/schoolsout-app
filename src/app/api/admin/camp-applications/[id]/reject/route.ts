import { NextResponse } from 'next/server';
import { z } from 'zod';
import { Resend } from 'resend';
import { createServerSupabase } from '@/lib/supabase/server';
import { createServiceSupabase } from '@/lib/supabase/service';
import { isAdminEmail } from '@/lib/admin';
import { env } from '@/lib/env';

const paramSchema = z.object({ id: z.string().guid() });
const bodySchema = z.object({ reason: z.string().trim().max(2000).optional() });

export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  const sb = createServerSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const paramsParsed = paramSchema.safeParse({ id: params.id });
  if (!paramsParsed.success) return NextResponse.json({ error: 'invalid_id' }, { status: 400 });

  const json = await req.json().catch(() => ({}));
  const bodyParsed = bodySchema.safeParse(json);
  if (!bodyParsed.success) return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  const { reason } = bodyParsed.data;

  const db = createServiceSupabase();
  const { data: app, error } = await db
    .from('camp_applications')
    .update({
      status: 'rejected',
      reviewed_at: new Date().toISOString(),
      notes: reason ?? null,
    })
    .eq('id', paramsParsed.data.id)
    .select('id, email, camp_name')
    .maybeSingle();
  if (error) return NextResponse.json({ error: 'db_error', detail: error.message }, { status: 500 });
  if (!app) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  if (process.env.RESEND_API_KEY) {
    try {
      const resend = new Resend(env.RESEND_API_KEY);
      await resend.emails.send({
        from: "School's Out! <hello@schoolsout.net>",
        to: app.email,
        subject: "About your School's Out! camp application",
        html: `
<!doctype html>
<html>
  <body style="font-family: system-ui, sans-serif; background: #FBF8F1; color: #1A1A1A; padding: 24px;">
    <h1 style="font-size: 22px; margin: 0 0 16px;">Thanks for applying</h1>
    <p style="font-size: 15px; line-height: 1.5; margin: 0 0 12px;">
      We reviewed the application for <strong>${app.camp_name}</strong> and can&apos;t publish it right now.
    </p>
    ${
      reason
        ? `<p style="font-size: 15px; line-height: 1.5; margin: 0 0 12px;"><em>${reason}</em></p>`
        : ''
    }
    <p style="font-size: 15px; line-height: 1.5; margin: 0 0 12px;">
      We&apos;d love to hear back if anything changes — the catalog is still growing and priorities shift as we add cities.
    </p>
    <p style="font-size: 13px; color: #71717A; margin-top: 24px;">
      — Rasheid, School&apos;s Out!
    </p>
  </body>
</html>`,
      });
    } catch (err) {
      console.error('[reject] resend failed', err);
    }
  }

  return NextResponse.json({ ok: true });
}
