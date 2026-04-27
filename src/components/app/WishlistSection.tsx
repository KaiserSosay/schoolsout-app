'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { UnifiedCampCard } from '@/components/camps/UnifiedCampCard';

// DECISION: "saves" is the server row shape from supabase: { id, camp: {...} }.
// We optional-chain everything because the camp join may return null if a row
// was soft-deleted from camps.
type Camp = {
  id: string;
  slug: string;
  name: string;
  price_tier: '$' | '$$' | '$$$';
  ages_min: number;
  ages_max: number;
  categories: string[];
  website_url: string | null;
  neighborhood: string | null;
};

type Save = { id: string; camp: Camp | null };

export function WishlistSection({
  saves,
  locale,
}: {
  saves: Save[];
  locale: string;
}) {
  const t = useTranslations('app.dashboard.wishlist');
  const count = saves.length;

  return (
    <section>
      <h3 className="mb-3 text-xs font-black uppercase tracking-wider text-muted">
        {t('title', { count })}
      </h3>
      {count === 0 ? (
        <div className="rounded-2xl border border-dashed border-cream-border bg-white/60 p-6 text-center">
          <p className="text-sm text-muted">{t('empty')}</p>
          <Link
            href={`/${locale}/app/camps`}
            className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-brand-purple hover:underline"
          >
            {t('browse')}
          </Link>
        </div>
      ) : (
        <ul className="space-y-2">
          {saves.map((s) => {
            const camp = s.camp;
            if (!camp) return null;
            return (
              <li key={s.id}>
                <UnifiedCampCard
                  camp={camp}
                  mode="wishlist-tile"
                  isSaved={true}
                  locale={locale}
                />
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
