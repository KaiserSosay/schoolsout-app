'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useMode } from './ModeContext';

export function Footer({ locale }: { locale: string }) {
  const t = useTranslations('landing.footer');
  const tFb = useTranslations('feedback');
  const { mode } = useMode();

  const openIdea = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('so-open-feature-request'));
    }
  };

  const text = mode === 'parents' ? 'text-muted' : 'text-white/60';
  const link =
    mode === 'parents'
      ? 'text-ink/70 hover:text-ink'
      : 'text-white/80 hover:text-white';
  const border = mode === 'parents' ? 'border-cream-border' : 'border-white/10';

  return (
    <footer className={'px-4 pt-10 pb-12 border-t ' + border + ' ' + text}>
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <Link
          href={`/${locale}`}
          className={
            'editorial-h1 text-xl ' +
            (mode === 'parents' ? 'text-ink' : 'text-white')
          }
        >
          School&apos;s Out<span className="text-gold">!</span>
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link className={link} href={`/${locale}/about`}>
            {t('nav.about')}
          </Link>
          <span aria-hidden="true" className="opacity-40">
            ·
          </span>
          <Link className={link} href={`/${locale}/privacy`}>
            {t('nav.privacy')}
          </Link>
          <span aria-hidden="true" className="opacity-40">
            ·
          </span>
          <Link className={link} href={`/${locale}/terms`}>
            {t('nav.terms')}
          </Link>
          <span aria-hidden="true" className="opacity-40">
            ·
          </span>
          <button type="button" onClick={openIdea} className={link + ' min-h-11'}>
            {tFb('trigger')}
          </button>
          <span aria-hidden="true" className="opacity-40">
            ·
          </span>
          <Link className={link} href={`/${locale === 'en' ? 'es' : 'en'}`}>
            {(locale === 'en' ? 'es' : 'en').toUpperCase()}
          </Link>
          <span aria-hidden="true" className="opacity-40">
            ·
          </span>
          <a className={link} href="mailto:hello@schoolsout.net">
            {t('nav.contact')}
          </a>
        </nav>
      </div>
      <div className="max-w-6xl mx-auto mt-6 text-sm flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <p>{t('credit')}</p>
        <p className="text-xs opacity-80">
          {t('domain')} · {t('copyright')}
        </p>
      </div>
    </footer>
  );
}
