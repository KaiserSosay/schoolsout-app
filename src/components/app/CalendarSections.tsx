'use client';

import { useTranslations } from 'next-intl';
import { daysUntil } from '@/lib/countdown';
import { schoolCode } from '@/lib/school-codes';

type ClosureRow = {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  emoji: string;
  status: 'verified' | 'ai_draft' | 'rejected' | 'archived';
};

type Section = {
  schoolId: string;
  schoolName: string;
  isUserSchool: boolean;
  closures: ClosureRow[];
};

// DECISION: One <details> per school so they're all independently collapsible
// and keyboard-accessible with zero JS. User's schools render first + get a ⭐.
export function CalendarSections({
  sections,
  locale,
}: {
  sections: Section[];
  locale: string;
}) {
  const t = useTranslations('app.calendar');
  const fmt = new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
  });

  const userSections = sections.filter((s) => s.isUserSchool);
  const otherSections = sections.filter((s) => !s.isUserSchool);

  const renderSection = (s: Section) => (
    <details
      key={s.schoolId}
      className="overflow-hidden rounded-2xl border border-cream-border bg-white"
      open={s.isUserSchool}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          {s.isUserSchool ? (
            <span aria-hidden className="text-gold">
              ⭐
            </span>
          ) : null}
          <span className="inline-flex shrink-0 items-center rounded-full bg-purple-soft px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-brand-purple">
            {schoolCode(s.schoolName)}
          </span>
          <span
            className="truncate text-sm font-black text-ink"
            style={{ letterSpacing: '-0.01em' }}
          >
            {s.schoolName}
          </span>
        </div>
        <span className="shrink-0 text-xs text-muted">
          {s.closures.length}
          <span aria-hidden className="ml-2">
            ▾
          </span>
        </span>
      </summary>
      {s.closures.length === 0 ? (
        <div className="border-t border-cream-border px-4 py-4 text-xs text-muted">
          —
        </div>
      ) : (
        <ul className="divide-y divide-cream-border border-t border-cream-border">
          {s.closures.map((c) => {
            const days = daysUntil(c.start_date);
            const start = new Date(c.start_date + 'T00:00:00');
            const end = new Date(c.end_date + 'T00:00:00');
            const dayCount = Math.max(
              1,
              Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1,
            );
            const dateLabel =
              dayCount > 1
                ? `${fmt.format(start)} – ${fmt.format(end)}`
                : fmt.format(start);
            const countdown = days < 0 ? '—' : `${days}d`;
            const isDraft = c.status !== 'verified';

            return (
              <li
                key={c.id}
                className="flex items-center gap-3 px-4 py-3 text-sm"
              >
                <span className="text-2xl" aria-hidden>
                  {c.emoji}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1 truncate font-bold text-ink">
                    {c.name}
                    {isDraft ? (
                      <span
                        className="shrink-0 text-xs text-muted"
                        title={t('draft')}
                      >
                        ⚠
                      </span>
                    ) : null}
                  </p>
                  <p className="text-xs text-muted">
                    {dateLabel} · {t('closureDuration', { count: dayCount })}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-ink/5 px-2 py-0.5 text-[11px] font-black text-ink">
                  {countdown}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </details>
  );

  return (
    <div className="space-y-6">
      {userSections.length ? (
        <section>
          <h2 className="mb-2 text-[11px] font-black uppercase tracking-wider text-muted">
            {t('yourSchoolsLabel')}
          </h2>
          <div className="space-y-2">{userSections.map(renderSection)}</div>
        </section>
      ) : null}

      {otherSections.length ? (
        <section>
          <h2 className="mb-2 text-[11px] font-black uppercase tracking-wider text-muted">
            {t('otherSchools')}
          </h2>
          <div className="space-y-2">{otherSections.map(renderSection)}</div>
        </section>
      ) : null}
    </div>
  );
}
