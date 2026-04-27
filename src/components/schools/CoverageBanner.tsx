'use client';

import { useTranslations } from 'next-intl';
import type { YearCoverage } from '@/lib/schools/year-coverage';

// Sits above the closure list on every school detail page. Reads the
// (current, next) coverage tuple and picks one of five variants:
//
//   - bothVerified         green "✓ Both years verified"
//   - currentEnded         green "✓ The {year} year has ended" (Jun-Jul)
//   - currentMissing       amber "we have {next}, but {current} isn't published"
//                          → CTA to email us the current-year PDF
//   - nextMissing          amber "we have {current}, but {next} isn't published"
//                          → no CTA (next year often publishes May-June)
//   - partial              amber "we have {N} dates for {year}, may be incomplete"
//                          → CTA to flag a missing closure
//
// Renders nothing when both years are 'unavailable' — the
// UnverifiedSchoolCalendarPlaceholder in a sibling slot is the right
// surface for the no-data-at-all case, not this banner.

export type CoverageBannerVariant =
  | 'both-verified'
  | 'current-ended'
  | 'current-missing'
  | 'next-missing'
  | 'partial-current'
  | 'partial-next'
  // Phase 4.7.x — current school year has ZERO school-confirmed
  // closures but ≥1 derived federal-holiday rows. Honest framing:
  // "we have next year + federal holidays for this year."
  | 'current-federal-holidays';

export function pickCoverageVariant(
  current: YearCoverage,
  next: YearCoverage,
): CoverageBannerVariant | null {
  // Federal-holidays-only beats current-missing because it carries
  // useful bridge data. The "current-missing" copy promises an empty
  // current year — wrong when the user is about to see 5 holiday rows.
  if (
    current.schoolConfirmedCount === 0 &&
    current.federalHolidayCount > 0 &&
    next.status === 'verified'
  ) {
    return 'current-federal-holidays';
  }
  // Mom's TGP case (pre-mig-044) — current missing, next verified.
  if (current.status === 'unavailable' && next.status === 'verified') {
    return 'current-missing';
  }
  // Summer gap — current school year is over, next has data.
  if (current.isEnded && next.status !== 'unavailable') {
    return 'current-ended';
  }
  if (current.status === 'verified' && next.status === 'verified') {
    return 'both-verified';
  }
  if (current.status === 'verified' && next.status === 'unavailable') {
    return 'next-missing';
  }
  if (current.status === 'partial') return 'partial-current';
  if (next.status === 'partial') return 'partial-next';
  return null;
}

export function CoverageBanner({
  locale,
  current,
  next,
  schoolName,
  schoolSlug,
}: {
  locale: string;
  current: YearCoverage;
  next: YearCoverage;
  schoolName: string;
  schoolSlug: string;
}) {
  const t = useTranslations('public.school.yearCoverage');
  const variant = pickCoverageVariant(current, next);
  if (!variant) return null;

  function openFeatureRequest(bodyDraft: string) {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(
      new CustomEvent('so-open-feature-request', {
        detail: {
          category: 'idea',
          pagePath: `/${locale}/schools/${schoolSlug}`,
          bodyDraft,
        },
      }),
    );
  }

  if (variant === 'both-verified') {
    return (
      <section
        data-testid="coverage-banner-both-verified"
        className="rounded-3xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm text-emerald-900"
      >
        {t('bothVerified', {
          currentYear: current.year,
          nextYear: next.year,
        })}
      </section>
    );
  }

  if (variant === 'current-ended') {
    return (
      <section
        data-testid="coverage-banner-current-ended"
        className="rounded-3xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm text-emerald-900"
      >
        {t('currentEnded', { year: current.year, nextYear: next.year })}
      </section>
    );
  }

  if (variant === 'next-missing') {
    return (
      <section
        data-testid="coverage-banner-next-missing"
        className="rounded-3xl border-2 border-amber-300 bg-amber-50 p-5"
      >
        <p className="text-sm font-bold text-amber-900">
          ⚠ {t('currentVerifiedNextMissingHeadline', {
            currentYear: current.year,
            nextYear: next.year,
          })}
        </p>
        <p className="mt-1 text-sm text-amber-900/85">
          {t('currentVerifiedNextMissingBody')}
        </p>
      </section>
    );
  }

  if (variant === 'current-federal-holidays') {
    return (
      <section
        data-testid="coverage-banner-current-federal-holidays"
        className="rounded-3xl border-2 border-amber-300 bg-amber-50 p-5"
      >
        <p className="text-sm font-bold text-amber-900">
          ⚠ {t('currentFederalHolidaysHeadline', {
            currentYear: current.year,
            nextYear: next.year,
            schoolName,
          })}
        </p>
        <p className="mt-1 text-sm text-amber-900/85">
          {t('currentFederalHolidaysBody', { currentYear: current.year })}
        </p>
        <button
          type="button"
          onClick={() =>
            openFeatureRequest(
              `${current.year} calendar PDF for ${schoolName}: I have it / can share these dates / `,
            )
          }
          className="mt-3 inline-flex min-h-11 items-center justify-center rounded-full bg-ink px-4 py-2 text-sm font-black text-cream hover:-translate-y-0.5 hover:shadow-lg"
        >
          {t('emailPdfButton')}
        </button>
      </section>
    );
  }

  if (variant === 'current-missing') {
    return (
      <section
        data-testid="coverage-banner-current-missing"
        className="rounded-3xl border-2 border-amber-300 bg-amber-50 p-5"
      >
        <p className="text-sm font-bold text-amber-900">
          ⚠ {t('currentMissingNextVerifiedHeadline', {
            currentYear: current.year,
            nextYear: next.year,
          })}
        </p>
        <p className="mt-1 text-sm text-amber-900/85">
          {t('currentMissingNextVerifiedBody')}
        </p>
        <button
          type="button"
          onClick={() =>
            openFeatureRequest(
              `${current.year} calendar PDF for ${schoolName}: I have it / can share these dates / `,
            )
          }
          className="mt-3 inline-flex min-h-11 items-center justify-center rounded-full bg-ink px-4 py-2 text-sm font-black text-cream hover:-translate-y-0.5 hover:shadow-lg"
        >
          {t('emailPdfButton')}
        </button>
      </section>
    );
  }

  // partial-current and partial-next share copy patterns.
  const isCurrent = variant === 'partial-current';
  const data = isCurrent ? current : next;
  return (
    <section
      data-testid={
        isCurrent
          ? 'coverage-banner-partial-current'
          : 'coverage-banner-partial-next'
      }
      className="rounded-3xl border-2 border-amber-300 bg-amber-50 p-5"
    >
      <p className="text-sm font-bold text-amber-900">
        ⚠{' '}
        {t(isCurrent ? 'partialCurrentHeadline' : 'partialNextHeadline', {
          count: data.closureCount,
          currentYear: data.year,
          nextYear: data.year,
        })}
      </p>
      <p className="mt-1 text-sm text-amber-900/85">
        {t(isCurrent ? 'partialCurrentBody' : 'partialNextBody')}
      </p>
      <button
        type="button"
        onClick={() =>
          openFeatureRequest(
            `Missing closure for ${schoolName} (${data.year}): `,
          )
        }
        className="mt-3 inline-flex min-h-11 items-center justify-center rounded-full bg-ink px-4 py-2 text-sm font-black text-cream hover:-translate-y-0.5 hover:shadow-lg"
      >
        {t('tellUsButton')}
      </button>
    </section>
  );
}
