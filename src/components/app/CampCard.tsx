'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useMode } from './ModeProvider';
import { SaveCampButton } from './SaveCampButton';

// DECISION: Card is a <Link>. Save button stopPropagation's to avoid nav.
// Mode-aware: cream+border in parent mode, white/10 glass in kid mode.
// The "⚠ pending verification" indicator is deliberately small and non-loud —
// we want honest disclosure without scaring parents off unreviewed listings.
export type CampCardCamp = {
  id: string;
  slug: string;
  name: string;
  ages_min: number;
  ages_max: number;
  price_tier: '$' | '$$' | '$$$';
  categories: string[];
  neighborhood: string | null;
  verified: boolean;
  is_featured?: boolean;
  description?: string | null;
};

export function CampCard({
  camp,
  saved,
  locale,
}: {
  camp: CampCardCamp;
  saved: boolean;
  locale: string;
}) {
  const t = useTranslations('app.camps');
  const { mode } = useMode();

  const containerCls =
    mode === 'parents'
      ? 'border border-cream-border bg-white hover:border-brand-purple/40'
      : 'border border-white/10 bg-white/10 backdrop-blur-md hover:border-white/30';

  const titleCls = mode === 'parents' ? 'text-ink' : 'text-white';
  const mutedCls = mode === 'parents' ? 'text-muted' : 'text-white/70';
  const pillCls =
    mode === 'parents'
      ? 'bg-purple-soft text-brand-purple'
      : 'bg-white/15 text-white';

  const pills = camp.categories.slice(0, 2);

  return (
    <article
      className={
        'relative flex items-center gap-4 rounded-2xl p-4 transition-colors ' +
        containerCls
      }
    >
      <Link
        href={`/${locale}/app/camps/${camp.slug}`}
        className="flex min-w-0 flex-1 flex-col gap-1.5"
        aria-label={t('viewCamp', { name: camp.name })}
      >
        <div className="flex items-center gap-2">
          <h3
            className={'truncate text-base font-black ' + titleCls}
            style={{ letterSpacing: '-0.01em' }}
          >
            {camp.name}
          </h3>
          {!camp.verified ? (
            <span
              className={'shrink-0 text-xs ' + mutedCls}
              title={t('pendingVerification')}
              aria-label={t('pendingVerification')}
            >
              ⚠
            </span>
          ) : null}
        </div>
        <p className={'text-xs ' + mutedCls}>
          {t('ages', {
            min: camp.ages_min,
            max: camp.ages_max,
            price: camp.price_tier,
          })}
          {camp.neighborhood ? ' · ' + camp.neighborhood : ''}
        </p>
        {pills.length ? (
          <div className="mt-1 flex flex-wrap gap-1.5">
            {pills.map((c) => (
              <span
                key={c}
                className={
                  'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ' +
                  pillCls
                }
              >
                {c}
              </span>
            ))}
          </div>
        ) : null}
      </Link>

      <SaveCampButton
        campId={camp.id}
        campName={camp.name}
        initiallySaved={saved}
        size="md"
      />
    </article>
  );
}
