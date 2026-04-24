import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { createServiceSupabase } from '@/lib/supabase/service';
import { PublicTopBar } from '@/components/public/PublicTopBar';

// Public per-school calendar page. SEO gold for queries like
// "Miami Beach Senior High calendar" or "Gulliver Academy winter
// break 2026". Pure read — no auth.
export const dynamic = 'force-dynamic';

type SchoolRow = {
  id: string;
  slug: string;
  name: string;
  district: string;
  city: string;
  state: string;
};
type ClosureRow = {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  emoji: string;
  status: string;
  source: string;
};

function formatDate(iso: string, locale: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString(
    locale === 'es' ? 'es-US' : 'en-US',
    { weekday: 'short', month: 'short', day: 'numeric' },
  );
}

export default async function PublicSchoolPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: 'public.school' });
  const svc = createServiceSupabase();
  const { data: schoolData } = await svc
    .from('schools')
    .select('id, slug, name, district, city, state')
    .eq('slug', slug)
    .maybeSingle();
  if (!schoolData) notFound();
  const school = schoolData as SchoolRow;

  const today = new Date().toISOString().slice(0, 10);
  const { data: closuresData } = await svc
    .from('closures')
    .select('id, name, start_date, end_date, emoji, status, source')
    .eq('school_id', school.id)
    .gte('end_date', today)
    .order('start_date')
    .limit(40);
  const closures = (closuresData ?? []) as ClosureRow[];

  return (
    <>
      <PublicTopBar locale={locale} />
      <main className="mx-auto max-w-3xl px-4 py-8 md:px-6 md:py-12">
        <header className="mb-6">
          <h1
            className="text-3xl font-black text-ink md:text-4xl"
            style={{ letterSpacing: '-0.02em' }}
          >
            {school.name}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {[school.district, school.city, school.state].filter(Boolean).join(' · ')}
          </p>
        </header>

        <section className="mb-6 rounded-3xl border border-cream-border bg-cream p-4 md:p-6">
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

        <h2 className="mb-3 text-sm font-black text-ink">{t('closures')}</h2>
        {closures.length === 0 ? (
          <p className="rounded-2xl border border-cream-border bg-white p-6 text-center text-sm text-muted">
            {t('empty')}
          </p>
        ) : (
          <ul className="space-y-2">
            {closures.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/${locale}/breaks/${c.id}`}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-cream-border bg-white px-4 py-3 transition-colors hover:border-brand-purple/40"
                >
                  <div>
                    <p className="text-sm font-black text-ink">
                      {c.emoji} {c.name}
                    </p>
                    <p className="text-xs text-muted">
                      {formatDate(c.start_date, locale)}
                      {c.end_date !== c.start_date
                        ? ` — ${formatDate(c.end_date, locale)}`
                        : ''}
                    </p>
                  </div>
                  <span
                    className={
                      'rounded-full px-2 py-0.5 text-[11px] font-bold ' +
                      (c.status === 'verified'
                        ? 'bg-emerald-100 text-emerald-900'
                        : 'bg-amber-100 text-amber-900')
                    }
                  >
                    {c.status === 'verified' ? t('verified') : t('pending')}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
