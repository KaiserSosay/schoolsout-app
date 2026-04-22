'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { useMode } from './ModeProvider';

// DECISION: Sort lives in the URL (?sort=distance|price|name) so it survives
// page refresh and deep-links from emails/shares. "From" origin is only shown
// when sort=distance; options are the user's kid schools + saved_locations
// (dedup'd by coord rounding).

export type FromOption = {
  id: string;
  label: string;
  latitude: number;
  longitude: number;
};

export function CampSortControl({
  fromOptions,
  activeSort,
  activeFromId,
  distanceAvailable,
}: {
  fromOptions: FromOption[];
  activeSort: 'distance' | 'price' | 'name';
  activeFromId: string | null;
  distanceAvailable: boolean;
}) {
  const t = useTranslations('app.camps');
  const router = useRouter();
  const pathname = usePathname() ?? '/';
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const { mode } = useMode();

  const setSort = (sort: 'distance' | 'price' | 'name') => {
    if (sort === 'distance' && !distanceAvailable) return;
    const params = new URLSearchParams(searchParams?.toString() ?? '');
    params.set('sort', sort);
    if (sort !== 'distance') {
      params.delete('from_lat');
      params.delete('from_lng');
      params.delete('from_id');
    } else if (!params.get('from_id') && fromOptions[0]) {
      const first = fromOptions[0];
      params.set('from_id', first.id);
      params.set('from_lat', String(first.latitude));
      params.set('from_lng', String(first.longitude));
    }
    const qs = params.toString();
    startTransition(() => router.push(qs ? `${pathname}?${qs}` : pathname));
  };

  const setFrom = (id: string) => {
    const pick = fromOptions.find((o) => o.id === id);
    if (!pick) return;
    const params = new URLSearchParams(searchParams?.toString() ?? '');
    params.set('sort', 'distance');
    params.set('from_id', pick.id);
    params.set('from_lat', String(pick.latitude));
    params.set('from_lng', String(pick.longitude));
    const qs = params.toString();
    startTransition(() => router.push(qs ? `${pathname}?${qs}` : pathname));
  };

  const parentPill = 'bg-white text-ink border-cream-border hover:border-brand-purple/40';
  const parentActive = 'bg-brand-purple text-white border-brand-purple';
  const kidPill = 'bg-white/10 text-white border-white/20 hover:border-white/40';
  const kidActive = 'bg-cta-yellow text-purple-deep border-cta-yellow';
  const pillBase = mode === 'parents' ? parentPill : kidPill;
  const pillActive = mode === 'parents' ? parentActive : kidActive;
  const labelCls = mode === 'parents' ? 'text-muted' : 'text-white/70';

  return (
    <div className="space-y-2" data-testid="camp-sort-control">
      <div className="flex flex-wrap items-center gap-2">
        <span className={'text-xs font-bold uppercase tracking-widest ' + labelCls}>
          {t('sort.label')}:
        </span>
        {(['distance', 'price', 'name'] as const).map((s) => {
          const isActive = activeSort === s;
          const disabled = s === 'distance' && !distanceAvailable;
          return (
            <button
              key={s}
              type="button"
              onClick={() => setSort(s)}
              disabled={disabled}
              aria-pressed={isActive}
              aria-disabled={disabled}
              data-sort={s}
              className={
                'inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-bold transition-colors ' +
                (disabled ? 'opacity-40 cursor-not-allowed ' : '') +
                (isActive ? pillActive : pillBase)
              }
            >
              {t(`sort.${s}`)}
            </button>
          );
        })}
      </div>

      {activeSort === 'distance' && fromOptions.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          <label
            className={'text-xs font-bold uppercase tracking-widest ' + labelCls}
            htmlFor="camp-from-origin"
          >
            {t('distance.from')}:
          </label>
          <select
            id="camp-from-origin"
            value={activeFromId ?? fromOptions[0]?.id ?? ''}
            onChange={(e) => setFrom(e.target.value)}
            className={
              'rounded-full border px-3 py-1.5 text-xs font-semibold ' +
              (mode === 'parents'
                ? 'bg-white text-ink border-cream-border'
                : 'bg-white/10 text-white border-white/20')
            }
          >
            {fromOptions.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {!distanceAvailable ? (
        <p className={'text-xs ' + labelCls} data-testid="camp-distance-unavailable">
          📍 {t('distance.setAddress')}
        </p>
      ) : null}
    </div>
  );
}
