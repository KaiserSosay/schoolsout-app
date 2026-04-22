'use client';

import { useTranslations } from 'next-intl';

export function FinalCTA() {
  const t = useTranslations('landing.finalCta');
  // DECISION: purple gradient full-width card independent of mode. Always
  // brand-saturated because it's the page's emotional close.

  return (
    <section className="px-4 py-10 md:py-14">
      <div className="max-w-6xl mx-auto rounded-3xl p-8 md:p-14 bg-gradient-to-br from-purple-deep via-purple-mid to-blue-deep text-white text-center relative overflow-hidden">
        <h2 className="editorial-h1 text-3xl md:text-5xl text-balance max-w-3xl mx-auto">
          {t('title')}
        </h2>
        <p className="editorial-body mt-4 text-white/80 max-w-xl mx-auto">{t('body')}</p>

        <div className="mt-8 flex flex-wrap gap-3 justify-center">
          <a
            href="#signup"
            className="rounded-full px-6 py-3 bg-cta-yellow text-purple-deep font-bold transition-all hover:-translate-y-0.5 hover:shadow-lg"
          >
            {t('buttons.parent')}
          </a>
          <a
            href="#for-camps"
            className="rounded-full px-6 py-3 bg-white text-ink font-bold transition-all hover:-translate-y-0.5 hover:shadow-lg"
          >
            {t('buttons.camp')}
          </a>
          <a
            href="#coverage"
            className="rounded-full px-6 py-3 bg-white/10 border border-white/30 text-white font-bold transition-all hover:-translate-y-0.5 hover:shadow-lg"
          >
            {t('buttons.city')}
          </a>
        </div>
      </div>
    </section>
  );
}
