import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import { createServiceSupabase } from '@/lib/supabase/service';
import { PublicTopBar } from '@/components/public/PublicTopBar';
import { HelpVerifyCalendarCta } from '@/components/public/HelpVerifyCalendarCta';
import { UnverifiedSchoolCalendarPlaceholder } from '@/components/public/UnverifiedSchoolCalendarPlaceholder';
import { SchoolCalendarSections } from '@/components/schools/SchoolCalendarSections';
import {
  publicPageMetadata,
  breadcrumbListJsonLd,
  schoolJsonLd,
  faqJsonLd,
  JsonLdScripts,
  SITE_URL,
} from '@/lib/seo';
import { deriveSchoolFraming } from '@/lib/schools/calendar-status';
import { yearsLabelForClosures } from '@/lib/schools/calendar-years';

export const dynamic = 'force-dynamic';

type SchoolRow = {
  id: string;
  slug: string;
  name: string;
  district: string | null;
  city: string | null;
  state: string | null;
  address: string | null;
  phone: string | null;
  website: string | null;
  calendar_status: string | null;
  // migration-022 columns — may be missing on un-migrated DBs; the page
  // copes by branching on null.
  is_mdcps: boolean | null;
  follows_district_pattern: boolean | null;
  unofficial_disclaimer_dismissed_at: string | null;
};

type ClosureRow = {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  emoji: string;
  status: string;
  source: string;
  category: string | null;
  school_year: string | null;
};

const RICH_SELECT =
  'id, slug, name, district, city, state, address, phone, website, calendar_status, is_mdcps, follows_district_pattern, unofficial_disclaimer_dismissed_at';
const LEAN_SELECT =
  'id, slug, name, district, city, state, address, phone, website, calendar_status';

async function loadSchool(slug: string): Promise<SchoolRow | null> {
  const svc = createServiceSupabase();
  const rich = await svc.from('schools').select(RICH_SELECT).eq('slug', slug).maybeSingle();
  if (rich.error) {
    const lean = await svc.from('schools').select(LEAN_SELECT).eq('slug', slug).maybeSingle();
    if (!lean.data) return null;
    return {
      ...(lean.data as Omit<SchoolRow, 'is_mdcps' | 'follows_district_pattern' | 'unofficial_disclaimer_dismissed_at'>),
      is_mdcps: null,
      follows_district_pattern: null,
      unofficial_disclaimer_dismissed_at: null,
    };
  }
  return (rich.data as SchoolRow) ?? null;
}

function formatDate(iso: string, locale: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString(
    locale === 'es' ? 'es-US' : 'en-US',
    { weekday: 'short', month: 'short', day: 'numeric' },
  );
}

function formatDateRange(start: string, end: string, locale: string): string {
  if (start === end) return formatDate(start, locale);
  return `${formatDate(start, locale)} — ${formatDate(end, locale)}`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: 'public.school' });
  const school = await loadSchool(slug);
  if (!school) {
    return publicPageMetadata({
      locale,
      path: `/schools/${slug}`,
      title: "School | School's Out!",
      description: '',
    });
  }
  // Pull just the school_year column so the meta title can name the
  // actual academic-year span the school has closures for, not a
  // hardcoded calendar year that drifts every August. The closure
  // count also drives the empty-calendar gate inside deriveSchoolFraming
  // (mom-test 2026-04-26: trust-signal without data is misleading).
  const today = new Date().toISOString().slice(0, 10);
  const { data: yearRows } = await createServiceSupabase()
    .from('closures')
    .select('school_year')
    .eq('school_id', school.id)
    .gte('end_date', today);
  const closureRows = (yearRows ?? []) as Array<{ school_year: string | null }>;
  const framing = deriveSchoolFraming(school, closureRows.length);
  const yearsLabel = yearsLabelForClosures(closureRows);
  const description = framing.isVerified
    ? `Upcoming school breaks and holiday calendar for ${school.name} (${[school.district, school.city]
        .filter(Boolean)
        .join(', ')}). Verified by School's Out!`
    : t('unofficialFrame.metaDescription', {
        name: school.name,
        neighborhood: school.city ?? 'Miami-Dade',
      });
  const title = framing.isVerified
    ? `${school.name} calendar${yearsLabel ? ` ${yearsLabel}` : ''} — Miami school breaks | School's Out!`
    : t('unofficialFrame.title', { name: school.name });
  return publicPageMetadata({
    locale,
    path: `/schools/${slug}`,
    title,
    description,
  });
}

