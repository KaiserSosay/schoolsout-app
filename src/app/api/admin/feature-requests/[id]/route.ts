import { NextResponse } from 'next/server';
import { z } from 'zod';
import { Resend } from 'resend';
import { render } from '@react-email/render';
import { createServiceSupabase } from '@/lib/supabase/service';
import { requireAdminApi } from '@/lib/auth/requireAdmin';
import { env } from '@/lib/env';
import { FeatureRequestReplyEmail } from '@/lib/email/FeatureRequestReplyEmail';

export const dynamic = 'force-dynamic';

const bodySchema = z
  .object({
    status: z
      .enum(['new', 'acknowledged', 'in_progress', 'shipped', 'wont_do'])
      .optional(),
    admin_response: z.string().max(2000).optional(),
    send_reply: z.boolean().optional(),
  })
  .refine((v) => v.status !== undefined || v.admin_response !== undefined, {
    message: 'status or admin_response required',
  });

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const gate = await requireAdminApi();
  if (!gate.ok) return gate.response;
  const { user } = gate;

  const { id } = await ctx.params;
  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }

  const db = createServiceSupabase();
  const { data: existing, error: loadErr } = await db
    .from('feature_requests')
    .select('id, email, user_id, locale, body, admin_response, status')
    .eq('id', id)
    .maybeSingle();
  if (loadErr || !existing) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  // DECISION: admin_response is captured even when send_reply is false, so
  // the admin can draft a response, triage, then fire it later. The reply
  // email only fires when send_reply is explicitly true AND we have an email.
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (parsed.data.status !== undefined) update.status = parsed.data.status;
  if (parsed.data.admin_response !== undefined) {
    update.admin_response = parsed.data.admin_response;
    update.admin_responded_at = new Date().toISOString();
    update.admin_responded_by = user.id;
  }

  const { data: updated, error: updErr } = await db
    .from('feature_requests')
    .update(update)
    .eq('id', id)
    .select(
      'id, email, user_id, locale, body, admin_response, admin_responded_at, status',
    )
    .single();
  if (updErr || !updated) {
    return NextResponse.json(
      { error: 'db_error', detail: updErr?.message },
      { status: 500 },
    );
  }

  // Fire reply email when asked and we have a text + an address.
  let emailSent = false;
  const wantReply = parsed.data.send_reply === true;
  const hasResponse = Boolean(updated.admin_response && updated.admin_response.trim());
  if (wantReply && hasResponse && updated.email && process.env.RESEND_API_KEY) {
    try {
      const locale = (updated.locale === 'es' ? 'es' : 'en') as 'en' | 'es';
      const template = FeatureRequestReplyEmail({
        locale,
        originalBody: updated.body,
        adminResponse: updated.admin_response!,
      });
      const html = await render(template);
      const resend = new Resend(env.RESEND_API_KEY);
      const subject = locale === 'es' ? 'Noah te respondió 👋' : 'Noah wrote you back 👋';
      await resend.emails.send({
        from: "Noah at School's Out! <hello@schoolsout.net>",
        to: updated.email,
        subject,
        html,
      });
      emailSent = true;
    } catch (err) {
      console.error('[admin/feature-requests] reply send failed', err);
    }
  }

  return NextResponse.json({ ok: true, request: updated, emailSent });
}
