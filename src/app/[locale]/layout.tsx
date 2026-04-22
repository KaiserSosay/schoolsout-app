import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales, type Locale } from '@/i18n/config';
import '../globals.css';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
});

export const metadata: Metadata = {
  title: "School's Out!",
  description: 'Never scramble for a plan on school days off again.',
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
  // DECISION: page-level client owns the header, footer, and background so
  // Kids/Parents modes can re-theme every chrome pixel. Body keeps the default
  // kids gradient as a safe fallback for routes that don't render HomeClient
  // (privacy, terms, reminder confirmation pages).
  return (
    <html lang={locale} className={jakarta.variable}>
      <body className="min-h-screen bg-gradient-to-br from-purple-deep via-purple-mid to-blue-deep text-white font-display antialiased">
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
