import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import { createServiceSupabase } from '@/lib/supabase/service';
import { PublicTopBar } from '@/components/public/PublicTopBar';
import { CalendarView } from '@/components/calendar/CalendarView';
import { ViewToggleLink } from '@/components/calendar/ViewToggleLink';
import {
  publicPageMetadata,
  breadcrumbListJsonLd,
  schoolJsonLd,
  JsonLdScripts,
  SITE_URL,
} from '@/lib/seo';
import type { CalendarClosure } from '@/lib/calendar/types';

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
};

type ClosureRow = {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  emoji: string;
  status: string;
  closure_type?: string | null;
};

async function loadSchool(slug: string): Promise<SchoolRow | null> {
  const svc = createServiceSupabase();
  const { data } = await svc
    .from('schools')
    .select('id, slug, name, district, city, state, address, phone, website')
    .eq('slug', slug)
    .maybeSingle();
  return (data as SchoolRow) ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const school = await loadSchool(slug);
  if (!school) {
    return publicPageMetadata({
      locale,
      path: `/schools/${slug}/calendar`,
      title: "School calendar | School's Out!",
      description: '',
    });
  }
  return publicPageMetadata({
    locale,
    path: `/schools/${slug}/calendar`,
    title: `${school.name} calendar (visual view) | School's Out!`,
    description: `Visual month-grid view of ${school.name} school breaks, holidays, and teacher workdays.`,
  });
}

export default async function PublicSchoolCalendarPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: 'public.school' });
  const school = await loadSchool(slug);
  if (!school) notFound();

  const today = new Date().toISOString().slice(0, 10);
  const oneYearAgo = (() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 13);
    return d.toISOString().slice(0, 10);
  })();
  const svc = createServiceSupabase();
  // Schema-defensive — same fallback dance as the list page.
  const rich = await svc
    .from('closures')
    .select('id, name, start_date, end_date, emoji, status, closure_type')
    .eq('school_id', school.id)
    .gte('end_date', oneYearAgo)
    .order('start_date')
    .limit(120);
  let rows: ClosureRow[] | null = (rich.data ?? null) as ClosureRow[] | null;
  if (rich.error) {
    const lean = await svc
      .from('closures')
      .select('id, name, start_date, end_date, emoji, status')
      .eq('school_id', school.id)
      .gte('end_date', oneYearAgo)
      .order('start_date')
      .limit(120);
    rows = (lean.data ?? null) as ClosureRow[] | null;
  }
  const closureRows = (rows ?? []) as ClosureRow[];

  const closures: CalendarClosure[] = closureRows.map((c) => ({
    id: c.id,
    name: c.name,
    emoji: c.emoji,
    start_date: c.start_date,
    end_date: c.end_date,
    status: c.status,
    closure_type: (c.closure_type as CalendarClosure['closure_type']) ?? null,
    school_id: school.id,
    school_name: school.name,
  }));

  const ldItems = [
    schoolJsonLd({
      name: school.name,
      url: `${SITE_URL}/${locale}/schools/${school.slug}/calendar`,
      district: school.district,
      city: school.city,
      streetAddress: school.address,
      telephone: school.phone,
      websiteUrl: school.website,
    }),
    breadcrumbListJsonLd([
      { name: 'Home', href: `/${locale}` },
      { name: 'Schools', href: `/${locale}/schools` },
      { name: school.name, href: `/${locale}/schools/${school.slug}` },
      { name: 'Calendar', href: `/${locale}/schools/${school.slug}/calendar` },
    ]),
  ];

  return (
    <>
      <JsonLdScripts items={ldItems} />
      <PublicTopBar locale={locale} />
      <main className="mx-auto max-w-3xl px-4 py-8 md:px-6 md:py-12">
        <header className="mb-5 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted">
              {t('verifiedFrame.eyebrow')}
            </p>
            <h1
              className="mt-1 text-3xl font-black text-ink md:text-4xl"
              style={{ letterSpacing: '-0.02em' }}
            >
              {school.name}
            </h1>
            <p className="mt-1 text-sm text-muted">
              {[school.district, school.city, school.state].filter(Boolean).join(' · ')}
            </p>
          </div>
          <ViewToggleLink
            locale={locale}
            currentView="calendar"
            listHref={`/${locale}/schools/${school.slug}`}
            calendarHref={`/${locale}/schools/${school.slug}/calendar`}
          />
        </header>

        {closures.length === 0 ? (
          <p className="rounded-2xl border border-cream-border bg-white p-6 text-center text-sm text-muted">
            {t('empty')}
          </p>
        ) : (
          <CalendarView
            locale={locale}
            closures={closures}
            initialToday={today}
            schoolNameFallback={school.name}
          />
        )}

        <p className="mt-6 text-center text-xs text-muted">
          <Link
            href={`/${locale}/schools/${school.slug}`}
            className="font-bold text-brand-purple hover:underline"
          >
            ← Back to list view
          </Link>
        </p>
      </main>
    </>
  );
}
