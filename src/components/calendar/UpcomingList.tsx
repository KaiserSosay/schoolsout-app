'use client';

import { useTranslations } from 'next-intl';
import { relativeDays } from '@/lib/calendar/dates';
import type { CalendarClosure } from '@/lib/calendar/types';

export function UpcomingList({
  today,
  closures,
  locale,
  onSelect,
  limit = 8,
}: {
  today: string;
  closures: CalendarClosure[];
  locale: string;
  onSelect?: (iso: string) => void;
  limit?: number;
}) {
  const t = useTranslations('calendar');
  const upcoming = closures
    .filter((c) => c.end_date >= today)
    .sort((a, b) => a.start_date.localeCompare(b.start_date))
    .slice(0, limit);

  if (upcoming.length === 0) {
    return (
      <p className="rounded-2xl border border-cream-border bg-white p-4 text-sm text-muted">
        {t('upcomingEmpty')}
      </p>
    );
  }

  const fmt = new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
  });

  return (
    <ul
      data-testid="upcoming-list"
      className="divide-y divide-cream-border overflow-hidden rounded-2xl border border-cream-border bg-white"
    >
      {upcoming.map((c) => {
        const start = new Date(c.start_date + 'T12:00:00Z');
        const end = new Date(c.end_date + 'T12:00:00Z');
        const sameDay = c.start_date === c.end_date;
        const dateLabel = sameDay
          ? fmt.format(start)
          : `${fmt.format(start)} – ${fmt.format(end)}`;
        const days = relativeDays(c.start_date, today);
        const countdown =
          days <= 0
            ? t('happeningNow')
            : t('inDays', { count: days });

        return (
          <li key={c.id}>
            <button
              type="button"
              onClick={() => onSelect?.(c.start_date)}
              className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm hover:bg-cream"
            >
              <span aria-hidden className="text-2xl">
                {c.emoji}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-black text-ink">{c.name}</span>
                <span className="block text-xs text-muted">
                  {dateLabel}
                  {c.school_name ? ` · ${c.school_name}` : ''}
                </span>
              </span>
              <span className="shrink-0 rounded-full bg-ink/5 px-2 py-0.5 text-[11px] font-black text-ink">
                {countdown}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