function buildFaq(
  school: SchoolRow,
  closures: ClosureRow[],
  t: Awaited<ReturnType<typeof getTranslations>>,
  isVerified: boolean,
): Array<{ q: string; a: string }> {
  // 1. Spring break
  const spring = closures.find(
    (c) =>
      /spring/i.test(c.name) ||
      (c.category && /spring/i.test(c.category)),
  );
  const springQ = t('faq.springBreakQ', { name: school.name });
  let springA: string;
  if (spring && isVerified) {
    springA = t('faq.springBreakAVerified', {
      name: school.name,
      date: formatDateRange(spring.start_date, spring.end_date, 'en'),
    });
  } else if (spring) {
    springA = t('faq.springBreakAUnverifiedKnown', {
      name: school.name,
      date: formatDateRange(spring.start_date, spring.end_date, 'en'),
    });
  } else {
    springA = t('faq.springBreakAUnverifiedNone', { name: school.name });
  }

  // 2. Next major holiday — first non-spring closure that's at least a
  // single day off.
  const holiday = closures.find((c) => c !== spring);
  const holidayQ = holiday
    ? t('faq.nextHolidayQ', { name: school.name, holiday: holiday.name })
    : t('faq.nextHolidayQ', { name: school.name, holiday: 'the next holiday' });
  const holidayA = holiday
    ? t('faq.nextHolidayAYes', {
        name: school.name,
        holiday: holiday.name,
        date: formatDateRange(holiday.start_date, holiday.end_date, 'en'),
      })
    : t('faq.nextHolidayANone', { name: school.name });

  // 3. Full calendar link
  const fullQ = t('faq.fullCalendarQ', { name: school.name });
  const calLink = school.website;
  const fullA = calLink
    ? t('faq.fullCalendarAWithLink', { name: school.name, url: calLink })
    : t('faq.fullCalendarANoLink', { name: school.name });

  return [
    { q: springQ, a: springA },
    { q: holidayQ, a: holidayA },
    { q: fullQ, a: fullA },
  ];
}

