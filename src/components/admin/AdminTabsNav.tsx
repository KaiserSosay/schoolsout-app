import Link from 'next/link';

type Tab = { key: string; label: string };

const TABS: Tab[] = [
  { key: 'feature-requests', label: 'Feature requests' },
  { key: 'camp-requests', label: 'Camp requests' },
  { key: 'calendar-reviews', label: 'Calendar reviews' },
  { key: 'enrichment', label: 'Enrichment' },
  { key: 'integrity', label: 'Integrity' },
  { key: 'school-requests', label: 'School requests' },
  { key: 'data-quality', label: 'Data quality' },
  { key: 'users', label: 'Users' },
];

export function AdminTabsNav({
  locale,
  active,
}: {
  locale: string;
  active: string;
}) {
  return (
    <nav
      aria-label="Admin tabs"
      className="sticky top-0 z-20 -mx-4 overflow-x-auto border-b border-cream-border bg-cream/95 px-4 py-3 backdrop-blur md:-mx-6 md:px-6"
    >
      <ul className="flex gap-1">
        {TABS.map((t) => {
          const isActive = active === t.key;
          return (
            <li key={t.key}>
              <Link
                href={`/${locale}/admin?tab=${t.key}`}
                aria-current={isActive ? 'page' : undefined}
                className={
                  'inline-flex min-h-10 items-center rounded-full px-3 py-1.5 text-xs font-bold transition-colors ' +
                  (isActive
                    ? 'bg-ink text-white'
                    : 'text-muted hover:bg-white hover:text-ink')
                }
              >
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
