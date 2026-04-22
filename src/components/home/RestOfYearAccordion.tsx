'use client';

import { useTranslations } from 'next-intl';
import type { Closure } from '@/lib/closures';
import type { Mode } from './ModeToggle';

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
  mode,
  locale,
}: {
  closures: Closure[];
  mode: Mode;
  locale: string;
}) {
  const t = useTranslations('home');
  if (closures.length === 0) return null;
  return (
    <section className="mt-8">
      <details
        className={
          'group rounded-2xl p-5 transition-colors ' +
          (mode === 'kids'
            ? 'bg-white/10 backdrop-blur'
            : 'bg-white border border-slate-200')
        }
      >
        <summary
          className={
            'cursor-pointer font-bold text-lg list-none flex items-center justify-between ' +
            (mode === 'kids' ? 'text-white' : 'text-slate-900')
          }
        >
          <span>{t('restOfYear')}</span>
          <span
            aria-hidden="true"
            className="transition-transform group-open:rotate-180"
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
                (mode === 'kids' ? '' : 'border-b border-slate-100 last:border-b-0')
              }
            >
              <span className="flex items-center gap-3 text-base">
                <span className="text-2xl" aria-hidden="true">
                  {c.emoji}
                </span>
                <span
                  className={
                    'font-semibold ' +
                    (mode === 'kids' ? 'text-white' : 'text-slate-900')
                  }
                >
                  {c.name}
                </span>
              </span>
              <span
                className={
                  'text-sm ' +
                  (mode === 'kids' ? 'text-white/70' : 'text-slate-600')
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
