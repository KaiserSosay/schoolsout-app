'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { chipBase, chipActive, chipInactive } from '@/components/shared/chip-classes';
import { EntitySearchBar } from '@/components/shared/EntitySearchBar';

// Type chips + neighborhood multi-select + free-text search for /schools.
// URL state shape:
//   ?q=coral
//   ?type=public,charter
//   ?hood=Coral+Gables,Pinecrest
//   ?page=2  (kept intact when toggling filters; reset on filter change)

const TYPE_KEYS = [
  'public',
  'charter',
  'magnet',
  'private',
  'religious',
  'independent',
  'preschool',
] as const;

export type SchoolTypeKey = (typeof TYPE_KEYS)[number];

export function SchoolsIndexFilters({
  hoods,
  activeTypes,
  activeHoods,
  activeQuery,
}: {
  hoods: string[];
  activeTypes: string[];
  activeHoods: string[];
  activeQuery: string;
}) {
  const t = useTranslations('public.schoolsIndex');
  const router = useRouter();
  const pathname = usePathname() ?? '/';
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  function push(next: { types: string[]; hoods: string[]; query?: string }) {
    const params = new URLSearchParams(searchParams?.toString() ?? '');
    // Filter changes always reset pagination — otherwise the user lands
    // on page 4 of 1, which is a dead view.
    params.delete('page');
    if (next.types.length) params.set('type', next.types.join(','));
    else params.delete('type');
    if (next.hoods.length) params.set('hood', next.hoods.join(','));
    else params.delete('hood');
    if (next.query !== undefined) {
      if (next.query) params.set('q', next.query);
      else params.delete('q');
    }
    const qs = params.toString();
    startTransition(() => {
      router.push(qs ? `${pathname}?${qs}` : pathname);
    });
  }

  function pushQuery(query: string) {
    push({ types: activeTypes, hoods: activeHoods, query });
  }

  function toggle(arr: string[], v: string): string[] {
    return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
  }

  return (
    <div className="space-y-3">
      <EntitySearchBar
        value={activeQuery}
        onChange={pushQuery}
        ariaLabel={t('search.label')}
        placeholder={t('search.placeholder')}
        clearLabel={t('search.clear')}
      />
      <div role="group" aria-label={t('filters.typeLabel')} className="flex flex-wrap gap-2" data-testid="schools-type-filters">
        {TYPE_KEYS.map((key) => {
          const isActive = activeTypes.includes(key);
          return (
            <button
              key={key}
              type="button"
              aria-pressed={isActive}
              data-type={key}
              onClick={() =>
                push({ types: toggle(activeTypes, key), hoods: activeHoods })
              }
              className={chipBase + ' ' + (isActive ? chipActive : chipInactive)}
            >
              {t(`filters.types.${key}`)}
            </button>
          );
        })}
      </div>
      {hoods.length ? (
        <details
          className="group rounded-2xl border border-cream-border bg-white"
          // Auto-open when a neighborhood filter is active so the user can see
          // their selection without an extra tap. Pure render-time prop — no
          // local state, so the URL stays the source of truth on reload/share.
          open={activeHoods.length > 0}
          data-testid="schools-hood-accordion"
        >
          <summary
            className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-2xl px-4 py-2.5 text-sm font-bold text-ink"
          >
            <span>
              {t('filters.neighborhoodsHeader')}{' '}
              <span className="font-normal text-muted">({hoods.length})</span>
              {activeHoods.length > 0 ? (
                <span className="ml-2 font-normal text-brand-purple">
                  · {activeHoods.length}
                </span>
              ) : null}
            </span>
            <span
              aria-hidden="true"
              className="text-muted transition-transform group-open:rotate-180"
            >
              ▾
            </span>
          </summary>
          <div
            role="group"
            aria-label={t('filters.hoodLabel')}
            className="flex flex-wrap gap-2 px-4 pb-4 pt-1"
            data-testid="schools-hood-filters"
          >
            {hoods.map((h) => {
              const isActive = activeHoods.includes(h);
              return (
                <button
                  key={h}
                  type="button"
                  aria-pressed={isActive}
                  data-hood={h}
                  onClick={() =>
                    push({ types: activeTypes, hoods: toggle(activeHoods, h) })
                  }
                  className={chipBase + ' ' + (isActive ? chipActive : chipInactive)}
                >
                  {h}
                </button>
              );
            })}
          </div>
        </details>
      ) : null}
    </div>
  );
}
