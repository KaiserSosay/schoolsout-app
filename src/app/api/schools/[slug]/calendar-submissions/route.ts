// Phase 4.7.1 — public submission endpoint for school calendar updates.
// Anyone with an email address can propose changes. Validates body,
// flags domain match, rate-limits per IP, persists to
// school_calendar_submissions, sends ack to submitter + notify to admin.

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { Resend } from 'resend';
import { render } from '@react-email/render';
import { createServiceSupabase } from '@/lib/supabase/service';
import { env } from '@/lib/env';
import { isDomainVerified } from '@/lib/schools/verify-domain';
import { CalendarSubmissionAckEmail } from '@/lib/email/CalendarSubmissionAckEmail';
import { CalendarSubmissionNotifyEmail } from '@/lib/email/CalendarSubmissionNotifyEmail';

const schema = z.object({
  submitter_email: z.string().email(),
  submitter_name: z.string().max(120).optional(),
  submitter_role: z.enum([
    'principal',
    'teacher',
    'office_manager',
    'parent',
    'other',
  ]),
  proposed_updates: z.string().min(1).max(8000),
  notes: z.string().max(2000).optional(),
});

// Simple in-memory rate limit. Map<ip, timestamps[]>. 3 submissions per
// hour per IP. Process-local — fine for a single Vercel function instance,
// resets on cold-start. Good enough for v1; Redis later if abuse appears.
const RATE_LIMIT_MAX = 3;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const ipHits = new Map<string, number[]>();

function clientIp(req: Request): string {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  const real = req.headers.get('x-real-ip');
  if (real) return real;
  return 'unknown';
}

function rateLimitOk(ip: string, now: number = Date.now()): boolean {
  const cutoff = now - RATE_LIMIT_WINDOW_MS;
  const prior = (ipHits.get(ip) ?? []).filter((t) => t > cutoff);
  if (prior.length >= RATE_LIMIT_MAX) {
    ipHits.set(ip, prior);
    return false;
  }
  prior.push(now);
  ipHits.set(ip, prior);
  return true;
}

type SchoolRow = {
  id: string;
  name: string;
  website: string | null;
};

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  const ip = clientIp(req);
  if (!rateLimitOk(ip)) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
  }

  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }

  const db = createServiceSupabase();
  const { data: school } = (await db
    .from('schools')
    .select('id, name, website')
    .eq('slug', slug)
    .maybeSingle()) as { data: SchoolRow | null };
  if (!school) {
    return NextResponse.json({ error: 'school_not_found' }, { status: 404 });
  }

  const domain_verified = isDomainVerified(
    school.website,
    parsed.data.submitter_email,
  );

  const { data: insertResult, error } = await db
    .from('school_calendar_submissions')
    .insert([
      {
        school_id: school.id,
        submitter_email: parsed.data.submitter_email,
        submitter_name: parsed.data.submitter_name ?? null,
        submitter_role: parsed.data.submitter_role,
        proposed_updates: parsed.data.proposed_updates,
        notes: parsed.data.notes ?? null,
        domain_verified,
      },
    ])
    .select()
    .single();
  if (error) {
    return NextResponse.json(
      { error: 'db_error', detail: error.message },
      { status: 500 },
    );
  }

  // Best-effort emails — submitter ack + admin notify. A failure here
  // doesn't roll back the insert; the row is the audit trail.
  try {
    const resend = new Resend(env.RESEND_API_KEY);
    const ackHtml = await render(
      CalendarSubmissionAckEmail({
        locale: 'en',
        schoolName: school.name,
        domainVerified: domain_verified,
      }),
    );
    await resend.emails.send({
      from: "Noah at School's Out! <hi@schoolsout.net>",
      to: parsed.data.submitter_email,
      subject: `Thanks for sending ${school.name}'s calendar update`,
      html: ackHtml,
    });

    const adminHtml = await render(
      CalendarSubmissionNotifyEmail({
        schoolName: school.name,
        schoolSlug: slug,
        submitterEmail: parsed.data.submitter_email,
        submitterName: parsed.data.submitter_name ?? null,
        submitterRole: parsed.data.submitter_role,
        proposedUpdates: parsed.data.proposed_updates,
        notes: parsed.data.notes ?? null,
        domainVerified: domain_verified,
        adminUrl: `${env.APP_URL}/en/admin?tab=calendar-submissions`,
      }),
    );
    await resend.emails.send({
      from: "School's Out! <hi@schoolsout.net>",
      to: env.ADMIN_NOTIFY_EMAIL,
      subject: `New calendar submission: ${school.name}${
        domain_verified ? ' (✓ domain verified)' : ''
      }`,
      html: adminHtml,
    });
  } catch (e) {
    // Surface in logs but don't fail the request — submission is
    // already saved; admin can re-send the notify manually if needed.
    console.warn('[calendar-submissions] email send failed:', e);
  }

  return NextResponse.json(
    {
      id: (insertResult as { id: string } | null)?.id ?? null,
      domain_verified,
    },
    { status: 201 },
  );
}
