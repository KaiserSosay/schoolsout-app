import { NextResponse } from 'next/server';
import { z } from 'zod';
import { Resend } from 'resend';
import { render } from '@react-email/render';
import { randomUUID } from 'node:crypto';
import { createServiceSupabase } from '@/lib/supabase/service';
import { requireAdminApi } from '@/lib/auth/requireAdmin';
import { env } from '@/lib/env';
import {
  OperatorWelcomeEmail,
  operatorWelcomeSubject,
} from '@/lib/email/OperatorWelcomeEmail';

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
  const gate = await requireAdminApi();
  if (!gate.ok) return gate.response;

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
  // Phase 2.7 Goal 5: pull extended fields off the application so they
  // copy into the new camps row. camp_data (from the admin UI body)
  // remains authoritative where both exist — the UI is the admin's last
  // chance to tweak slug/pricing/etc. before publishing.
  const { data: app, error: appErr } = await db
    .from('camp_applications')
    .select(
      'id, email, camp_name, status, phone, address, price_min_cents, price_max_cents, hours_start, hours_end, before_care_offered, before_care_start, after_care_offered, after_care_end, registration_url, registration_deadline',
    )
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
      // Carry-over from the application:
      phone: app.phone ?? null,
      address: app.address ?? null,
      price_min_cents: app.price_min_cents ?? null,
      price_max_cents: app.price_max_cents ?? null,
      hours_start: app.hours_start ?? null,
      hours_end: app.hours_end ?? null,
      before_care_offered: app.before_care_offered ?? null,
      before_care_start: app.before_care_start ?? null,
      after_care_offered: app.after_care_offered ?? null,
      after_care_end: app.after_care_end ?? null,
      registration_url: app.registration_url ?? null,
      registration_deadline: app.registration_deadline ?? null,
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

  // Phase 3.1: provision a camp_operators invite row so the applicant can
  // self-edit their listing once they sign in. The user_id may not exist
  // yet — Supabase auth.users gets created on first magic-link sign-in. We
  // resolve the user_id by email; if the user is brand new we INSERT a
  // public.users row eagerly (mirrors handle_new_user semantics) so the
  // operator row has a real foreign key to point at.
  const inviteToken = randomUUID();
  const invitedAtIso = new Date().toISOString();
  const expiresAtIso = new Date(
    Date.now() + 14 * 24 * 60 * 60 * 1000,
  ).toISOString();
  const operatorEmail = app.email.toLowerCase();

  let operatorUserId: string | null = null;
  const { data: existingUser } = await db
    .from('users')
    .select('id')
    .eq('email', operatorEmail)
    .maybeSingle();
  if (existingUser?.id) {
    operatorUserId = existingUser.id;
  } else {
    // Eager-create an auth shadow row so the operator's invite has a place
    // to land. Real Supabase auth.users will get created on magic-link
    // sign-in; the public.users row gets re-bound by handle_new_user via
    // ON CONFLICT (id) DO NOTHING. For now we generate a stable UUID and
    // the operator can sign in normally.
    const provisionalId = randomUUID();
    const { data: insertedUser, error: userErr } = await db
      .from('users')
      .insert({
        id: provisionalId,
        email: operatorEmail,
        coppa_consent_at: invitedAtIso,
        role: 'operator',
      })
      .select('id')
      .maybeSingle();
    if (userErr || !insertedUser) {
      // Non-fatal — the camp + application updates already succeeded.
      // Surface as a warning so the admin knows to invite manually.
      console.error('[approve] could not provision operator user', userErr);
    } else {
      operatorUserId = insertedUser.id;
    }
  }

  if (operatorUserId) {
    const { error: opErr } = await db.from('camp_operators').insert({
      camp_id: newCamp.id,
      user_id: operatorUserId,
      role: 'owner',
      invited_at: invitedAtIso,
      invite_token: inviteToken,
      invite_expires_at: expiresAtIso,
    });
    if (opErr) {
      console.error('[approve] camp_operators insert failed', opErr);
    }
  }

  // Send the operator welcome email. The magic-link uses the standard
  // sign-in flow with `next` pointed at the new operator dashboard, so the
  // recipient lands on /en/operator/{slug} after auth.
  // ENV gate: ALLOW_OPERATOR_INVITE_EMAILS=true must be explicitly set.
  // Without it, the email is built but never sent — Phase 3.1 ships the
  // template + endpoint without spamming real applicants tonight.
  const sendEnabled =
    process.env.RESEND_API_KEY &&
    process.env.ALLOW_OPERATOR_INVITE_EMAILS === 'true';
  if (sendEnabled) {
    try {
      const resend = new Resend(env.RESEND_API_KEY);
      const magicLinkUrl = `${env.APP_URL}/en/auth/sign-in?next=${encodeURIComponent(
        `/en/operator/${newCamp.slug}`,
      )}&email=${encodeURIComponent(operatorEmail)}`;
      const html = await render(
        OperatorWelcomeEmail({
          locale: 'en',
          campName: camp_data.name,
          magicLinkUrl,
          expiresAtIso,
        }),
      );
      await resend.emails.send({
        from: "School's Out! <hello@schoolsout.net>",
        to: operatorEmail,
        subject: operatorWelcomeSubject('en', camp_data.name),
        html,
      });
    } catch (err) {
      console.error('[approve] operator welcome resend failed', err);
    }
  }

  return NextResponse.json({
    ok: true,
    camp_id: newCamp.id,
    slug: newCamp.slug,
    operator_invited: Boolean(operatorUserId),
    operator_email_sent: Boolean(sendEnabled && operatorUserId),
  });
}
