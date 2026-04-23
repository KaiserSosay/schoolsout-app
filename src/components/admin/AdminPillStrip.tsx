import Link from 'next/link';

export type PillCounts = {
  featureRequests: number;
  campRequests: number;
  calendarReviews: number;
  integrityWarnings: number;
  users: number;
};

type Pill = {
  key: keyof PillCounts;
  tab: string;
  emoji: string;
  label: string;
};

const PILLS: Pill[] = [
  { key: 'featureRequests', tab: 'feature-requests', emoji: '💡', label: 'Feature requests' },
  { key: 'campRequests', tab: 'camp-requests', emoji: '🏕️', label: 'Camp requests' },
  { key: 'calendarReviews', tab: 'calendar-reviews', emoji: '📅', label: 'Calendar reviews' },
  { key: 'integrityWarnings', tab: 'integrity', emoji: '⚠️', label: 'Integrity warnings' },
  { key: 'users', tab: 'users', emoji: '👥', label: 'Users' },
];

export function AdminPillStrip({
  locale,
  counts,
  activeTab,
}: {
  locale: string;
  counts: PillCounts;
  activeTab: string;
}) {
  return (
    <ul className="grid grid-cols-2 gap-2 md:grid-cols-5">
      {PILLS.map((p) => {
        const count = counts[p.key];
        const isHot = count > 0;
        const isActive = activeTab === p.tab;
        const bg = isActive
          ? 'border-brand-purple bg-brand-purple text-white'
          : isHot
            ? 'border-brand-purple/30 bg-purple-soft text-ink hover:border-brand-purple'
            : 'border-cream-border bg-cream/70 text-muted hover:border-brand-purple/40';
        return (
          <li key={p.key}>
            <Link
              href={`/${locale}/admin?tab=${p.tab}`}
              className={
                'flex flex-col gap-0.5 rounded-2xl border-2 p-3 transition-colors ' + bg
              }
            >
              <span className="flex items-center justify-between gap-2">
                <span aria-hidden className="text-base">
                  {p.emoji}
                </span>
                <span className="text-2xl font-black tabular-nums">{count}</span>
              </span>
              <span className="text-[11px] font-bold uppercase tracking-wider">
                {p.label}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
