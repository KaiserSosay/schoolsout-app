'use client';

import { useTranslations } from 'next-intl';
import { CampApplicationForm } from './CampApplicationForm';

const BENEFITS = [
  'featured',
  'profile',
  'dashboard',
  'bookings',
  'boost',
  'commissions',
] as const;

const PERKS = ['1', '2', '3', '4', '5'] as const;

export function ForCampOwners() {
  const t = useTranslations('landing.camps');
  // DECISION: This section is ALWAYS dark (ink-based) regardless of mode.
  // It's the "for camp owners" pitch — a distinct spotlight card — so it
  // reads like a standalone moment instead of a whole section re-painting.

  return (
    <section id="for-camps" className="py-16 md:py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="rounded-3xl p-6 md:p-12 lg:p-16 bg-ink text-white">
          <span className="text-xs font-bold uppercase tracking-[0.22em] text-cta-yellow">
            {t('label')}
          </span>
          <h2 className="editorial-h1 mt-3 text-3xl md:text-5xl text-balance">
            {t('title')}
          </h2>
          <p className="editorial-body mt-4 text-white/70 max-w-2xl">
            {t('subtitle')}
          </p>

          {/* Benefits Grid */}
          <div className="mt-10 grid md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {BENEFITS.map((key) => (
              <div
                key={key}
                className="rounded-2xl p-5 md:p-6 bg-white/5 border border-white/10"
              >
                <div className="text-2xl" aria-hidden="true">
                  {t(`benefits.${key}.emoji`)}
                </div>
                <h3 className="mt-3 font-bold text-lg">{t(`benefits.${key}.title`)}</h3>
                <p className="mt-1 editorial-body text-sm text-white/70">
                  {t(`benefits.${key}.body`)}
                </p>
              </div>
            ))}
          </div>

          {/* Price + form grid */}
          <div className="mt-10 grid lg:grid-cols-5 gap-6">
            {/* Price card — gold */}
            <div className="lg:col-span-2 rounded-3xl p-6 md:p-8 bg-gold text-ink flex flex-col gap-3">
              <div className="flex items-baseline gap-2">
                <span className="editorial-h1 text-6xl md:text-7xl">{t('price.big')}</span>
              </div>
              <p className="editorial-body text-sm md:text-base font-semibold">
                {t('price.per')}
              </p>
              <p className="editorial-body text-xs text-ink/70">{t('price.disclaimer')}</p>
              <ul className="mt-3 flex flex-col gap-2">
                {PERKS.map((n) => (
                  <li key={n} className="flex items-start gap-2 text-sm editorial-body">
                    <span className="mt-0.5 text-ink" aria-hidden="true">
                      ✓
                    </span>
                    <span>{t(`price.perks.${n}`)}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Form card */}
            <div className="lg:col-span-3 rounded-3xl p-6 md:p-8 bg-white/5 border border-white/10">
              <h3 className="editorial-h1 text-xl md:text-2xl">
                {t('form.title')}
              </h3>
              <p className="editorial-body text-sm text-white/70 mt-1">
                {t('form.subtitle')}
              </p>
              <div className="mt-6">
                <CampApplicationForm />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
