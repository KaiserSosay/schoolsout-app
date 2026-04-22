import { createServiceSupabase } from '@/lib/supabase/service';
import { CampsAdminClient, type AdminCamp } from '@/components/admin/CampsAdminClient';

export const dynamic = 'force-dynamic';

export default async function AdminCampsPage() {
  const db = createServiceSupabase();
  const [campsResp, clicksResp, savesResp] = await Promise.all([
    db
      .from('camps')
      .select(
        'id, slug, name, description, ages_min, ages_max, price_tier, categories, website_url, image_url, neighborhood, address, phone, latitude, longitude, hours_start, hours_end, before_care_offered, before_care_start, before_care_price_cents, after_care_offered, after_care_end, after_care_price_cents, closed_on_holidays, verified, logistics_verified, is_featured, is_launch_partner, launch_partner_until, created_at',
      )
      .order('is_featured', { ascending: false })
      .order('verified', { ascending: false })
      .order('name', { ascending: true }),
    db
      .from('camp_clicks')
      .select('camp_id')
      .gte('clicked_at', new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()),
    db.from('saved_camps').select('camp_id'),
  ]);

  const clicks = new Map<string, number>();
  for (const r of (clicksResp.data ?? []) as { camp_id: string }[]) {
    clicks.set(r.camp_id, (clicks.get(r.camp_id) ?? 0) + 1);
  }
  const saves = new Map<string, number>();
  for (const r of (savesResp.data ?? []) as { camp_id: string }[]) {
    saves.set(r.camp_id, (saves.get(r.camp_id) ?? 0) + 1);
  }

  const camps: AdminCamp[] = ((campsResp.data ?? []) as Omit<AdminCamp, 'clicks30d' | 'savesCount'>[]).map(
    (c) => ({
      ...c,
      clicks30d: clicks.get(c.id) ?? 0,
      savesCount: saves.get(c.id) ?? 0,
    }),
  );

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-black text-ink">Camps catalog</h2>
        <p className="text-xs font-bold text-muted">
          Edit every field. Launch partner toggle sets a 90-day expiry. Deleting cascades saves + clicks.
        </p>
      </div>
      <CampsAdminClient camps={camps} />
    </div>
  );
}
