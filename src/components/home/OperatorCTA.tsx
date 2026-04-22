'use client';

import { useTranslations } from 'next-intl';
import type { Mode } from './ModeToggle';

export function OperatorCTA({ mode }: { mode: Mode }) {
  const t = useTranslations('home.operatorCTA');
  // DECISION: mailto for Phase 0 — Rasheid personally responds to early camp
  // operator inquiries per the cold-start plan. Form/portal is Phase 2.
  const mailto =
    'mailto:hello@schoolsout.net?subject=Camp%20Listing%20Inquiry';

  return (
    <section id="operator-cta" className="mt-10">
      <div
        className={
          'rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6 ' +
          (mode === 'kids'
            ? 'bg-gradient-to-br from-cta-yellow/20 via-purple-mid/40 to-blue-deep/30 border border-cta-yellow/30'
            : 'bg-gradient-to-br from-amber-50 to-white border border-amber-200')
        }
      >
        <div className="text-5xl" aria-hidden="true">
          🎟️
        </div>
        <div className="flex-1">
          <h3
            className={
              'text-xl md:text-2xl font-bold mb-1 ' +
              (mode === 'kids' ? 'text-white' : 'text-slate-900')
            }
          >
            {t('title')}
          </h3>
          <p
            className={
              'text-sm md:text-base ' +
              (mode === 'kids' ? 'text-white/80' : 'text-slate-700')
            }
          >
            {t('body')}
          </p>
        </div>
        <a
          href={mailto}
          className="inline-flex items-center whitespace-nowrap rounded-2xl bg-cta-yellow text-purple-deep font-bold px-5 py-3 transition-all hover:-translate-y-0.5 hover:shadow-lg"
        >
          {t('button')}
        </a>
      </div>
    </section>
  );
}
