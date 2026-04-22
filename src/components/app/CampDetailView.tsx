'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { SaveCampButton } from './SaveCampButton';
import { useMode } from './ModeProvider';

// DECISION: Client component that owns the mode-aware styling for the camp
// detail page. The outer page stays a Server Component for auth + data fetch;
// this view does the presentation and reads useMode().

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

export function CampDetailView({
  camp,
  saved,
  locale,
}: {
  camp: CampFull;
  saved: boolean;
  locale: string;
}) {
  const t = useTranslations('app.camps');
  const { mode } = useMode();
  const isParents = mode === 'parents';

  const cardCls = isParents
    ? 'border border-cream-border bg-white'
    : 'border border-white/10 bg-white/10 backdrop-blur';
  const nameCls = isParents ? 'text-ink' : 'text-white';
  const mutedCls = isParents ? 'text-muted' : 'text-white/70';
  const metaPillCls = isParents
    ? 'bg-ink/5 text-ink'
    : 'bg-white/15 text-white';
  const catPillCls = isParents
    ? 'bg-purple-soft text-brand-purple'
    : 'bg-white/20 text-white';
  const warnCls = isParents
    ? 'border border-cream-border bg-white text-muted'
    : 'border border-white/20 bg-white/10 text-white/70';
  const descCls = isParents ? 'text-ink/80' : 'text-white/80';
  const backCls = isParents
    ? 'text-muted hover:text-ink'
    : 'text-white/60 hover:text-white';

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 md:px-6 md:py-10">
      <Link
        href={`/${locale}/app/camps`}
        className={'inline-flex items-center gap-1 text-sm font-bold ' + backCls}
      >
        ← {t('backToCamps')}
      </Link>

      <div className={'mt-4 overflow-hidden rounded-3xl ' + cardCls}>
        {camp.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={camp.image_url}
            alt={camp.name}
            loading="lazy"
            className="aspect-[16/9] w-full object-cover"
          />
        ) : (
          <div className="aspect-[16/9] w-full bg-gradient-to-br from-brand-purple via-purple-600 to-blue-600" />
        )}

        <div className="space-y-5 p-5 md:p-7">
          <div>
            <h1
              className={'text-2xl font-black md:text-3xl ' + nameCls}
              style={{ letterSpacing: '-0.02em' }}
            >
              {camp.name}
            </h1>
            {camp.neighborhood ? (
              <p className={'mt-1 text-sm ' + mutedCls}>📍 {camp.neighborhood}</p>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-1.5">
            <span
              className={
                'inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ' +
                metaPillCls
              }
            >
              {t('ages', {
                min: camp.ages_min,
                max: camp.ages_max,
                price: camp.price_tier,
              })}
            </span>
            {(camp.categories ?? []).map((cat) => (
              <span
                key={cat}
                className={
                  'inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ' +
                  catPillCls
                }
              >
                {cat}
              </span>
            ))}
            {!camp.verified ? (
              <span
                className={
                  'inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ' +
                  warnCls
                }
              >
                ⚠ {t('pendingVerification')}
              </span>
            ) : null}
          </div>

          {camp.description ? (
            <p className={'text-sm leading-relaxed ' + descCls}>
              {camp.description}
            </p>
          ) : null}

          <div className="grid gap-3 md:grid-cols-2">
            <SaveCampButton
              campId={camp.id}
              campName={camp.name}
              initiallySaved={saved}
              fullWidth
            />

            {camp.website_url ? (
              <a
                href={camp.website_url}
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
                className={
                  'flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-black ' +
                  (isParents
                    ? 'border border-cream-border bg-ink/5 text-muted'
                    : 'border border-white/20 bg-white/5 text-white/50')
                }
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
