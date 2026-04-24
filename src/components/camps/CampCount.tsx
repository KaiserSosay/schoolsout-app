import { useTranslations } from 'next-intl';

// DECISION: keep this as a sync component using `useTranslations` (works in
// server components in next-intl v4) so it's trivially testable via the same
// NextIntlClientProvider wrapper the rest of the suite already uses.
//
// Total denominator is the count of ALL verified camps in scope (Miami-Dade,
// verified=true) and does NOT change when filters apply. Per spec: even on
// /app/camps with "Match my kids" on, total stays anchored on the absolute
// count so parents see "how many camps exist" vs "how many fit X kid".
export function CampCount({
  filtered,
  total,
  hasFilters,
}: {
  // `locale` no longer needed — useTranslations resolves through provider.
  locale?: string;
  filtered: number;
  total: number;
  hasFilters: boolean;
}) {
  const t = useTranslations('camps.count');

  if (!hasFilters) {
    return (
      <p data-testid="camp-count" className="text-sm text-ink editorial-body">
        <span className="font-bold">{t('total', { n: total })}</span>
      </p>
    );
  }

  if (filtered === 0) {
    return (
      <p data-testid="camp-count" className="text-sm text-muted editorial-body">
        <span className="font-bold text-ink">0</span>{' '}
        {t('zero', { total })}
      </p>
    );
  }

  return (
    <p data-testid="camp-count" className="text-sm text-muted editorial-body">
      <span className="font-bold text-ink">{filtered}</span>{' '}
      {t('filtered', { total })}
    </p>
  );
}
