import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales, type Locale } from '@/i18n/config';
import { createServerSupabase } from '@/lib/supabase/server';
import { FeatureRequestModal } from '@/components/FeatureRequestModal';
import { Footer } from '@/components/home/Footer';
import '../globals.css';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
});

const SITE_URL = 'https://schoolsout.net';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!locales.includes(locale as Locale)) return {};
  const t = await getTranslations({ locale, namespace: 'landing.meta' });
  const title = t('title');
  const description = t('description');

  const alternates = {
    canonical: `${SITE_URL}/${locale}`,
    languages: {
      en: `${SITE_URL}/en`,
      es: `${SITE_URL}/es`,
    },
  };

  return {
    metadataBase: new URL(SITE_URL),
    title,
    description,
    alternates,
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/${locale}`,
      siteName: "School's Out!",
      locale: locale === 'es' ? 'es_US' : 'en_US',
      type: 'website',
      images: [
        {
          url: '/opengraph-image',
          width: 1200,
          height: 630,
          alt: "School's Out! — Every Miami school closure + camp, one free app",
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/opengraph-image'],
    },
  };
}

function buildJsonLd(locale: string, title: string, description: string) {
  // DECISION: only three entries (SoftwareApplication, Organization, FAQPage).
  // aggregateRating is intentionally OMITTED — we have zero real reviews.
  // featureList reflects Phase 0 reality only.
  const faqPage = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      { q: 'Is School\'s Out! free for parents?', a: 'Yes. Always free for parents. No credit card, no paywall. We may eventually charge camps for Featured placement — never families.' },
      { q: 'How do you pick which camps to list?', a: 'Every camp is manually reviewed. We check the website, confirm the ages and location, and only list operators running real programs in the neighborhoods we cover.' },
      { q: 'Does School\'s Out! take a cut of camp bookings?', a: 'No. We\'re a directory, not a broker. Parents book directly on the camp\'s website. Camp operators keep 100% of every booking.' },
      { q: 'Will my family data be shared?', a: 'No. Kid data stays on your device per our COPPA-aligned design. The only data we store on our server is the email you give us for closure reminders — and you can unsubscribe any time.' },
      { q: 'What if my kid\'s school isn\'t listed?', a: 'Use the city request form. Tell us the city (and your email) and we\'ll email you the moment we add your school or expand coverage.' },
      { q: 'Who built School\'s Out!?', a: 'Noah (age 8) and his dad Rasheid, in Coral Gables. Noah sketched the first version on a napkin during Spring Break 2025 — when every camp was already sold out.' },
    ].map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  };

  const organization = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: "School's Out!",
    url: SITE_URL,
    logo: `${SITE_URL}/opengraph-image`,
    founder: [
      { '@type': 'Person', name: 'Noah Scarlett' },
      { '@type': 'Person', name: 'Rasheid Scarlett' },
    ],
    foundingDate: '2025',
    areaServed: {
      '@type': 'AdministrativeArea',
      name: 'Miami-Dade County, Florida',
    },
    email: 'hello@schoolsout.net',
  };

  const softwareApplication = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: "School's Out!",
    applicationCategory: 'LifestyleApplication',
    operatingSystem: 'Web',
    url: `${SITE_URL}/${locale}`,
    description,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    featureList: [
      'Every Miami school closure calendar',
      'School closure countdowns (2 weeks / 1 week / 3 days)',
      'Camp applications open for Coral Gables operators',
      'Live 16-day weather forecasts via Open-Meteo',
      'Co-parent share links',
      'Multi-locale (English + Spanish)',
    ],
    founder: [
      { '@type': 'Person', name: 'Noah Scarlett' },
      { '@type': 'Person', name: 'Rasheid Scarlett' },
    ],
    foundingDate: '2025',
    areaServed: {
      '@type': 'AdministrativeArea',
      name: 'Miami-Dade County, Florida',
    },
  };

  return [softwareApplication, organization, faqPage];
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
  const t = await getTranslations({ locale, namespace: 'landing.meta' });
  const jsonLd = buildJsonLd(locale, t('title'), t('description'));

  // Probe auth so the global FeatureRequestModal can pre-fill the email
  // field for logged-in users and skip the "email required" gate.
  // DECISION: swallow errors so the outer layout never fails on transient
  // auth issues — the modal just falls back to anon mode.
  let loggedInEmail: string | null = null;
  try {
    const sb = createServerSupabase();
    const {
      data: { user },
    } = await sb.auth.getUser();
    loggedInEmail = user?.email ?? null;
  } catch {
    loggedInEmail = null;
  }

  // DECISION: body background stays cream — Parents mode is the default. The
  // HomeClient re-paints its own wrapper on toggle, but non-landing pages
  // (privacy/terms/reminder confirmation) inherit the cream shell.
  return (
    <html lang={locale} className={jakarta.variable}>
      <head>
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-screen bg-cream text-ink font-display antialiased">
        <NextIntlClientProvider messages={messages}>
          {children}
          <Footer locale={locale} loggedIn={Boolean(loggedInEmail)} />
          <FeatureRequestModal
            presetEmail={loggedInEmail}
            isLoggedIn={Boolean(loggedInEmail)}
          />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
