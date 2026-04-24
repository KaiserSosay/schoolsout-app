'use client';

import { useTranslations, useLocale } from 'next-intl';
import type { CompletenessBand } from '@/lib/camps/completeness';

// Phase 2.7 Goal 1: honest-disclosure badge on camp cards.
//   - complete (≥100%): no badge at all (clean UI reward for good data)
//   - partial  (70-99%): muted pill "Missing: phone, hours" — just the facts
//   - limited  (<70%):   amber pill "Limited info — help us verify" that
//                        opens the feature-request modal pre-filled
//
// Tap on limited → dispatches so-open-feature-request with a CustomEvent
// carrying preset category + body draft. FeatureRequestModal is the global
// listener; we extend it to read the event detail in a follow-up commit if
// needed. For now the modal opens with empty body and the user types their
// correction — still low-friction.

export function CampCompletenessBadge({
  band,
  missing,
  campName,
  campSlug,
}: {
  band: CompletenessBand;
  missing: string[];
  campName: string;
  campSlug: string;
}) {
  const t = useTranslations('app.camps.completeness');
  const locale = useLocale();

  if (band === 'complete') return null;

  if (band === 'partial') {
    // Plain text, not a button — low visual noise.
    const label = t('partial', {
      fields: missing.slice(0, 3).map((m) => t(`field.${m}`)).join(', '),
    });
    return (
      <p
        className="mt-1 text-[11px] font-medium text-muted"
        data-testid="camp-completeness-partial"
        aria-label={label}
      >
        {label}
      </p>
    );
  }

  // band === 'limited' — actionable amber pill.
  const onClick = (e: React.MouseEvent) => {
    // Card itself is a Link; stopPropagation so tapping the pill doesn't nav.
    e.preventDefault();
    e.stopPropagation();
    const detail = {
      category: 'correction' as const,
      pagePath: `/${locale}/app/camps/${campSlug}`,
      bodyDraft: t('bodyDraft', { name: campName }),
    };
    window.dispatchEvent(
      new CustomEvent('so-open-feature-request', { detail }),
    );
  };

  return (
    <button
      type="button"
      onClick={onClick}
      data-testid="camp-completeness-limited"
      className="mt-1 inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-900 hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
      aria-label={t('limitedAria', { name: campName })}
    >
      {t('limited')}
    </button>
  );
}
