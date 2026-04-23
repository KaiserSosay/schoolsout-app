import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceSupabase } from '@/lib/supabase/service';
import { requireAdminApi } from '@/lib/auth/requireAdmin';

export const dynamic = 'force-dynamic';

const boolish = z
  .string()
  .optional()
  .transform((v) => (v == null || v === '' ? undefined : v === 'true'));

const querySchema = z.object({
  verified: boolish,
  launch_partner: boolish,
  logistics_verified: boolish,
  category: z.string().trim().max(60).optional(),
  search: z.string().trim().max(100).optional(),
});

export async function GET(req: Request) {
  const gate = await requireAdminApi();
  if (!gate.ok) return gate.response;

  const url = new URL(req.url);
  const parsed = querySchema.safeParse({
    verified: url.searchParams.get('verified') ?? undefined,
    launch_partner: url.searchParams.get('launch_partner') ?? undefined,
    logistics_verified: url.searchParams.get('logistics_verified') ?? undefined,
    category: url.searchParams.get('category') ?? undefined,
    search: url.searchParams.get('search') ?? undefined,
  });
  if (!parsed.success) return NextResponse.json({ error: 'invalid_query' }, { status: 400 });
  const { verified, launch_partner, logistics_verified, category, search } = parsed.data;

  const db = createServiceSupabase();
  let q = db
    .from('camps')
    .select(
      'id, slug, name, description, ages_min, ages_max, price_tier, categories, website_url, image_url, neighborhood, address, phone, latitude, longitude, hours_start, hours_end, before_care_offered, before_care_start, before_care_price_cents, after_care_offered, after_care_end, after_care_price_cents, closed_on_holidays, verified, logistics_verified, is_featured, is_launch_partner, launch_partner_until, created_at',
    )
    .order('is_featured', { ascending: false })
    .order('verified', { ascending: false })
    .order('name', { ascending: true });
  if (verified !== undefined) q = q.eq('verified', verified);
  if (launch_partner !== undefined) q = q.eq('is_launch_partner', launch_partner);
  if (logistics_verified !== undefined) q = q.eq('logistics_verified', logistics_verified);
  if (category) q = q.contains('categories', [category]);
  if (search) q = q.or(`name.ilike.%${search}%,slug.ilike.%${search}%`);
  const { data, error } = await q;
  if (error) return NextResponse.json({ error: 'db_error', detail: error.message }, { status: 500 });

  const rows = data ?? [];
  const ids = rows.map((r) => r.id);

  // Hydrate clicks last 30 + saves count.
  const d30 = new Date();
  d30.setUTCHours(0, 0, 0, 0);
  d30.setUTCDate(d30.getUTCDate() - 30);

  const [clicksResp, savesResp] = await Promise.all([
    ids.length
      ? db
          .from('camp_clicks')
          .select('camp_id')
          .in('camp_id', ids)
          .gte('clicked_at', d30.toISOString())
      : Promise.resolve({ data: [], error: null }),
    ids.length
      ? db.from('saved_camps').select('camp_id').in('camp_id', ids)
      : Promise.resolve({ data: [], error: null }),
  ]);

  const clicks30 = new Map<string, number>();
  for (const r of (clicksResp.data ?? []) as { camp_id: string }[]) {
    clicks30.set(r.camp_id, (clicks30.get(r.camp_id) ?? 0) + 1);
  }
  const saves = new Map<string, number>();
  for (const r of (savesResp.data ?? []) as { camp_id: string }[]) {
    saves.set(r.camp_id, (saves.get(r.camp_id) ?? 0) + 1);
  }

  const camps = rows.map((c) => ({
    ...c,
    clicks30d: clicks30.get(c.id) ?? 0,
    savesCount: saves.get(c.id) ?? 0,
  }));
  return NextResponse.json({ camps });
}
