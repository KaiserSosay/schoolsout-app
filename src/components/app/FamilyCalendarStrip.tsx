'use client';

import { useRef } from 'react';
import { useTranslations } from 'next-intl';
import { daysUntil } from '@/lib/countdown';
import type { Closure } from '@/lib/closures';

// DECISION: Manual school-name → 3-letter code map covers the 10 seeded
// Miami schools. Anything else falls back to the first three letters of the
// name. Keeps the strip tight without requiring a new DB column.
const SCHOOL_CODES: Record<string, string> = {
  'The Growing Place': 'TGP',
  'Coral Gables Preparatory Academy': 'CGP',
  'Miami-Dade County Public Schools': 'MDC',
  'Gulliver Preparatory School': 'GUL',
  'Ransom Everglades School': 'RE',
  'Palmer Trinity School': 'PAL',
  'Belen Jesuit Preparatory School': 'BEL',
  'Riviera Schools': 'RIV',
  'Westminster Christian School': 'WES',
  'Miami Catholic Schools (diocesan)': 'CAT',
};

function schoolCode(name: string | null | undefined): string {
  if (!name) return '---';
  return SCHOOL_CODES[name] ?? name.replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase();
}

type Row = Closure & { schoolName: string | null };

export function FamilyCalendarStrip({
  closures,
  locale,
}: {
  closures: Row[];
  locale: string;
}) {
  const t = useTranslations('app.dashboard.calendarStrip');
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  if (closures.length === 0) return null;

  const fmt = new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' });

  const nudge = (dir: -1 | 1) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * 220, behavior: 'smooth' });
  };

  return (
    <section>
      <div className="mb-3 flex items-end justify-between">
        <h3 className="text-xs font-black uppercase tracking-wider text-muted">
          {t('title')}
        </h3>
        <div className="hidden gap-1 sm:flex">
          <button
            type="button"
            aria-label="Scroll left"
            onClick={() => nudge(-1)}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-cream-border bg-white text-muted hover:text-ink"
          >
            ←
          </button>
          <button
            type="button"
            aria-label="Scroll right"
            onClick={() => nudge(1)}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-cream-border bg-white text-muted hover:text-ink"
          >
            →
          </button>
        </div>
      </div>
      <div
        ref={scrollerRef}
        className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {closures.map((c) => {
          const days = Math.max(0, daysUntil(c.start_date));
          return (
            <article
              key={c.id}
              className="min-w-[180px] max-w-[180px] shrink-0 snap-start rounded-2xl border border-cream-border bg-white p-4"
            >
              <span className="inline-flex items-center rounded-full bg-purple-soft px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-brand-purple">
                {schoolCode(c.schoolName)}
              </span>
              <p
                className="mt-2 line-clamp-2 text-sm font-black text-ink"
                style={{ letterSpacing: '-0.01em' }}
              >
                {c.name}
              </p>
              <p className="mt-2 text-2xl font-black text-brand-purple">{days}d</p>
              <p className="text-xs text-muted">
                {fmt.format(new Date(c.start_date + 'T00:00:00'))}
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
