import type { Metadata } from 'next';

export const SITE_URL = 'https://schoolsout.net';

// Helper that produces metadata with matching en/es alternates.
export function publicPageMetadata({
  locale,
  path,
  title,
  description,
  image,
}: {
  locale: string;
  path: string; // starting with '/', NO locale prefix
  title: string;
  description: string;
  image?: string;
}): Metadata {
  const canonical = `${SITE_URL}/${locale}${path}`;
  return {
    metadataBase: new URL(SITE_URL),
    title,
    description,
    alternates: {
      canonical,
      languages: {
        en: `${SITE_URL}/en${path}`,
        es: `${SITE_URL}/es${path}`,
      },
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: "School's Out!",
      locale: locale === 'es' ? 'es_US' : 'en_US',
      type: 'website',
      images: image ? [{ url: image, width: 1200, height: 630, alt: title }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

type Breadcrumb = { name: string; href: string };

export function breadcrumbListJsonLd(crumbs: Breadcrumb[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: c.href.startsWith('http') ? c.href : `${SITE_URL}${c.href}`,
    })),
  };
}

export function campJsonLd({
  name,
  description,
  url,
  imageUrl,
  address,
  phone,
  websiteUrl,
  priceMinCents,
  priceMaxCents,
  agesMin,
  agesMax,
}: {
  name: string;
  description: string | null;
  url: string;
  imageUrl?: string | null;
  address: string | null;
  phone: string | null;
  websiteUrl: string | null;
  priceMinCents: number | null;
  priceMaxCents: number | null;
  agesMin: number | null;
  agesMax: number | null;
}) {
  const ld: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': ['Camp', 'EducationalOrganization'],
    name,
    url,
  };
  if (description) ld.description = description;
  if (imageUrl) ld.image = imageUrl;
  if (address) {
    // Best-effort parse: "street, city, FL zip"
    const parts = address.split(',').map((s) => s.trim());
    ld.address = {
      '@type': 'PostalAddress',
      streetAddress: parts[0] ?? address,
      addressLocality: parts[1] ?? undefined,
      addressRegion: parts[2]?.split(' ')[0] ?? 'FL',
      postalCode: parts[2]?.split(' ')[1] ?? undefined,
      addressCountry: 'US',
    };
  }
  if (phone) ld.telephone = phone;
  if (websiteUrl) ld.sameAs = [websiteUrl];
  if (priceMinCents != null && priceMaxCents != null) {
    ld.offers = {
      '@type': 'AggregateOffer',
      priceCurrency: 'USD',
      lowPrice: (priceMinCents / 100).toFixed(2),
      highPrice: (priceMaxCents / 100).toFixed(2),
    };
  }
  if (agesMin != null && agesMax != null) {
    ld.typicalAgeRange = `${agesMin}-${agesMax}`;
  }
  return ld;
}

export function closureEventJsonLd({
  name,
  description,
  url,
  startDate,
  endDate,
  schoolName,
  schoolUrl,
}: {
  name: string;
  description: string;
  url: string;
  startDate: string;
  endDate: string;
  schoolName: string | null;
  schoolUrl: string | null;
}) {
  const ld: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name,
    description,
    url,
    startDate,
    endDate,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: {
      '@type': 'Place',
      name: schoolName ?? 'Miami-area schools',
      address: { '@type': 'PostalAddress', addressRegion: 'FL', addressCountry: 'US' },
    },
    organizer: {
      '@type': 'Organization',
      name: schoolName ?? "School's Out!",
      url: schoolUrl ?? SITE_URL,
    },
  };
  return ld;
}

export function schoolJsonLd({
  name,
  url,
  district,
  city,
}: {
  name: string;
  url: string;
  district: string | null;
  city: string | null;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'School',
    name,
    url,
    address: {
      '@type': 'PostalAddress',
      addressLocality: city ?? undefined,
      addressRegion: 'FL',
      addressCountry: 'US',
    },
    parentOrganization: district
      ? { '@type': 'EducationalOrganization', name: district }
      : undefined,
  };
}

export function faqJsonLd(
  items: Array<{ q: string; a: string }>,
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  };
}

// Small server-component helper to render JSON-LD scripts.
export function JsonLdScripts({ items }: { items: Array<Record<string, unknown>> }) {
  return (
    <>
      {items.map((it, i) => (
        <script
          key={i}
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(it) }}
        />
      ))}
    </>
  );
}
