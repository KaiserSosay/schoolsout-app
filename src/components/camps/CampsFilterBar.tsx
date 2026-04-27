'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useMemo, useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import {
  AGE_BANDS,
  PRICE_TIERS,
  parseFilters,
  serializeFilters,
  type AgeBand,
  type CampsFilters,
  type PriceTier,
} from '@/lib/camps/filters';
import { chipBase, chipActive, chipInactive } from '@/components/shared/chip-classes';
import { EntitySearchBar } from '@/components/shared/EntitySearchBar';

// 11 seeded categories — same set CampFilters used pre-Goal-3. Living here so
// the public + app pages can both render the chip strip from one source.
export const CATEGORY_KEYS = [
  'Sports',
  'Soccer',
  'Swim',
  'Tennis',
  'Basketball',
  'Art',
  'Theater',
  'Music',
  'Dance',
  'STEM',
  'Nature',
] as const;

type Mode = 'public' | 'app';

type Props = {
  mode: Mode;
  hoods: string[]; // distinct neighborhoods for the advanced drawer
  // app-mode-only: render the "Match my kids" toggle (delegated to whatever
  // already wires the URL ?match=1 param — we just paint the chip).
  matchEnabled?: boolean;
};

export function CampsFilterBar({ mode, hoods, matchEnabled = false }: Props) {
  const t = useTranslations('camps.filters');
  const tCat = useTranslations('app.camps.categories');
  const router = useRouter();
  const pathname = usePathname() ?? '/';
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const filters = useMemo(
    () => parseFilters(new URLSearchParams(searchParams?.toString() ?? '')),
    [searchParams],
  );

  function push(next: CampsFilters) {
    const qs = serializeFilters(next);
    startTransition(() => {
      router.push(qs ? `${pathname}?${qs}` : pathname);
    });
  }

  function toggleArray<T extends string>(arr: T[], value: T): T[] {
    return arr.includes(value) ? arr.filter((x) => x !== value) : [...arr, value];
  }

  return (
    <div className="space-y-3">
      {/* Row 1: search + categories + (app) match-my-kids */}
      <div className="flex flex-wrap items-center gap-2">
        <EntitySearchBar
          value={filters.q}
          onChange={(next) => push({ ...filters, q: next })}
          ariaLabel={t('search.label')}
          placeholder={t('search.placeholder')}
          clearLabel={t('search.clear')}
        />

        {mode === 'app' && matchEnabled ? (
          <button
            type="button"
            aria-pressed={filters.match}
            onClick={() => push({ ...filters, match: !filters.match })}
            className={chipBase + ' ' + (filters.match ? chipActive : chipInactive)}
          >
            🎯 {t('matchMyKids')}
          </button>
        ) : null}
      </div>

      {/* Category chips */}
      <div role="group" aria-label={t('categories.label')} className="flex flex-wrap gap-2" data-testid="camps-categories">
        {CATEGORY_KEYS.map((cat) => {
          const isActive = filters.cats.includes(cat);
          return (
            <button
              key={cat}
              type="button"
              aria-pressed={isActive}
              data-category={cat}
              onClick={() =>
                push({ ...filters, cats: toggleArray(filters.cats, cat) })
              }
              className={chipBase + ' ' + (isActive ? chipActive : chipInactive)}
            >
              {tCat(cat)}
            </button>
          );
        })}
      </div>

      {/* Row 2: care toggles */}
      <div role="group" aria-label={t('toggles.label')} className="flex flex-wrap gap-2" data-testid="camps-care-toggles">
        {/* DECISION: Full-workday chip is gated behind
            NEXT_PUBLIC_ENABLE_FULL_WORKDAY_FILTER until enough camps have
            populated hours/extended-care fields to make it useful — current
            verified data only matches ~4/108 camps, which would make the
            chip feel broken. Re-enable by setting the env var to 'true'
            once an enrichment pass lifts the match count above ~25. The
            full filter pipeline (URL state, server filtering, lib code)
            stays wired up so the chip lights up immediately when flipped. */}
        {process.env.NEXT_PUBLIC_ENABLE_FULL_WORKDAY_FILTER === 'true' ? (
          <button
            type="button"
            aria-pressed={filters.fullWorkday}
            title={t('toggles.fullWorkday.tooltip')}
            onClick={() => push({ ...filters, fullWorkday: !filters.fullWorkday })}
            className={chipBase + ' ' + (filters.fullWorkday ? chipActive : chipInactive)}
            data-toggle="full_workday"
          >
            🏢 {t('toggles.fullWorkday.label')}
          </button>
        ) : null}
        <button
          type="button"
          aria-pressed={filters.beforeCare}
          onClick={() => push({ ...filters, beforeCare: !filters.beforeCare })}
          className={chipBase + ' ' + (filters.beforeCare ? chipActive : chipInactive)}
          data-toggle="before_care"
        >
          ☀️ {t('toggles.beforeCare.label')}
        </button>
        <button
          type="button"
          aria-pressed={filters.afterCare}
          onClick={() => push({ ...filters, afterCare: !filters.afterCare })}
          className={chipBase + ' ' + (filters.afterCare ? chipActive : chipInactive)}
          data-toggle="after_care"
        >
          🌙 {t('toggles.afterCare.label')}
        </button>
      </div>

      {/* Row 3: advanced drawer */}
      <div>
        <button
          type="button"
          onClick={() => setAdvancedOpen((v) => !v)}
          aria-expanded={advancedOpen}
          aria-controls="camps-advanced-filters"
          className="text-xs font-bold text-brand-purple hover:underline min-h-9 inline-flex items-center"
        >
          {advancedOpen ? '▾' : '▸'} {t('advanced.toggle')}
        </button>
        {advancedOpen ? (
          <div
            id="camps-advanced-filters"
            className="mt-3 space-y-3 rounded-2xl border border-cream-border bg-white p-3"
          >
            <FieldGroup label={t('advanced.ages')}>
              {AGE_BANDS.map((band) => {
                const isActive = filters.ages === band;
                return (
                  <button
                    key={band}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() =>
                      push({
                        ...filters,
                        ages: isActive ? null : (band as AgeBand),
                      })
                    }
                    className={chipBase + ' ' + (isActive ? chipActive : chipInactive)}
                    data-age={band}
                  >
                    {band}
                  </button>
                );
              })}
            </FieldGroup>

            <FieldGroup label={t('advanced.price')}>
              {PRICE_TIERS.map((tier) => {
                const isActive = filters.tier.includes(tier);
                return (
                  <button
                    key={tier}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() =>
                      push({
                        ...filters,
                        tier: toggleArray(filters.tier, tier as PriceTier),
                      })
                    }
                    className={chipBase + ' ' + (isActive ? chipActive : chipInactive)}
                    data-tier={tier}
                  >
                    {tier}
                  </button>
                );
              })}
            </FieldGroup>

            {hoods.length ? (
              <FieldGroup label={t('advanced.neighborhood')}>
                {hoods.map((h) => {
                  const isActive = filters.hood.includes(h);
                  return (
                    <button
                      key={h}
                      type="button"
                      aria-pressed={isActive}
                      onClick={() =>
                        push({ ...filters, hood: toggleArray(filters.hood, h) })
                      }
                      className={chipBase + ' ' + (isActive ? chipActive : chipInactive)}
                      data-hood={h}
                    >
                      {h}
                    </button>
                  );
                })}
              </FieldGroup>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function FieldGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-muted">
        {label}
      </p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}
