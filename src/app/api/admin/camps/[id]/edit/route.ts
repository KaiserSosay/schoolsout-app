import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabase } from '@/lib/supabase/server';
import { createServiceSupabase } from '@/lib/supabase/service';
import { isAdminEmail } from '@/lib/admin';

// PATCH /api/admin/camps/[id]/edit
// Partial update of any camp field. Zod-validated. Returns the updated row.
//
// DECISION: We accept undefined = don't touch. Clients send only the fields
// they want to change (mirrors the existing /api/admin/camps/update pattern).

const timeStr = z
  .string()
  .regex(/^\d{2}:\d{2}(:\d{2})?$/)
  .transform((s) => (s.length === 5 ? `${s}:00` : s));

const paramSchema = z.object({ id: z.string().guid() });

const bodySchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9-]+$/)
    .optional(),
  description: z.string().trim().max(4000).nullish(),
  ages_min: z.number().int().min(0).max(25).optional(),
  ages_max: z.number().int().min(0).max(25).optional(),
  price_tier: z.enum(['$', '$$', '$$$']).optional(),
  categories: z.array(z.string().trim().min(1).max(60)).optional(),
  website_url: z.string().trim().url().nullish(),
  image_url: z.string().trim().url().nullish(),
  neighborhood: z.string().trim().max(100).nullish(),
  address: z.string().trim().max(200).nullish(),
  phone: z.string().trim().max(40).nullish(),
  latitude: z.number().gte(-90).lte(90).nullish(),
  longitude: z.number().gte(-180).lte(180).nullish(),
  hours_start: timeStr.nullish(),
  hours_end: timeStr.nullish(),
  before_care_offered: z.boolean().optional(),
  before_care_start: timeStr.nullish(),
  before_care_price_cents: z.number().int().min(0).nullish(),
  after_care_offered: z.boolean().optional(),
  after_care_end: timeStr.nullish(),
  after_care_price_cents: z.number().int().min(0).nullish(),
  closed_on_holidays: z.boolean().optional(),
  verified: z.boolean().optional(),
  logistics_verified: z.boolean().optional(),
  is_featured: z.boolean().optional(),
});

export async function PATCH(
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

  const p = paramSchema.safeParse({ id: params.id });
  if (!p.success) return NextResponse.json({ error: 'invalid_id' }, { status: 400 });

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'invalid_body', detail: parsed.error.issues },
      { status: 400 },
    );
  }

  const patch: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(parsed.data)) {
    if (v !== undefined) patch[k] = v;
  }
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'nothing_to_update' }, { status: 400 });
  }

  // ages sanity if either changed
  if (
    typeof patch.ages_min === 'number' &&
    typeof patch.ages_max === 'number' &&
    (patch.ages_max as number) < (patch.ages_min as number)
  ) {
    return NextResponse.json({ error: 'ages_max_lt_min' }, { status: 400 });
  }

  const db = createServiceSupabase();
  const { data, error } = await db
    .from('camps')
    .update(patch)
    .eq('id', p.data.id)
    .select(
      'id, slug, name, verified, logistics_verified, is_featured, is_launch_partner',
    )
    .maybeSingle();
  if (error) {
    const dup = /duplicate key value|slug/i.test(error.message ?? '');
    return NextResponse.json(
      { error: dup ? 'duplicate_slug' : 'db_error', detail: error.message },
      { status: dup ? 409 : 500 },
    );
  }
  if (!data) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  return NextResponse.json({ ok: true, camp: data });
}

// DELETE /api/admin/camps/[id]/edit — remove the camp entirely. Cascades saves
// and clicks via FK.
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const sb = createServerSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const p = paramSchema.safeParse({ id: params.id });
  if (!p.success) return NextResponse.json({ error: 'invalid_id' }, { status: 400 });

  const db = createServiceSupabase();
  const { error } = await db.from('camps').delete().eq('id', p.data.id);
  if (error) return NextResponse.json({ error: 'db_error', detail: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
