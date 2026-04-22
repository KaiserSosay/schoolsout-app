import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabase } from '@/lib/supabase/server';
import { createServiceSupabase } from '@/lib/supabase/service';
import { isAdminEmail } from '@/lib/admin';

// DECISION: Admin inline fill for camp logistics. Once an admin touches the
// hours/care fields and submits, we flip logistics_verified=true so the UI
// stops showing "Hours pending" for that camp. Fields are all optional so
// Rasheid can fill in partial data and come back later.
const timeStr = z
  .string()
  .regex(/^\d{2}:\d{2}(:\d{2})?$/)
  .transform((s) => (s.length === 5 ? `${s}:00` : s));

const bodySchema = z.object({
  camp_id: z.string().guid(),
  address: z.string().trim().max(200).nullish(),
  phone: z.string().trim().max(40).nullish(),
  hours_start: timeStr.nullish(),
  hours_end: timeStr.nullish(),
  before_care_offered: z.boolean().optional(),
  before_care_start: timeStr.nullish(),
  before_care_price_cents: z.number().int().min(0).nullish(),
  after_care_offered: z.boolean().optional(),
  after_care_end: timeStr.nullish(),
  after_care_price_cents: z.number().int().min(0).nullish(),
  latitude: z.number().gte(-90).lte(90).nullish(),
  longitude: z.number().gte(-180).lte(180).nullish(),
  mark_verified: z.boolean().optional(),
});

export async function POST(req: Request) {
  const sb = createServerSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: 'invalid_body' }, { status: 400 });

  const { camp_id, mark_verified, ...fields } = parsed.data;

  // Only include fields the admin actually sent (undefined = don't touch).
  const patch: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(fields)) {
    if (v !== undefined) patch[k] = v;
  }
  if (mark_verified) patch.logistics_verified = true;

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'nothing_to_update' }, { status: 400 });
  }

  const db = createServiceSupabase();
  const { data, error } = await db
    .from('camps')
    .update(patch)
    .eq('id', camp_id)
    .select('id, logistics_verified')
    .maybeSingle();
  if (error) return NextResponse.json({ error: 'db_error', detail: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  return NextResponse.json({ ok: true, logistics_verified: data.logistics_verified });
}
