'use client';

import { useTranslations } from 'next-intl';
import { useMode } from './ModeContext';
import { SectionLabel } from './SectionLabel';

export function TwoDoors() {
  const t = useTranslations('landing.doors');
  const { mode, setMode } = useMode();

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
        <p
          className={
            'editorial-body mt-3 max-w-2xl ' +
            (mode === 'parents' ? 'text-muted' : 'text-white/70')
          }
        >
          {t('subtitle')}
        </p>

        <div className="mt-10 grid md:grid-cols-2 gap-4 md:gap-6">
          {/* Parent Mode Card — ink background */}
          <article className="rounded-3xl p-7 md:p-9 bg-ink text-white flex flex-col gap-3 relative overflow-hidden transition-all hover:-translate-y-1">
            <div className="flex items-center gap-2 justify-between">
              <span className="text-[10px] uppercase tracking-[0.22em] font-bold text-white/60">
                {t('parent.tag')}
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold text-white/40">
                {t('urlLabel')}
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-white/10 text-[9px]">
                  {t('soon')}
                </span>
              </span>
            </div>
            <h3 className="editorial-h1 text-2xl md:text-3xl">
              {t('parent.title')}
            </h3>
            <p className="editorial-body text-white/70">{t('parent.body')}</p>
            <button
              type="button"
              onClick={() => setMode('parents')}
              className="mt-4 self-start inline-flex items-center rounded-full bg-gold text-ink font-bold px-5 py-2.5 text-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
            >
              {t('parent.cta')}
            </button>
          </article>

          {/* Kid Mode Card — purple→blue gradient */}
          <article className="rounded-3xl p-7 md:p-9 bg-gradient-to-br from-purple-deep via-purple-mid to-blue-deep text-white flex flex-col gap-3 relative overflow-hidden transition-all hover:-translate-y-1">
            <div className="flex items-center gap-2 justify-between">
              <span className="text-[10px] uppercase tracking-[0.22em] font-bold text-cta-yellow">
                {t('kid.tag')}
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold text-white/40">
                {t('urlLabel')}
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-white/10 text-[9px]">
                  {t('soon')}
                </span>
              </span>
            </div>
            <h3 className="editorial-h1 text-2xl md:text-3xl bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-red-400 to-blue-400 animate-gradient-pan">
              {t('kid.title')}
            </h3>
            <p className="editorial-body text-white/80">{t('kid.body')}</p>
            <button
              type="button"
              onClick={() => setMode('kids')}
              className="mt-4 self-start inline-flex items-center rounded-full bg-cta-yellow text-purple-deep font-bold px-5 py-2.5 text-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
            >
              {t('kid.cta')}
            </button>
          </article>
        </div>
      </div>
    </section>
  );
}
