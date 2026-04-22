import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { CampCard, type CampCardCamp } from '@/components/app/CampCard';

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
      <header className="mb-5">
        <div className="text-[11px] font-black uppercase tracking-wider text-brand-purple">
          WISHLIST
        </div>
        <h1
          className="mt-1 text-3xl font-black text-ink md:text-4xl"
          style={{ letterSpacing: '-0.02em' }}
        >
          {t('title')}
        </h1>
      </header>

      {camps.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-cream-border bg-white/60 p-8 text-center">
          <p className="text-sm text-muted">{t('empty')}</p>
          <Link
            href={`/${locale}/app/camps`}
            className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-brand-purple hover:underline"
          >
            {t('browse')} →
          </Link>
        </div>
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
