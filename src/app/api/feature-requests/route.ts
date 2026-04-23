import { NextResponse } from 'next/server';
import { z } from 'zod';
import { Resend } from 'resend';
import { render } from '@react-email/render';
import { createServerSupabase } from '@/lib/supabase/server';
import { createServiceSupabase } from '@/lib/supabase/service';
import { env } from '@/lib/env';
import { FeatureRequestNotifyEmail } from '@/lib/email/FeatureRequestNotifyEmail';

export const dynamic = 'force-dynamic';

const schema = z.object({
  category: z.enum(['idea', 'bug', 'love', 'question']).default('idea'),
  body: z.string().min(1).max(500),
  email: z.string().email().optional(),
  locale: z.enum(['en', 'es']).default('en'),
  page_path: z.string().max(500).optional().nullable(),
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }
  const { category, body, email, locale, page_path } = parsed.data;

  // Identify the submitter. If logged in we attach user_id and ignore the
  // email field (we already know it); if anon we require an email so Rasheid
  // can reply.
  const sb = createServerSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();

  if (!user && !email) {
    return NextResponse.json({ error: 'email_required' }, { status: 400 });
  }

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
    .from('feature_requests')
    .insert({
      user_id: user?.id ?? null,
      email: user ? (user.email ?? null) : email,
      category,
      body,
      locale,
      page_path: page_path ?? null,
    })
    .select('id')
    .single();
  if (error || !inserted) {
    return NextResponse.json({ error: 'db_error' }, { status: 500 });
  }

  // Fire-and-forget admin notification — do not fail the request if Resend
  // is down or unconfigured. The row is saved either way.
  if (process.env.RESEND_API_KEY) {
    try {
      const adminUrl = `${env.APP_URL}/en/admin?tab=feature-requests&id=${inserted.id}`;
      const template = FeatureRequestNotifyEmail({
        category,
        body,
        submitter: {
          email: user?.email ?? email!,
          displayName,
          isLoggedIn: Boolean(user),
        },
        locale,
        pagePath: page_path ?? null,
        adminUrl,
      });
      const html = await render(template);
      const resend = new Resend(env.RESEND_API_KEY);
      const subjectPrefix =
        category === 'bug' ? '🐛' : category === 'love' ? '❤️' : category === 'question' ? '❓' : '💡';
      const shortBody = body.length > 60 ? body.slice(0, 60) + '…' : body;
      await resend.emails.send({
        from: "School's Out! <hello@schoolsout.net>",
        to: env.ADMIN_NOTIFY_EMAIL,
        subject: `${subjectPrefix} New ${category}: ${shortBody}`,
        html,
      });
    } catch (err) {
      console.error('[feature-requests] notify send failed', err);
    }
  }

  return NextResponse.json({ ok: true, id: inserted.id });
}
