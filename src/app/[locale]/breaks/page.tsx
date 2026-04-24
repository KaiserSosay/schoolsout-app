import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { createServiceSupabase } from '@/lib/supabase/service';
import { PublicTopBar } from '@/components/public/PublicTopBar';

// Public school-breaks index at /{locale}/breaks.
// Lists upcoming verified closures across every tracked school, grouped
// by month. Signed-out visitors can browse; signup CTA nudges reminders.
export const dynamic = 'force-dynamic';

type ClosureRow = {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  emoji: string;
  status: string;
  school_id: string;
};
type SchoolRow = { id: string; name: string; slug: string };

function formatDate(iso: string, locale: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString(
    locale === 'es' ? 'es-US' : 'en-US',
    { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' },
  );
}

function daysFromToday(iso: string): number {
  const target = new Date(iso + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round(
    (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );
}

export default async function PublicBreaksPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'public.breaks' });
  const today = new Date().toISOString().slice(0, 10);
  const svc = createServiceSupabase();
  const [{ data: closuresData }, { data: schoolsData }] = await Promise.all([
    svc
      .from('closures')
      .select('id, name, start_date, end_date, emoji, status, school_id')
      .eq('status', 'verified')
      .gte('start_date', today)
      .order('start_date')
      .limit(200),
    svc.from('schools').select('id, name, slug'),
  ]);
  const closures = (closuresData ?? []) as ClosureRow[];
  const schools = (schoolsData ?? []) as SchoolRow[];
  const schoolById = new Map(schools.map((s) => [s.id, s] as const));

  return (
    <>
      <PublicTopBar locale={locale} />
      <main className="mx-auto max-w-4xl px-4 py-8 md:px-6 md:py-12">
        <header className="mb-6">
          <h1
            className="text-2xl font-black text-ink md:text-3xl"
            style={{ letterSpacing: '-0.02em' }}
          >
            {t('title')}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted md:text-base">
            {t('subtitle')}
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

        {closures.length === 0 ? (
          <p className="rounded-2xl border border-cream-border bg-white p-8 text-center text-sm text-muted">
            {t('empty')}
          </p>
        ) : (
          <ul className="space-y-2">
            {closures.map((c) => {
              const school = schoolById.get(c.school_id);
              const days = daysFromToday(c.start_date);
              return (
                <li key={c.id}>
                  <Link
                    href={`/${locale}/breaks/${c.id}`}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-cream-border bg-white px-4 py-3 transition-colors hover:border-brand-purple/40"
                  >
                    <div className="min-w-0">
                      <p
                        className="truncate text-sm font-black text-ink"
                        style={{ letterSpacing: '-0.01em' }}
                      >
                        {c.emoji} {c.name}
                      </p>
                      <p className="text-xs text-muted">
                        {formatDate(c.start_date, locale)}
                        {c.end_date !== c.start_date
                          ? ` — ${formatDate(c.end_date, locale)}`
                          : ''}
                        {school ? ` · ${school.name}` : ''}
                      </p>
                    </div>
                    <span
                      className={
                        'shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold ' +
                        (days <= 7
                          ? 'bg-amber-100 text-amber-900'
                          : 'bg-purple-soft text-brand-purple')
                      }
                    >
                      {days === 0
                        ? t('today')
                        : days === 1
                          ? t('tomorrow')
                          : t('inDays', { n: days })}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </>
  );
}
