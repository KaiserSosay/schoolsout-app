'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';
import { useTranslations } from 'next-intl';

// Helpful empty-state — when filters return zero camps, teach the parent
// how to recover instead of just saying "no camps." The two recovery paths:
//   • Clear all filters (reset URL to bare path)
//   • Clear just the search term (preserve other filters)
// Both render as inline tappable links and live in the same component so
// /camps and /app/camps share one source of truth.
export function CampsEmptyHint({ hasSearchTerm }: { hasSearchTerm: boolean }) {
  const t = useTranslations('camps.filters.empty');
  const router = useRouter();
  const pathname = usePathname() ?? '/';
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  function clearAll() {
    startTransition(() => router.push(pathname));
  }

  function clearSearchOnly() {
    const params = new URLSearchParams(searchParams?.toString() ?? '');
    params.delete('q');
    const qs = params.toString();
    startTransition(() => router.push(qs ? `${pathname}?${qs}` : pathname));
  }

  return (
    <div
      role="status"
      data-testid="camps-empty-hint"
      className="rounded-2xl border border-cream-border bg-white p-6 text-center text-sm text-ink"
    >
      <p className="font-bold">{t('title')}</p>
      <p className="mt-2 text-muted">
        {t.rich('body', {
          clear: (chunks) => (
            <button
              type="button"
              onClick={clearAll}
              className="font-bold text-brand-purple underline"
              data-action="clear-filters"
            >
              {chunks}
            </button>
          ),
          search: (chunks) =>
            hasSearchTerm ? (
              <button
                type="button"
                onClick={clearSearchOnly}
                className="font-bold text-brand-purple underline"
                data-action="clear-search"
              >
                {chunks}
              </button>
            ) : (
              <span className="font-bold text-muted">{chunks}</span>
            ),
        })}
      </p>
    </div>
  );
}
