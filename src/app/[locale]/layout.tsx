import type { Metadata } from 'next';
import Link from 'next/link';
import { Plus_Jakarta_Sans } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales, type Locale } from '@/i18n/config';
import { LanguageToggle } from '@/components/LanguageToggle';
import '../globals.css';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
});

export const metadata: Metadata = {
  title: "School's Out",
  description: 'Never miss another school closure.',
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!locales.includes(locale as Locale)) notFound();
  const messages = await getMessages();
  const t = await getTranslations();
  return (
    <html lang={locale} className={jakarta.variable}>
      <body className="min-h-screen bg-gradient-to-br from-purple-deep via-purple-mid to-blue-deep text-white font-display">
        <NextIntlClientProvider messages={messages}>
          <header className="flex items-center justify-between p-4">
            <span className="text-lg font-bold">School&apos;s Out! 🎒</span>
            <LanguageToggle currentLocale={locale as Locale} />
          </header>
          {children}
          <footer className="text-center text-xs text-white/50 py-6">
            <Link href={`/${locale}/privacy`} className="underline">{t('nav.privacyPolicy')}</Link>
            {' · '}
            <Link href={`/${locale}/terms`} className="underline">{t('nav.terms')}</Link>
          </footer>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
