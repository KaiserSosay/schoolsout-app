import { getTranslations } from 'next-intl/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { createServiceSupabase } from '@/lib/supabase/service';
import { CampCard, type CampCardCamp } from '@/components/app/CampCard';
import { CampFilters } from '@/components/app/CampFilters';
import { AppPageHeader } from '@/components/app/AppPageHeader';
import { CampsBackLink } from '@/components/app/CampsBackLink';
import { CampsEmpty } from '@/components/app/CampsEmpty';

export const dynamic = 'force-dynamic';

type CampRow = CampCardCamp & { description: string | null };

export default async function CampsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ categories?: string }>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  const t = await getTranslations({ locale, namespace: 'app.camps' });

  const categoriesFilter = sp.categories
    ? sp.categories
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean)
    : [];

  // DECISION: use service role for camps read (public) and authed client for
  // the user's saved set (RLS-protected). Parallel to shave latency.
  const svc = createServiceSupabase();
  const sb = createServerSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();

  const [campsResp, savesResp] = await Promise.all([
    svc
      .from('camps')
      .select(
        'id, slug, name, description, ages_min, ages_max, price_tier, categories, neighborhood, verified, is_featured',
      )
      .order('is_featured', { ascending: false })
      .order('name'),
    user
      ? sb.from('saved_camps').select('camp_id').eq('user_id', user.id)
      : Promise.resolve({ data: [] as { camp_id: string }[] }),
  ]);

  const rows = (campsResp.data ?? []) as CampRow[];
  const savedSet = new Set(
    (savesResp.data ?? []).map((s) => (s as { camp_id: string }).camp_id),
  );

  const filtered =
    categoriesFilter.length === 0
      ? rows
      : rows.filter((c) =>
          (c.categories ?? []).some((cat) => categoriesFilter.includes(cat)),
        );

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:px-6 md:py-10">
      <div className="mb-4 flex items-center justify-between gap-3">
        <CampsBackLink href={`/${locale}/app`} label={t('back')} />
      </div>

      <AppPageHeader
        eyebrow="PLAN"
        title={t('title')}
        subtitle={t('subtitle')}
      />

      <div className="mb-5">
        <CampFilters active={categoriesFilter} />
      </div>

      {filtered.length === 0 ? (
        <CampsEmpty text={t('empty')} />
      ) : (
        <ul className="space-y-3">
          {filtered.map((camp) => (
            <li key={camp.id}>
              <CampCard
                camp={camp}
                saved={savedSet.has(camp.id)}
                locale={locale}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
