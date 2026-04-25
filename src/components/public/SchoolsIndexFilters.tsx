'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';
import { useTranslations } from 'next-intl';

// Type chips + neighborhood multi-select for /schools.
// URL state shape:
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
}: {
  hoods: string[];
  activeTypes: string[];
  activeHoods: string[];
}) {
  const t = useTranslations('public.schoolsIndex');
  const router = useRouter();
  const pathname = usePathname() ?? '/';
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  function push(next: { types: string[]; hoods: string[] }) {
    const params = new URLSearchParams(searchParams?.toString() ?? '');
    // Filter changes always reset pagination — otherwise the user lands
    // on page 4 of 1, which is a dead view.
    params.delete('page');
    if (next.types.length) params.set('type', next.types.join(','));
    else params.delete('type');
    if (next.hoods.length) params.set('hood', next.hoods.join(','));
    else params.delete('hood');
    const qs = params.toString();
    startTransition(() => {
      router.push(qs ? `${pathname}?${qs}` : pathname);
    });
  }

  function toggle(arr: string[], v: string): string[] {
    return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
  }

  const chipBase =
    'inline-flex min-h-9 items-center rounded-full border px-3 py-1.5 text-xs font-bold transition-colors';
  const chipActive = 'bg-brand-purple text-white border-brand-purple';
  const chipInactive =
    'bg-white text-ink border-cream-border hover:border-brand-purple/40';

  return (
    <div className="space-y-3">
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
        <div role="group" aria-label={t('filters.hoodLabel')} className="flex flex-wrap gap-2" data-testid="schools-hood-filters">
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
      ) : null}
    </div>
  );
}
