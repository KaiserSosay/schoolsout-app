import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

// Server-rendered version of the [List | Calendar] toggle that emits
// real <Link>s instead of localStorage-backed state — used by the
// dedicated /schools/[slug]/calendar page so the URL is shareable and
// SSR-deterministic.
export async function ViewToggleLink({
  locale,
  currentView,
  listHref,
  calendarHref,
}: {
  locale: string;
  currentView: 'list' | 'calendar';
  listHref: string;
  calendarHref: string;
}) {
  const t = await getTranslations({ locale, namespace: 'calendar' });
  const baseBtn =
    'min-h-9 inline-flex items-center justify-center rounded-full px-4 py-1.5 text-xs font-black uppercase tracking-wider transition-colors';
  const active = 'bg-ink text-cream';
  const inactive = 'text-muted hover:text-ink';

  return (
    <div
      role="group"
      aria-label={t('viewToggleLabel')}
      className="inline-flex shrink-0 items-center gap-1 rounded-full border border-cream-border bg-white p-1"
    >
      <Link
        href={listHref}
        aria-current={currentView === 'list' ? 'page' : undefined}
        className={`${baseBtn} ${currentView === 'list' ? active : inactive}`}
      >
        {t('viewList')}
      </Link>
      <Link
        href={calendarHref}
        aria-current={currentView === 'calendar' ? 'page' : undefined}
        className={`${baseBtn} ${currentView === 'calendar' ? active : inactive}`}
      >
        {t('viewCalendar')}
      </Link>
    </div>
  );
}
