import { NextResponse } from 'next/server';
import { z } from 'zod';
import { checkOperatorAccess } from '@/lib/operator/auth';
import { createServiceSupabase } from '@/lib/supabase/service';

// PATCH /api/operator/[slug]
// Body: a partial of the editable camp fields. Validates each field with a
// strict zod schema (so an attacker can't sneak `is_featured: true` past the
// service-role write). 401 if no user; 404 if the user isn't an operator
// for this slug — kept indistinguishable so we don't leak which slugs exist.

const editSchema = z.object({
  description: z.string().trim().max(4000).nullable().optional(),
  categories: z
    .array(z.string().trim().min(1).max(60))
    .max(10)
    .optional(),
  ages_min: z.number().int().min(0).max(25).optional(),
  ages_max: z.number().int().min(0).max(25).optional(),
  phone: z.string().trim().max(40).nullable().optional(),
  email: z.string().email().nullable().optional(),
  website_url: z.string().url().nullable().optional(),
  registration_url: z.string().url().nullable().optional(),
  registration_deadline: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .optional(),
  price_tier: z.enum(['$', '$$', '$$$']).optional(),
  price_min_cents: z.number().int().min(0).max(1_000_000).nullable().optional(),
  price_max_cents: z.number().int().min(0).max(1_000_000).nullable().optional(),
  price_notes: z.string().trim().max(500).nullable().optional(),
  hours_start: z
    .string()
    .regex(/^\d{2}:\d{2}(:\d{2})?$/)
    .nullable()
    .optional(),
  hours_end: z
    .string()
    .regex(/^\d{2}:\d{2}(:\d{2})?$/)
    .nullable()
    .optional(),
  before_care_offered: z.boolean().optional(),
  before_care_start: z
    .string()
    .regex(/^\d{2}:\d{2}(:\d{2})?$/)
    .nullable()
    .optional(),
  before_care_price_cents: z
    .number()
    .int()
    .min(0)
    .max(1_000_000)
    .nullable()
    .optional(),
  after_care_offered: z.boolean().optional(),
  after_care_end: z
    .string()
    .regex(/^\d{2}:\d{2}(:\d{2})?$/)
    .nullable()
    .optional(),
  after_care_price_cents: z
    .number()
    .int()
    .min(0)
    .max(1_000_000)
    .nullable()
    .optional(),
  lunch_included: z.boolean().nullable().optional(),
  special_needs_friendly: z.boolean().nullable().optional(),
  scholarships_available: z.boolean().nullable().optional(),
  scholarships_notes: z.string().trim().max(1000).nullable().optional(),
  accommodations: z.string().trim().max(1000).nullable().optional(),
  photo_urls: z.array(z.string().url()).max(5).optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: { slug: string } },
) {
  const access = await checkOperatorAccess(params.slug);
  if (!access.ok) {
    // Collapse no_user, no_camp, not_operator into a single 404 so an
    // attacker can't probe which slugs exist. The dashboard page does the
    // same — distinguishing these would only help recon.
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  const json = await req.json().catch(() => null);
  const parsed = editSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'invalid_body', detail: parsed.error.issues },
      { status: 400 },
    );
  }
  const body = parsed.data;
  if (
    body.ages_min !== undefined &&
    body.ages_max !== undefined &&
    body.ages_max < body.ages_min
  ) {
    return NextResponse.json({ error: 'ages_max_lt_min' }, { status: 400 });
  }
  if (
    body.price_min_cents != null &&
    body.price_max_cents != null &&
    body.price_max_cents < body.price_min_cents
  ) {
    return NextResponse.json({ error: 'price_max_lt_min' }, { status: 400 });
  }

  const db = createServiceSupabase();
  const { error: updErr } = await db
    .from('camps')
    .update(body)
    .eq('id', access.campId);
  if (updErr) {
    return NextResponse.json(
      { error: 'update_failed', detail: updErr.message },
      { status: 500 },
    );
  }
  return NextResponse.json({ ok: true });
}
