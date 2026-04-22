'use client';

import { useTranslations } from 'next-intl';
import { useMode } from './ModeContext';
import { SectionLabel } from './SectionLabel';

const ITEMS = ['1', '2', '3', '4', '5', '6'] as const;

export function FAQ() {
  const t = useTranslations('landing.faq');
  const { mode } = useMode();

  return (
    <section className="py-16 md:py-20 px-4">
      <div className="max-w-3xl mx-auto">
        <SectionLabel>{t('label')}</SectionLabel>
        <h2
          className={
            'editorial-h1 mt-3 text-3xl md:text-5xl text-balance ' +
            (mode === 'parents' ? 'text-ink' : 'text-white')
          }
        >
          {t('title')}
        </h2>

        <div className="mt-10 flex flex-col gap-3">
          {ITEMS.map((n) => (
            <details
              key={n}
              className={
                'group rounded-2xl p-5 md:p-6 transition-colors ' +
                (mode === 'parents'
                  ? 'bg-white border border-cream-border'
                  : 'bg-white/10 backdrop-blur border border-white/10')
              }
            >
              <summary
                className={
                  'cursor-pointer list-none flex items-start justify-between gap-3 font-bold text-base md:text-lg ' +
                  (mode === 'parents' ? 'text-ink' : 'text-white')
                }
              >
                <span>{t(`items.${n}.q`)}</span>
                <span
                  aria-hidden="true"
                  className={
                    'shrink-0 transition-transform group-open:rotate-180 ' +
                    (mode === 'parents' ? 'text-gold' : 'text-cta-yellow')
                  }
                >
                  ▾
                </span>
              </summary>
              <p
                className={
                  'mt-3 editorial-body ' +
                  (mode === 'parents' ? 'text-muted' : 'text-white/75')
                }
              >
                {t(`items.${n}.a`)}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
