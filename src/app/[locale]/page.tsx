import { getUpcomingClosures } from '@/lib/closures';
import { ClosureCard } from '@/components/ClosureCard';
import { ReminderSignup } from '@/components/ReminderSignup';
import { getTranslations } from 'next-intl/server';

const NOAH_SCHOOL_ID = '00000000-0000-0000-0000-000000000001';

// DECISION: force dynamic rendering so build doesn't fail when Supabase env isn't set
export const dynamic = 'force-dynamic';

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations();

  let closures: Awaited<ReturnType<typeof getUpcomingClosures>> = [];
  try {
    closures = await getUpcomingClosures(NOAH_SCHOOL_ID);
  } catch {
    // DECISION: swallow errors when DB isn't available so the page still renders.
    // In production the env vars are set and Supabase is reachable.
    closures = [];
  }
  const next3 = closures.slice(0, 3);
  const rest = closures.slice(3);

  return (
    <main className="max-w-3xl mx-auto px-4 pb-20">
      <section className="text-center py-10">
        <h1 className="text-4xl font-bold">{t('home.title')}</h1>
        <p className="mt-2 text-white/70">{t('home.subtitle')}</p>
      </section>

      <ReminderSignup schoolId={NOAH_SCHOOL_ID} locale={locale} />

      <section className="mt-10">
        <h2 className="text-lg font-bold mb-3">{t('home.next3')}</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {next3.map((c) => (<ClosureCard key={c.id} closure={c} />))}
        </div>
      </section>

      {rest.length > 0 && (
        <details className="mt-8 bg-white/5 rounded-2xl p-4">
          <summary className="cursor-pointer font-bold">{t('home.restOfYear')}</summary>
          <ul className="mt-3 space-y-2">
            {rest.map((c) => (
              <li key={c.id} className="flex justify-between text-sm">
                <span>{c.emoji} {c.name}</span>
                <span className="text-white/60">
                  {new Date(c.start_date).toLocaleDateString()} – {new Date(c.end_date).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </main>
  );
}
