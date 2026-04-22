'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useMode } from './ModeContext';
import { HeroSignupForm } from './HeroSignupForm';

export function Hero({
  schoolId,
  locale,
}: {
  schoolId: string;
  locale: string;
}) {
  const t = useTranslations('landing.hero');
  const { mode } = useMode();
  const wordmarkRef = useRef<HTMLHeadingElement>(null);
  const firstMount = useRef(true);

  // DECISION: Apply a one-shot wordmark "bump" animation whenever mode flips,
  // but NOT on first mount — a fresh visit shouldn't re-animate anything the
  // user didn't trigger. Reduced-motion users skip entirely.
  useEffect(() => {
    if (firstMount.current) {
      firstMount.current = false;
      return;
    }
    const el = wordmarkRef.current;
    if (!el) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;
    el.classList.remove('animate-wordmark-bump');
    void el.offsetWidth;
    el.classList.add('animate-wordmark-bump');
  }, [mode]);

  const badgeParents =
    'inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold bg-purple-soft text-brand-purple hover:bg-brand-purple/20 transition';
  const badgeKids =
    'inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold bg-white/10 border border-white/10 text-white/90 hover:bg-white/20 transition';

  return (
    <section className="pt-12 md:pt-16 pb-8 md:pb-10">
      <div className="max-w-3xl mx-auto text-center px-4">
        <Link
          href={`/${locale}/about/noah`}
          className={'animate-fade-up ' + (mode === 'parents' ? badgeParents : badgeKids)}
        >
          {t('badge')}
        </Link>

        <h1
          ref={wordmarkRef}
          className={
            'editorial-h1 mt-6 text-5xl sm:text-6xl md:text-7xl lg:text-[5.25rem] text-balance animate-fade-up [animation-delay:100ms] ' +
            (mode === 'parents' ? 'text-ink' : 'text-white')
          }
        >
          <span className="block">{t('titleLine1')}</span>{' '}
          {mode === 'parents' ? (
            <span className="inline-block bg-gold text-ink px-3 md:px-4 rounded-2xl leading-[1.15] mt-1 md:mt-2">
              {t('titleLine2')}
            </span>
          ) : (
            <span className="block bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-red-400 to-blue-400 animate-gradient-pan mt-1 md:mt-2">
              {t('titleLine2')}
            </span>
          )}
        </h1>

        <p
          className={
            'editorial-body mt-6 text-lg md:text-xl max-w-2xl mx-auto animate-fade-up [animation-delay:200ms] ' +
            (mode === 'parents' ? 'text-muted' : 'text-white/80')
          }
        >
          {t('subtitle')}
        </p>

        <HeroSignupForm schoolId={schoolId} locale={locale} />
      </div>
    </section>
  );
}
