import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { createServiceSupabase } from '@/lib/supabase/service';
import { SaveCampButton } from '@/components/app/SaveCampButton';

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
  const t = await getTranslations({ locale, namespace: 'app.camps' });

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
      })
      .then(() => undefined, () => undefined);
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 md:px-6 md:py-10">
      <Link
        href={`/${locale}/app/camps`}
        className="inline-flex items-center gap-1 text-sm font-bold text-muted hover:text-ink"
      >
        ← {t('backToCamps')}
      </Link>

      <div className="mt-4 overflow-hidden rounded-3xl border border-cream-border bg-white">
        {c.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={c.image_url}
            alt={c.name}
            loading="lazy"
            className="aspect-[16/9] w-full object-cover"
          />
        ) : (
          <div className="aspect-[16/9] w-full bg-gradient-to-br from-brand-purple via-purple-600 to-blue-600" />
        )}

        <div className="space-y-5 p-5 md:p-7">
          <div>
            <h1
              className="text-2xl font-black text-ink md:text-3xl"
              style={{ letterSpacing: '-0.02em' }}
            >
              {c.name}
            </h1>
            {c.neighborhood ? (
              <p className="mt-1 text-sm text-muted">📍 {c.neighborhood}</p>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-1.5">
            <span className="inline-flex items-center rounded-full bg-ink/5 px-3 py-1 text-xs font-bold text-ink">
              {t('ages', {
                min: c.ages_min,
                max: c.ages_max,
                price: c.price_tier,
              })}
            </span>
            {(c.categories ?? []).map((cat) => (
              <span
                key={cat}
                className="inline-flex items-center rounded-full bg-purple-soft px-3 py-1 text-xs font-bold text-brand-purple"
              >
                {cat}
              </span>
            ))}
            {!c.verified ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-cream-border bg-white px-3 py-1 text-xs font-bold text-muted">
                ⚠ {t('pendingVerification')}
              </span>
            ) : null}
          </div>

          {c.description ? (
            <p className="text-sm leading-relaxed text-ink/80">{c.description}</p>
          ) : null}

          <div className="grid gap-3 md:grid-cols-2">
            <SaveCampButton
              campId={c.id}
              campName={c.name}
              initiallySaved={saved}
              fullWidth
            />

            {c.website_url ? (
              <a
                href={c.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gold px-4 py-3 text-sm font-black text-ink transition-colors hover:brightness-105"
              >
                {t('visitWebsite')} ↗
              </a>
            ) : (
              <button
                type="button"
                disabled
                className="flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-2xl border border-cream-border bg-ink/5 px-4 py-3 text-sm font-black text-muted"
              >
                {t('websiteComingSoon')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
