'use client';

import { useTranslations } from 'next-intl';
import { useMode } from './ModeContext';
import { SectionLabel } from './SectionLabel';

const KEYS = ['schools', 'countdowns', 'camps', 'weather', 'ai', 'export'] as const;
const BADGED = new Set(['camps', 'ai', 'export']);

export function Features() {
  const t = useTranslations('landing.features');
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

        <div className="mt-10 grid md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {KEYS.map((key) => {
            const showBadge = BADGED.has(key);
            let badgeText: string | null = null;
            if (showBadge) {
              try {
                badgeText = t(`items.${key}.badge`);
              } catch {
                badgeText = null;
              }
            }
            return (
              <article
                key={key}
                className={
                  'rounded-2xl p-6 transition-all hover:-translate-y-1 ' +
                  (mode === 'parents'
                    ? 'bg-white border border-cream-border'
                    : 'bg-white/10 backdrop-blur border border-white/10')
                }
              >
                <div className="text-3xl" aria-hidden="true">
                  {t(`items.${key}.emoji`)}
                </div>
                <div className="mt-3 flex items-center gap-2 flex-wrap">
                  <h3
                    className={
                      'font-bold text-lg ' +
                      (mode === 'parents' ? 'text-ink' : 'text-white')
                    }
                  >
                    {t(`items.${key}.title`)}
                  </h3>
                  {badgeText && (
                    <span
                      className={
                        'text-[10px] uppercase tracking-wide font-bold px-2 py-0.5 rounded-full ' +
                        (mode === 'parents'
                          ? key === 'camps'
                            ? 'bg-success/15 text-success'
                            : 'bg-gold/25 text-ink'
                          : 'bg-white/20 text-white')
                      }
                    >
                      {badgeText}
                    </span>
                  )}
                </div>
                <p
                  className={
                    'mt-2 editorial-body text-sm ' +
                    (mode === 'parents' ? 'text-muted' : 'text-white/70')
                  }
                >
                  {t(`items.${key}.body`)}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
