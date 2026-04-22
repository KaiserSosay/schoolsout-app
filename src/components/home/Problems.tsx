'use client';

import { useTranslations } from 'next-intl';
import { useMode } from './ModeContext';
import { SectionLabel } from './SectionLabel';

const KEYS = ['panic', 'twoKids', 'soldOut', 'teacherDay'] as const;

export function Problems() {
  const t = useTranslations('landing.problems');
  const { mode } = useMode();

  return (
    <section className="py-16 md:py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <SectionLabel>{t('label')}</SectionLabel>
        <h2
          className={
            'editorial-h1 mt-3 text-3xl md:text-5xl max-w-3xl text-balance ' +
            (mode === 'parents' ? 'text-ink' : 'text-white')
          }
        >
          {t('title')}
        </h2>

        <div className="mt-10 grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {KEYS.map((key) => (
            <article
              key={key}
              className={
                'rounded-2xl p-5 md:p-6 transition-all hover:-translate-y-1 ' +
                (mode === 'parents'
                  ? 'bg-white border border-cream-border'
                  : 'bg-white/10 backdrop-blur border border-white/10')
              }
            >
              <div className="text-3xl md:text-4xl" aria-hidden="true">
                {t(`items.${key}.emoji`)}
              </div>
              <h3
                className={
                  'mt-3 font-bold text-base md:text-lg ' +
                  (mode === 'parents' ? 'text-ink' : 'text-white')
                }
              >
                {t(`items.${key}.title`)}
              </h3>
              <p
                className={
                  'mt-1 editorial-body text-sm ' +
                  (mode === 'parents' ? 'text-muted' : 'text-white/70')
                }
              >
                {t(`items.${key}.body`)}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
