'use client';

import { useTranslations } from 'next-intl';
import { daysUntil } from '@/lib/countdown';
import type { Closure } from '@/lib/closures';
import type { Mode } from './ModeToggle';

export function NextClosureHighlight({
  closure,
  mode,
}: {
  closure: Closure;
  mode: Mode;
}) {
  const t = useTranslations('home.hero');
  const days = daysUntil(closure.start_date);
  const key =
    days <= 0 ? 'nextClosureToday' : days === 1 ? 'nextClosureTomorrow' : 'nextClosureBadge';
  const label = t(key, { name: closure.name, days });

  return (
    <span
      className={
        'inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ' +
        (mode === 'kids'
          ? 'bg-cta-yellow/20 text-cta-yellow border border-cta-yellow/40'
          : 'bg-amber-100 text-amber-900 border border-amber-200')
      }
    >
      <span aria-hidden="true">{closure.emoji}</span>
      <span>{label}</span>
    </span>
  );
}
