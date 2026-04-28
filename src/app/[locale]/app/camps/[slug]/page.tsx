import { notFound } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase/server';
import { createServiceSupabase } from '@/lib/supabase/service';
import { getAdminRole } from '@/lib/auth/requireAdmin';
import {
  UnifiedCampDetail,
  type UnifiedCampDetailCamp,
} from '@/components/camps/UnifiedCampDetail';

export const dynamic = 'force-dynamic';

export default async function CampDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;

  // Camps are public — service role read. Then auth'd client for the saved
  // check. Per Q6: dashboard detail SELECT now matches the public detail's
  // 21-column shape so a parent never sees less info after signing in.
  const svc = createServiceSupabase();
  const { data: camp } = await svc
    .from('camps')
    .select(
      'id, slug, name, tagline, description, ages_min, ages_max, price_tier, price_min_cents, price_max_cents, categories, website_url, image_url, neighborhood, phone, address, hours_start, hours_end, registration_url, registration_deadline, verified, last_verified_at, logo_url, hero_url, sessions, pricing_tiers, activities, fees, enrollment_window, what_to_bring, lunch_policy, extended_care_policy',
    )
    .eq('slug', slug)
    .maybeSingle();
  if (!camp) notFound();
  const c = camp as UnifiedCampDetailCamp;

  const sb = createServerSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();

  let saved = false;
  let isAdmin = false;
  if (user) {
    const { data: row } = await sb
      .from('saved_camps')
      .select('id')
      .eq('user_id', user.id)
      .eq('camp_id', c.id)
      .maybeSingle();
    saved = Boolean(row);

    isAdmin = (await getAdminRole(user.id, user.email ?? null)) !== null;

    // Fire-and-forget activity log; never block render.
    sb.from('kid_activity')
      .insert({
        user_id: user.id,
        action: 'viewed_camp',
        target_id: c.id,
        target_name: c.name,
        metadata: { slug: c.slug },
      })
      .then(() => undefined, () => undefined);
  }

  return (
    <UnifiedCampDetail
      camp={c}
      mode="app"
      locale={locale}
      isSaved={saved}
      isAdmin={isAdmin}
    />
  );
}
