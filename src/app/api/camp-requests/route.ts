import { NextResponse } from 'next/server';
import { z } from 'zod';
import { Resend } from 'resend';
import { createServiceSupabase } from '@/lib/supabase/service';
import { env } from '@/lib/env';

export const dynamic = 'force-dynamic';

// Public endpoint for camp operators. Writes to camp_applications (one queue,
// one mental model). Emails ADMIN_NOTIFY_EMAIL so Rasheid sees it fast.
const schema = z.object({
  submitted_by_email: z.string().email(),
  submitted_by_name: z.string().trim().max(120).optional().nullable(),
  business_name: z.string().trim().min(1).max(200),
  camp_name: z.string().trim().min(1).max(200),
  website: z.string().trim().url().optional().nullable(),
  phone: z.string().trim().max(40).optional().nullable(),
  address: z.string().trim().max(400).optional().nullable(),
  age_min: z.number().int().min(0).max(25).optional().nullable(),
  age_max: z.number().int().min(0).max(25).optional().nullable(),
  description: z.string().trim().max(4000).optional().nullable(),
  categories: z.array(z.string().trim().min(1).max(60)).max(20).default([]),
  price_min_cents: z.number().int().min(0).optional().nullable(),
  price_max_cents: z.number().int().min(0).optional().nullable(),
  neighborhood: z.string().trim().max(120).optional().nullable(),
  locale: z.enum(['en', 'es']).default('en'),
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }
  const d = parsed.data;
  if (
    d.age_min != null &&
    d.age_max != null &&
    d.age_max < d.age_min
  ) {
    return NextResponse.json({ error: 'ages_max_lt_min' }, { status: 400 });
  }
  if (
    d.price_min_cents != null &&
    d.price_max_cents != null &&
    d.price_max_cents < d.price_min_cents
  ) {
    return NextResponse.json({ error: 'price_max_lt_min' }, { status: 400 });
  }

  const db = createServiceSupabase();

  // DECISION: Populate both new richer fields AND the legacy short-form
  // columns (camp_name, website, ages, neighborhood, email) so pre-2.5 admin
  // UI and the existing approve route still work against this row.
  const ages = d.age_min != null && d.age_max != null ? `${d.age_min}-${d.age_max}` : '';
  const { data: inserted, error } = await db
    .from('camp_applications')
    .insert({
      email: d.submitted_by_email,
      camp_name: d.camp_name,
      website: d.website ?? '',
      ages,
      neighborhood: d.neighborhood ?? '',
      submitted_by_email: d.submitted_by_email,
      submitted_by_name: d.submitted_by_name ?? null,
      business_name: d.business_name,
      phone: d.phone ?? null,
      address: d.address ?? null,
      age_min: d.age_min ?? null,
      age_max: d.age_max ?? null,
      description: d.description ?? null,
      categories: d.categories,
      price_min_cents: d.price_min_cents ?? null,
      price_max_cents: d.price_max_cents ?? null,
      status: 'pending',
    })
    .select('id')
    .single();
  if (error || !inserted) {
    return NextResponse.json(
      { error: 'db_error', detail: error?.message },
      { status: 500 },
    );
  }

  if (process.env.RESEND_API_KEY) {
    try {
      const resend = new Resend(env.RESEND_API_KEY);
      await resend.emails.send({
        from: "School's Out! <hello@schoolsout.net>",
        to: env.ADMIN_NOTIFY_EMAIL,
        subject: `New camp request: ${d.camp_name}`,
        html: `
<!doctype html>
<html>
  <body style="font-family: system-ui, sans-serif; background: #FBF8F1; color: #1A1A1A; padding: 24px;">
    <h1 style="font-size: 20px; margin: 0 0 12px;">New camp request</h1>
    <p style="margin: 0 0 8px;"><strong>${d.business_name}</strong> — ${d.camp_name}</p>
    <p style="margin: 0 0 8px; font-size: 13px; color: #71717A;">${d.submitted_by_email}${d.phone ? ' · ' + d.phone : ''}</p>
    ${d.website ? `<p style="margin: 0 0 8px;"><a href="${d.website}">${d.website}</a></p>` : ''}
    ${d.description ? `<p style="margin: 0 0 8px; white-space: pre-wrap;">${d.description}</p>` : ''}
    <p style="margin: 16px 0 0;"><a href="${env.APP_URL}/en/admin?tab=camp-requests&id=${inserted.id}" style="display:inline-block;background:#F5C842;color:#1A1A1A;border-radius:12px;padding:10px 16px;font-weight:800;text-decoration:none">Review in /admin →</a></p>
  </body>
</html>`,
      });
    } catch (err) {
      console.error('[camp-requests] notify send failed', err);
    }
  }

  return NextResponse.json({ ok: true, id: inserted.id });
}
