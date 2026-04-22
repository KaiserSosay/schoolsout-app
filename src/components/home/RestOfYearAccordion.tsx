'use client';

import { useTranslations } from 'next-intl';
import type { Closure } from '@/lib/closures';
import { useMode } from './ModeContext';

function formatDateRange(start: string, end: string, locale: string) {
  const s = new Date(start + 'T00:00:00Z');
  const e = new Date(end + 'T00:00:00Z');
  const fmt = new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
  if (start === end) return fmt.format(s);
  return `${fmt.format(s)} – ${fmt.format(e)}`;
}

export function RestOfYearAccordion({
  closures,
  locale,
}: {
  closures: Closure[];
  locale: string;
}) {
  const t = useTranslations('landing.restOfYear');
  const { mode } = useMode();
  if (closures.length === 0) return null;

  return (
    <section className="max-w-6xl mx-auto px-4 pb-4">
      <details
        className={
          'group rounded-2xl p-5 md:p-6 transition-colors ' +
          (mode === 'parents'
            ? 'bg-white border border-cream-border'
            : 'bg-white/10 backdrop-blur border border-white/10')
        }
      >
        <summary
          className={
            'cursor-pointer list-none flex items-center justify-between gap-3 font-bold text-lg ' +
            (mode === 'parents' ? 'text-ink' : 'text-white')
          }
        >
          <span>{t('title')}</span>
          <span
            aria-hidden="true"
            className={
              'transition-transform group-open:rotate-180 ' +
              (mode === 'parents' ? 'text-gold' : 'text-cta-yellow')
            }
          >
            ▾
          </span>
        </summary>
        <ul className="mt-4 divide-y divide-white/10">
          {closures.map((c) => (
            <li
              key={c.id}
              className={
                'flex items-center justify-between gap-3 py-3 ' +
                (mode === 'parents' ? 'border-b border-cream-border last:border-b-0' : '')
              }
            >
              <span className="flex items-center gap-3 text-base min-w-0">
                <span className="text-2xl shrink-0" aria-hidden="true">
                  {c.emoji}
                </span>
                <span
                  className={
                    'font-semibold truncate ' +
                    (mode === 'parents' ? 'text-ink' : 'text-white')
                  }
                >
                  {c.name}
                </span>
              </span>
              <span
                className={
                  'text-sm whitespace-nowrap ' +
                  (mode === 'parents' ? 'text-muted' : 'text-white/70')
                }
              >
                {formatDateRange(c.start_date, c.end_date, locale)}
              </span>
            </li>
          ))}
        </ul>
      </details>
    </section>
  );
}
