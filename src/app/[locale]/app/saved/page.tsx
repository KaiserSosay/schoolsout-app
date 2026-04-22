import { getTranslations } from 'next-intl/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { CampCard, type CampCardCamp } from '@/components/app/CampCard';
import { AppPageHeader } from '@/components/app/AppPageHeader';
import { SavedEmpty } from '@/components/app/SavedEmpty';

export const dynamic = 'force-dynamic';

type SavedRow = {
  created_at: string;
  camp:
    | (CampCardCamp & { description: string | null })
    | Array<CampCardCamp & { description: string | null }>
    | null;
};

export default async function SavedPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'app.saved' });

  const sb = createServerSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();

  let camps: CampCardCamp[] = [];
  if (user) {
    const { data } = await sb
      .from('saved_camps')
      .select(
        'created_at, camp:camps(id, slug, name, description, ages_min, ages_max, price_tier, categories, neighborhood, verified, is_featured)',
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    const rows = (data ?? []) as SavedRow[];
    const mapped: Array<CampCardCamp | null> = rows.map((r) =>
      Array.isArray(r.camp) ? (r.camp[0] ?? null) : r.camp,
    );
    camps = mapped.filter((c): c is CampCardCamp => c !== null);
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 md:px-6 md:py-10">
      <AppPageHeader eyebrow="WISHLIST" title={t('title')} />

      {camps.length === 0 ? (
        <SavedEmpty
          emptyText={t('empty')}
          browseText={t('browse')}
          browseHref={`/${locale}/app/camps`}
        />
      ) : (
        <ul className="space-y-3">
          {camps.map((camp) => (
            <li key={camp.id}>
              <CampCard camp={camp} saved={true} locale={locale} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
