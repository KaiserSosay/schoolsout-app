'use client';

import Link from 'next/link';
import { useState, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';

// Site-wide footer. Mounted once in src/app/[locale]/layout.tsx so every
// public page, landing page, and /app page shows a consistent set of
// discovery links. Desktop: 4-column grid. Mobile: accordion.
//
// "Got an idea?" dispatches the same so-open-feature-request CustomEvent
// the rest of the app uses — FeatureRequestModal is mounted globally in
// the root layout and listens for that event.
export function Footer({
  locale,
  loggedIn = false,
}: {
  locale: string;
  loggedIn?: boolean;
}) {
  const t = useTranslations('footer');
  const [openKey, setOpenKey] = useState<string | null>(null);

  const openIdea = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('so-open-feature-request'));
    }
  };

  type LinkItem =
    | { label: string; href: string; onClick?: undefined }
    | { label: string; href?: undefined; onClick: () => void };

  const cols: Array<{ key: string; title: string; links: LinkItem[] }> = [
    {
      key: 'explore',
      title: t('columns.explore.title'),
      links: [
        { label: t('columns.explore.camps'), href: `/${locale}/camps` },
        { label: t('columns.explore.breaks'), href: `/${locale}/breaks` },
        { label: t('columns.explore.cities'), href: `/${locale}/cities` },
        { label: t('columns.explore.verify'), href: `/${locale}/how-we-verify` },
      ],
    },
    {
      key: 'camps',
      title: t('columns.camps.title'),
      links: [
        { label: t('columns.camps.list'), href: `/${locale}/list-your-camp` },
        { label: t('columns.camps.whyList'), href: `/${locale}/list-your-camp#why` },
      ],
    },
    {
      key: 'parents',
      title: t('columns.parents.title'),
      links: [
        { label: t('columns.parents.reminders'), href: `/${locale}` },
        { label: t('columns.parents.howItWorks'), href: `/${locale}/how-it-works` },
        {
          label: t('columns.parents.plan'),
          href: loggedIn ? `/${locale}/app/plan-ahead` : `/${locale}`,
        },
      ],
    },
    {
      key: 'about',
      title: t('columns.about.title'),
      links: [
        { label: t('columns.about.aboutNoah'), href: `/${locale}/about` },
        { label: t('columns.about.idea'), onClick: openIdea },
        { label: t('columns.about.privacy'), href: `/${locale}/privacy` },
        { label: t('columns.about.terms'), href: `/${locale}/terms` },
      ],
    },
  ];

  const renderLink = (l: LinkItem): ReactNode => {
    const cls = 'text-ink/70 hover:text-ink transition-colors inline-block min-h-11 md:min-h-0 py-1';
    if (l.href) {
      return (
        <Link href={l.href} className={cls}>
          {l.label}
        </Link>
      );
    }
    return (
      <button type="button" onClick={l.onClick} className={cls + ' text-left'}>
        {l.label}
      </button>
    );
  };

  return (
    <footer className="border-t border-cream-border bg-cream text-ink/70 px-4 pt-10 pb-8">
      <div className="max-w-6xl mx-auto">
        {/* Desktop: 4-column grid */}
        <div className="hidden md:grid grid-cols-4 gap-8">
          {cols.map((col) => (
            <div key={col.key}>
              <h3 className="text-sm font-semibold text-ink mb-3">{col.title}</h3>
              <ul className="space-y-1.5 text-sm">
                {col.links.map((l) => (
                  <li key={l.label}>{renderLink(l)}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Mobile: accordion */}
        <div className="md:hidden divide-y divide-cream-border">
          {cols.map((col) => {
            const isOpen = openKey === col.key;
            return (
              <div key={col.key}>
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={`footer-col-${col.key}`}
                  onClick={() => setOpenKey(isOpen ? null : col.key)}
                  className="w-full flex items-center justify-between py-4 text-sm font-semibold text-ink min-h-11"
                >
                  <span>{col.title}</span>
                  <span aria-hidden="true" className="text-ink/50 text-lg leading-none">
                    {isOpen ? '−' : '+'}
                  </span>
                </button>
                <div
                  id={`footer-col-${col.key}`}
                  className={
                    'overflow-hidden transition-[max-height,padding] duration-200 ease-out ' +
                    (isOpen ? 'max-h-96 pb-4' : 'max-h-0')
                  }
                >
                  <ul className="space-y-1 text-sm">
                    {col.links.map((l) => (
                      <li key={l.label}>{renderLink(l)}</li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom strip */}
        <div className="mt-8 pt-6 border-t border-cream-border flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-xs text-ink/60">
          <p>{t('bottom.copyright')}</p>
          <div className="flex items-center gap-4">
            <Link
              href={`/${locale === 'en' ? 'es' : 'en'}`}
              className="hover:text-ink transition-colors"
            >
              {(locale === 'en' ? 'es' : 'en').toUpperCase()}
            </Link>
            <a
              href="https://BeSoGood.org"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-ink transition-colors italic"
            >
              {t('bottom.motto')}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
