'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { useMode } from './ModeProvider';

// DECISION: Categories are the 11 seeded by Subagent A. Multi-select: tapping
// toggles membership in the URL ?categories=csv list. Empty list = no filter.
// Must-have chips live in their own row ABOVE categories so parents who need
// extended-care see the option before scanning activities.
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

export type CategoryKey = (typeof CATEGORY_KEYS)[number];

export const MUST_HAVE_KEYS = ['full_workday', 'before_care', 'after_care'] as const;
export type MustHaveKey = (typeof MUST_HAVE_KEYS)[number];

export function CampFilters({
  active,
  activeMustHave = [],
}: {
  active: string[];
  activeMustHave?: string[];
}) {
  const t = useTranslations('app.camps');
  const router = useRouter();
  const pathname = usePathname() ?? '/';
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const { mode } = useMode();

  const toggle = (cat: string) => {
    const set = new Set(active);
    if (set.has(cat)) set.delete(cat);
    else set.add(cat);

    const params = new URLSearchParams(searchParams?.toString() ?? '');
    if (set.size === 0) {
      params.delete('categories');
    } else {
      params.set('categories', Array.from(set).join(','));
    }
    const qs = params.toString();
    startTransition(() => {
      router.push(qs ? `${pathname}?${qs}` : pathname);
    });
  };

  const toggleMustHave = (key: MustHaveKey) => {
    const set = new Set(activeMustHave);
    if (set.has(key)) set.delete(key);
    else set.add(key);

    const params = new URLSearchParams(searchParams?.toString() ?? '');
    if (set.size === 0) {
      params.delete('must_have');
    } else {
      params.set('must_have', Array.from(set).join(','));
    }
    const qs = params.toString();
    startTransition(() => {
      router.push(qs ? `${pathname}?${qs}` : pathname);
    });
  };

  const activeClsParent = 'bg-brand-purple text-white border-brand-purple';
  const inactiveClsParent =
    'bg-white text-ink border-cream-border hover:border-brand-purple/40';
  const activeClsKid = 'bg-cta-yellow text-purple-deep border-cta-yellow';
  const inactiveClsKid =
    'bg-white/10 text-white border-white/20 hover:border-white/40';

  const activeCls = mode === 'parents' ? activeClsParent : activeClsKid;
  const inactiveCls = mode === 'parents' ? inactiveClsParent : inactiveClsKid;

  const mustHaveEmoji: Record<MustHaveKey, string> = {
    full_workday: '🟢',
    before_care: '✅',
    after_care: '✅',
  };
  const mustHaveLabelKey: Record<MustHaveKey, string> = {
    full_workday: 'mustHave.fullWorkday',
    before_care: 'mustHave.beforeCare',
    after_care: 'mustHave.afterCare',
  };

  return (
    <div className="space-y-3">
      <div
        role="group"
        aria-label={t('mustHave.label')}
        data-testid="camp-must-have-filters"
        className="flex flex-wrap gap-2"
      >
        {MUST_HAVE_KEYS.map((key) => {
          const isActive = activeMustHave.includes(key);
          return (
            <button
              key={key}
              type="button"
              onClick={() => toggleMustHave(key)}
              aria-pressed={isActive}
              data-must-have={key}
              className={
                'inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-bold transition-colors ' +
                (isActive ? activeCls : inactiveCls)
              }
            >
              <span aria-hidden="true">{mustHaveEmoji[key]}</span>
              {t(mustHaveLabelKey[key])}
            </button>
          );
        })}
      </div>
      <div
        role="group"
        aria-label={t('filterLabel')}
        data-testid="camp-filters"
        className="flex flex-wrap gap-2"
      >
        {CATEGORY_KEYS.map((cat) => {
          const isActive = active.includes(cat);
          return (
            <button
              key={cat}
              type="button"
              onClick={() => toggle(cat)}
              aria-pressed={isActive}
              data-category={cat}
              className={
                'inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-bold transition-colors ' +
                (isActive ? activeCls : inactiveCls)
              }
            >
              {t(`categories.${cat}`)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
