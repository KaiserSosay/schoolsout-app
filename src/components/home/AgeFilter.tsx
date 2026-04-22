'use client';

import { useTranslations } from 'next-intl';
import type { Mode } from './ModeToggle';

export type AgeRange = 'all' | '4-6' | '7-9';

export function AgeFilter({
  value,
  onChange,
  mode,
}: {
  value: AgeRange;
  onChange: (v: AgeRange) => void;
  mode: Mode;
}) {
  const t = useTranslations('home.ageFilter');

  // DECISION: the spec says both bubbles appear outlined when value is "all",
  // and tapping either one activates that specific range. Tapping an active
  // bubble returns to "all" so the filter is toggleable without a third chip.
  const options: { id: AgeRange; label: string }[] = [
    { id: '4-6', label: t('4-6') },
    { id: '7-9', label: t('7-9') },
  ];

  const chipBase =
    'px-4 py-2 rounded-full text-sm font-semibold transition-all hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-cta-yellow';
  const activeKids = 'bg-cta-yellow text-purple-deep shadow-lg';
  const idleKids = 'bg-white/10 text-white hover:bg-white/20 border border-white/20';
  const activeParents = 'bg-purple-deep text-white shadow';
  const idleParents = 'bg-white text-slate-800 border border-slate-300 hover:bg-slate-50';

  return (
    <div className="flex flex-col items-center gap-3">
      <p
        className={
          'text-sm font-medium ' +
          (mode === 'kids' ? 'text-white/80' : 'text-slate-600')
        }
      >
        {t('label')}
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        {options.map((opt) => {
          const isActive = value === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              aria-pressed={isActive}
              onClick={() => onChange(isActive ? 'all' : opt.id)}
              className={
                chipBase +
                ' ' +
                (mode === 'kids'
                  ? isActive
                    ? activeKids
                    : idleKids
                  : isActive
                  ? activeParents
                  : idleParents)
              }
            >
              {opt.label}
            </button>
          );
        })}
        {value !== 'all' && (
          <button
            type="button"
            onClick={() => onChange('all')}
            className={
              chipBase +
              ' ' +
              (mode === 'kids' ? idleKids : idleParents)
            }
          >
            {t('all')}
          </button>
        )}
      </div>
    </div>
  );
}
