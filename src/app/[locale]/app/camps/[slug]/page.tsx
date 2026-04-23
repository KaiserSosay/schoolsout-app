import { notFound } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase/server';
import { createServiceSupabase } from '@/lib/supabase/service';
import { CampDetailView } from '@/components/app/CampDetailView';

export const dynamic = 'force-dynamic';

type CampFull = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  ages_min: number;
  ages_max: number;
  price_tier: '$' | '$$' | '$$$';
  categories: string[];
  website_url: string | null;
  image_url: string | null;
  neighborhood: string | null;
  is_featured: boolean;
  verified: boolean;
};

export default async function CampDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;

  // Camps are public — service role read. Then auth'd client for the saved check.
  const svc = createServiceSupabase();
  const { data: camp } = await svc
    .from('camps')
    .select(
      'id, slug, name, description, ages_min, ages_max, price_tier, categories, website_url, image_url, neighborhood, is_featured, verified',
    )
    .eq('slug', slug)
    .maybeSingle();
  if (!camp) notFound();
  const c = camp as CampFull;

  const sb = createServerSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();

  let saved = false;
  if (user) {
    const { data: row } = await sb
      .from('saved_camps')
      .select('id')
      .eq('user_id', user.id)
      .eq('camp_id', c.id)
      .maybeSingle();
    saved = Boolean(row);

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

  return <CampDetailView camp={c} saved={saved} locale={locale} />;
}
