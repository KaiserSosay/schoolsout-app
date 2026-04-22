'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import type { Mode } from './ModeToggle';

export function Footer({ mode, locale }: { mode: Mode; locale: string }) {
  const t = useTranslations();
  const text = mode === 'kids' ? 'text-white/60' : 'text-slate-500';
  const link = mode === 'kids' ? 'text-white/80 hover:text-white' : 'text-slate-700 hover:text-slate-900';
  return (
    <footer className={'mt-14 pb-10 pt-6 text-center text-sm ' + text}>
      <nav className="flex items-center justify-center gap-3">
        <Link className={'underline ' + link} href={`/${locale}/privacy`}>
          {t('nav.privacyPolicy')}
        </Link>
        <span aria-hidden="true">·</span>
        <Link className={'underline ' + link} href={`/${locale}/terms`}>
          {t('nav.terms')}
        </Link>
      </nav>
      <p className="mt-3">{t('home.footer.credit')}</p>
      <p className={'mt-1 text-xs ' + text}>schoolsout.net</p>
    </footer>
  );
}
