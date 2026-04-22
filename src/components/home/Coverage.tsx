'use client';

import { useTranslations } from 'next-intl';
import { useMode } from './ModeContext';
import { SectionLabel } from './SectionLabel';
import { CityRequestForm } from './CityRequestForm';

const PHASES = ['1', '2', '3', '4'] as const;

export function Coverage() {
  const t = useTranslations('landing.coverage');
  const { mode } = useMode();

  return (
    <section id="coverage" className="py-16 md:py-20 px-4">
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

        <div className="mt-8 flex flex-wrap gap-2">
          {PHASES.map((p) => (
            <span
              key={p}
              className={
                'inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ' +
                (mode === 'parents'
                  ? p === '1'
                    ? 'bg-success/15 text-success border border-success/30'
                    : 'bg-white border border-cream-border text-ink'
                  : p === '1'
                    ? 'bg-success/20 text-success border border-success/40'
                    : 'bg-white/10 border border-white/15 text-white')
              }
            >
              <span aria-hidden="true">{t(`phases.${p}.emoji`)}</span>
              <span>{t(`phases.${p}.label`)}</span>
            </span>
          ))}
        </div>

        <div
          className={
            'mt-10 rounded-3xl p-6 md:p-10 ' +
            (mode === 'parents'
              ? 'bg-white border border-cream-border'
              : 'bg-white/10 backdrop-blur border border-white/10')
          }
        >
          <h3
            className={
              'editorial-h1 text-2xl md:text-3xl ' +
              (mode === 'parents' ? 'text-ink' : 'text-white')
            }
          >
            {t('request.title')}
          </h3>
          <p
            className={
              'editorial-body mt-2 ' +
              (mode === 'parents' ? 'text-muted' : 'text-white/70')
            }
          >
            {t('request.subtitle')}
          </p>
          <div className="mt-6">
            <CityRequestForm />
          </div>
        </div>
      </div>
    </section>
  );
}