export default async function PublicSchoolPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: 'public.school' });
  const tBreaks = await getTranslations({ locale, namespace: 'public.breaks' });

  const school = await loadSchool(slug);
  if (!school) notFound();

  const today = new Date().toISOString().slice(0, 10);
  // Pull the last ~13 months of closures alongside upcoming ones so the
  // "show past breaks" toggle has something to reveal when a parent
  // wants to scroll back to remember when MLK fell. Bounds the fetch
  // size — we don't need 5 years of historical breaks on every render.
  const oneYearAgo = (() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 13);
    return d.toISOString().slice(0, 10);
  })();
  const svc = createServiceSupabase();
  const { data: closuresData } = await svc
    .from('closures')
    .select('id, name, start_date, end_date, emoji, status, source, category, school_year')
    .eq('school_id', school.id)
    .gte('end_date', oneYearAgo)
    .order('start_date')
    .limit(80);
  const closures = (closuresData ?? []) as ClosureRow[];
  void tBreaks; // currently unused — kept ready for the district-fan-out section

  // Closure-count gate: a school renders as "verified" ONLY when it has
  // closure data on file. The trust-signal-without-data case (Academir
  // Charter School East showing "✓ Verified by M-DCPS" with empty list)
  // was the mom-test failure on 2026-04-26.
  const framing = deriveSchoolFraming(school, closures.length);

  const ldItems = [
    schoolJsonLd({
      name: school.name,
      url: `${SITE_URL}/${locale}/schools/${school.slug}`,
      district: school.district,
      city: school.city,
      streetAddress: school.address,
      telephone: school.phone,
      websiteUrl: school.website,
    }),
    faqJsonLd(buildFaq(school, closures, t, framing.isVerified)),
    breadcrumbListJsonLd([
      { name: 'Home', href: `/${locale}` },
      { name: 'Schools', href: `/${locale}/schools` },
      { name: school.name, href: `/${locale}/schools/${school.slug}` },
    ]),
  ];

  // DECISION (Phase 3.0 / Item 1.4): stacked header. Small eyebrow
  // ("The unofficial" / "Official 2025–2026 calendar from M-DCPS") sits
  // above the big title. Verified non-MDCPS schools use a generic
  // "Official 2025–2026 calendar" eyebrow over the school name.
  const yearsLabel = yearsLabelForClosures(closures);
  const eyebrow = framing.isVerified
    ? framing.reason === 'mdcps'
      ? yearsLabel
        ? t('verifiedFrame.eyebrowMdcpsWithYears', { years: yearsLabel })
        : t('verifiedFrame.eyebrowMdcps')
      : yearsLabel
        ? t('verifiedFrame.eyebrowWithYears', { years: yearsLabel })
        : t('verifiedFrame.eyebrow')
    : t('unofficialFrame.eyebrow');
  const titleMain = framing.isVerified
    ? school.name
    : yearsLabel
      ? t('unofficialFrame.titleMainWithYears', { name: school.name, years: yearsLabel })
      : t('unofficialFrame.titleMain', { name: school.name });

  const showDistrictBanner =
    !framing.isVerified && school.follows_district_pattern === true;

  return (
    <>
      <JsonLdScripts items={ldItems} />
      <PublicTopBar locale={locale} />
      <main
        data-testid={framing.isVerified ? 'school-verified' : 'school-unofficial'}
        className="mx-auto max-w-3xl px-4 py-8 md:px-6 md:py-12"
      >
        <header className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted">
            {eyebrow}
          </p>
          <h1
            className="mt-1 text-3xl font-black text-ink md:text-4xl"
            style={{ letterSpacing: '-0.02em' }}
          >
            {titleMain}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {[school.district, school.city, school.state].filter(Boolean).join(' · ')}
          </p>
          {framing.isVerified ? (
            <p
              data-testid="verified-badge"
              className="mt-3 inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-900"
            >
              {framing.reason === 'mdcps'
                ? t('verifiedFrame.mdcpsBadge')
                : t('verifiedFrame.badge')}
            </p>
          ) : (
            <p className="mt-3 text-sm text-ink/80">
              {t('unofficialFrame.subhead', { name: school.name })}
            </p>
          )}
        </header>

        {!framing.isVerified && closures.length === 0 ? (
          <UnverifiedSchoolCalendarPlaceholder
            locale={locale}
            schoolName={school.name}
            schoolSlug={school.slug}
            schoolId={school.id}
            phone={school.phone}
          />
        ) : null}

        {!framing.isVerified && closures.length > 0 ? (
          <section
            data-testid="confirmed-dates"
            className="mb-6 rounded-3xl border border-cream-border bg-white p-5 md:p-6"
          >
            <h2 className="mb-3 text-base font-black text-ink md:text-lg">
              {t('unofficialFrame.confirmedTitle')}
            </h2>
            <SchoolCalendarSections
              locale={locale}
              closures={closures}
              today={today}
              schoolName={school.name}
              schoolSlug={school.slug}
              schoolYearLabel={yearsLabel}
              variant="unofficial"
            />
          </section>
        ) : null}

        {showDistrictBanner ? (
          <aside
            data-testid="district-banner"
            className="mb-6 rounded-3xl border-2 border-amber-300 bg-amber-50 p-5 md:p-6"
          >
            <p className="text-sm font-black text-amber-900">
              {t('unofficialFrame.districtBannerTitle')}
            </p>
            <p className="mt-1 text-sm text-amber-900/85">
              {t('unofficialFrame.districtBannerBody', { name: school.name })}
            </p>
          </aside>
        ) : null}

        {framing.isVerified ? (
          <>
            <h2 className="mb-3 text-sm font-black text-ink">{t('closures')}</h2>
            {closures.length === 0 ? (
              <p className="rounded-2xl border border-cream-border bg-white p-6 text-center text-sm text-muted">
                {t('empty')}
              </p>
            ) : (
              <SchoolCalendarSections
                locale={locale}
                closures={closures}
                today={today}
                schoolName={school.name}
                schoolSlug={school.slug}
                schoolYearLabel={yearsLabel}
                variant="verified"
              />
            )}
          </>
        ) : null}

        {!framing.isVerified ? (
          <div className="mt-6">
            <HelpVerifyCalendarCta
              schoolName={school.name}
              pagePath={`/${locale}/schools/${school.slug}`}
              emailSubjectName={encodeURIComponent(school.name).replace(/%20/g, '+')}
            />
          </div>
        ) : null}

        {school.website || school.phone || school.address ? (
          <section
            data-testid="official-links"
            className="mt-6 rounded-3xl border border-cream-border bg-white p-5 md:p-6"
          >
            <h2 className="mb-3 text-base font-black text-ink md:text-lg">
              {t('unofficialFrame.linksTitle')}
            </h2>
            <ul className="space-y-1 text-sm">
              {school.website ? (
                <li>
                  <a
                    href={school.website}
                    rel="noopener nofollow"
                    target="_blank"
                    className="font-bold text-brand-purple hover:underline"
                  >
                    {t('unofficialFrame.linksWebsite')} ↗
                  </a>
                </li>
              ) : null}
              {school.phone ? (
                <li>
                  <a
                    href={`tel:${school.phone.replace(/[^\d+]/g, '')}`}
                    className="font-bold text-ink"
                  >
                    {t('unofficialFrame.linksPhone')} {school.phone}
                  </a>
                </li>
              ) : null}
              {school.address ? (
                <li className="text-muted">
                  {t('unofficialFrame.linksAddress')}: {school.address}
                </li>
              ) : null}
            </ul>
          </section>
        ) : null}

        <section className="mt-6 rounded-3xl border border-cream-border bg-cream p-4 md:p-6">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-bold text-ink">{t('cta.heading')}</p>
              <p className="text-xs text-muted">{t('cta.sub')}</p>
            </div>
            <Link
              href={`/${locale}#signup`}
              className="inline-flex min-h-11 shrink-0 items-center rounded-full bg-gold px-5 py-2 text-sm font-black text-ink hover:bg-gold/90"
            >
              {t('cta.button')}
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
