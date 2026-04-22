'use client';

import { useTranslations } from 'next-intl';
import { daysUntil } from '@/lib/countdown';
import { schoolCode } from '@/lib/school-codes';
import { useMode } from './ModeProvider';

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
// Mode-aware colors: cream/ink in parent mode, white/10 glass in kid mode.
export function CalendarSections({
  sections,
  locale,
}: {
  sections: Section[];
  locale: string;
}) {
  const t = useTranslations('app.calendar');
  const { mode } = useMode();
  const isParents = mode === 'parents';

  const fmt = new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
  });

  const userSections = sections.filter((s) => s.isUserSchool);
  const otherSections = sections.filter((s) => !s.isUserSchool);

  const containerCls = isParents
    ? 'overflow-hidden rounded-2xl border border-cream-border bg-white'
    : 'overflow-hidden rounded-2xl border border-white/10 bg-white/10 backdrop-blur';
  const pillCls = isParents
    ? 'bg-purple-soft text-brand-purple'
    : 'bg-white/20 text-white';
  const nameCls = isParents ? 'text-ink' : 'text-white';
  const mutedCls = isParents ? 'text-muted' : 'text-white/70';
  const dividerCls = isParents ? 'divide-cream-border' : 'divide-white/10';
  const borderCls = isParents ? 'border-cream-border' : 'border-white/10';
  const countdownCls = isParents
    ? 'bg-ink/5 text-ink'
    : 'bg-white/20 text-white';
  const sectionLabelCls = isParents ? 'text-muted' : 'text-white/60';

  const renderSection = (s: Section) => (
    <details key={s.schoolId} className={containerCls} open={s.isUserSchool}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          {s.isUserSchool ? (
            <span aria-hidden className="text-gold">
              ⭐
            </span>
          ) : null}
          <span
            className={
              'inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ' +
              pillCls
            }
          >
            {schoolCode(s.schoolName)}
          </span>
          <span
            className={'truncate text-sm font-black ' + nameCls}
            style={{ letterSpacing: '-0.01em' }}
          >
            {s.schoolName}
          </span>
        </div>
        <span className={'shrink-0 text-xs ' + mutedCls}>
          {s.closures.length}
          <span aria-hidden className="ml-2">
            ▾
          </span>
        </span>
      </summary>
      {s.closures.length === 0 ? (
        <div className={'border-t px-4 py-4 text-xs ' + borderCls + ' ' + mutedCls}>
          —
        </div>
      ) : (
        <ul className={'divide-y border-t ' + dividerCls + ' ' + borderCls}>
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
                  <p className={'flex items-center gap-1 truncate font-bold ' + nameCls}>
                    {c.name}
                    {isDraft ? (
                      <span
                        className={'shrink-0 text-xs ' + mutedCls}
                        title={t('draft')}
                      >
                        ⚠
                      </span>
                    ) : null}
                  </p>
                  <p className={'text-xs ' + mutedCls}>
                    {dateLabel} · {t('closureDuration', { count: dayCount })}
                  </p>
                </div>
                <span
                  className={
                    'shrink-0 rounded-full px-2 py-0.5 text-[11px] font-black ' +
                    countdownCls
                  }
                >
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
          <h2
            className={
              'mb-2 text-[11px] font-black uppercase tracking-wider ' +
              sectionLabelCls
            }
          >
            {t('yourSchoolsLabel')}
          </h2>
          <div className="space-y-2">{userSections.map(renderSection)}</div>
        </section>
      ) : null}

      {otherSections.length ? (
        <section>
          <h2
            className={
              'mb-2 text-[11px] font-black uppercase tracking-wider ' +
              sectionLabelCls
            }
          >
            {t('otherSchools')}
          </h2>
          <div className="space-y-2">{otherSections.map(renderSection)}</div>
        </section>
      ) : null}
    </div>
  );
}
