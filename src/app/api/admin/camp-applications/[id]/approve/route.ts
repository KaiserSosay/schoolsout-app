import { NextResponse } from 'next/server';
import { z } from 'zod';
import { Resend } from 'resend';
import { createServerSupabase } from '@/lib/supabase/server';
import { createServiceSupabase } from '@/lib/supabase/service';
import { isAdminEmail } from '@/lib/admin';
import { env } from '@/lib/env';

const paramSchema = z.object({ id: z.string().guid() });

const bodySchema = z.object({
  camp_data: z.object({
    name: z.string().trim().min(1).max(200),
    slug: z
      .string()
      .trim()
      .min(2)
      .max(80)
      .regex(/^[a-z0-9-]+$/, 'slug must be lowercase letters, digits, and dashes'),
    description: z.string().trim().max(4000).nullish(),
    ages_min: z.number().int().min(0).max(25),
    ages_max: z.number().int().min(0).max(25),
    price_tier: z.enum(['$', '$$', '$$$']),
    categories: z.array(z.string().trim().min(1).max(60)).default([]),
    website_url: z.string().trim().url().nullish(),
    neighborhood: z.string().trim().max(100).nullish(),
  }),
});

// POST /api/admin/camp-applications/[id]/approve
// 1. Insert a new camps row (verified=false, logistics_verified=false — admin
//    still has to pass logistics review separately before public unlock).
// 2. Flip the application to status='approved' with reviewed_at=now.
// 3. Email the applicant that their listing is approved.
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

  const json = await req.json().catch(() => null);
  const bodyParsed = bodySchema.safeParse(json);
  if (!bodyParsed.success) {
    return NextResponse.json(
      { error: 'invalid_body', detail: bodyParsed.error.issues },
      { status: 400 },
    );
  }
  const { camp_data } = bodyParsed.data;
  if (camp_data.ages_max < camp_data.ages_min) {
    return NextResponse.json({ error: 'ages_max_lt_min' }, { status: 400 });
  }

  const db = createServiceSupabase();
  const { data: app, error: appErr } = await db
    .from('camp_applications')
    .select('id, email, camp_name, status')
    .eq('id', paramsParsed.data.id)
    .maybeSingle();
  if (appErr) return NextResponse.json({ error: 'db_error', detail: appErr.message }, { status: 500 });
  if (!app) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const { data: newCamp, error: campErr } = await db
    .from('camps')
    .insert({
      name: camp_data.name,
      slug: camp_data.slug,
      description: camp_data.description ?? null,
      ages_min: camp_data.ages_min,
      ages_max: camp_data.ages_max,
      price_tier: camp_data.price_tier,
      categories: camp_data.categories,
      website_url: camp_data.website_url ?? null,
      neighborhood: camp_data.neighborhood ?? null,
      verified: false,
      logistics_verified: false,
    })
    .select('id, slug')
    .maybeSingle();
  if (campErr) {
    // DECISION: The most common insert failure is a duplicate slug. Surface
    // that specifically so the admin knows to edit the slug field.
    const detail = campErr.message ?? '';
    const dup = /duplicate key value|slug/i.test(detail);
    return NextResponse.json(
      { error: dup ? 'duplicate_slug' : 'camp_insert_failed', detail },
      { status: dup ? 409 : 500 },
    );
  }
  if (!newCamp) {
    return NextResponse.json({ error: 'camp_insert_failed' }, { status: 500 });
  }

  const { error: updErr } = await db
    .from('camp_applications')
    .update({ status: 'approved', reviewed_at: new Date().toISOString() })
    .eq('id', app.id);
  if (updErr) {
    return NextResponse.json(
      { error: 'application_update_failed', detail: updErr.message },
      { status: 500 },
    );
  }

  // Fire-and-forget email. Don't let send failures block the approval.
  if (process.env.RESEND_API_KEY) {
    try {
      const resend = new Resend(env.RESEND_API_KEY);
      await resend.emails.send({
        from: "School's Out! <hello@schoolsout.net>",
        to: app.email,
        subject: 'Your camp listing is approved!',
        html: `
<!doctype html>
<html>
  <body style="font-family: system-ui, sans-serif; background: #FBF8F1; color: #1A1A1A; padding: 24px;">
    <h1 style="font-size: 24px; margin: 0 0 16px;">${camp_data.name} is live.</h1>
    <p style="font-size: 15px; line-height: 1.5; margin: 0 0 12px;">
      Thanks for applying to School&apos;s Out! Your listing is now published on the catalog.
      Parents in Coral Gables will start seeing it when they browse camps for the age range you submitted.
    </p>
    <p style="font-size: 15px; line-height: 1.5; margin: 0 0 12px;">
      We may reach out shortly to confirm logistics (hours, before/after-care, drop-off).
      That second review stamps your listing with a green "verified" badge parents trust.
    </p>
    <p style="font-size: 13px; color: #71717A; margin-top: 24px;">
      — Rasheid, School&apos;s Out!
    </p>
  </body>
</html>`,
      });
    } catch (err) {
      console.error('[approve] resend failed', err);
    }
  }

  return NextResponse.json({ ok: true, camp_id: newCamp.id, slug: newCamp.slug });
}
