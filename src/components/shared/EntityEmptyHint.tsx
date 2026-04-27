'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';
import { useTranslations } from 'next-intl';

// Generic empty-state recovery hint, shared by /camps, /app/camps, and
// /schools. The body string is expected to use <clear> and <search> rich-text
// placeholders — the component wires them to URL handlers (clear all params
// vs clear only ?q=) so each surface gets identical UX with one source of
// truth.
//
// `i18nNamespace` points at the parent of {title, body} keys in the active
// locale file:
//   camps:   `camps.filters.empty`
//   schools: `public.schoolsIndex.empty`
//
// `testId` lets each surface keep its existing `data-testid` for tests that
// were written before the rename.

export function EntityEmptyHint({
  hasSearchTerm,
  i18nNamespace,
  testId = 'entity-empty-hint',
}: {
  hasSearchTerm: boolean;
  i18nNamespace: string;
  testId?: string;
}) {
  const t = useTranslations(i18nNamespace);
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
      data-testid={testId}
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
