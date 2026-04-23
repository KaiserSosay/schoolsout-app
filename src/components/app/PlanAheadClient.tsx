'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { closureHref, focusRing } from '@/lib/links';
import { detectLongWeekend } from '@/lib/longWeekend';

export type KidEntry = {
  id: string;
  age_range: string;
  ordinal: number;
  school_id: string | null;
};

type KidLabel = KidEntry & { fallback_name: string };

export type PlanAheadClosure = {
  id: string;
  school_id: string;
  school_name: string | null;
  name: string;
  start_date: string;
  end_date: string;
  emoji: string;
};

type PlanRow = {
  plan_id: string;
  closure_id: string;
  kid_names: string[];
  registered: boolean;
};

export function PlanAheadClient({
  locale,
  closures,
  kids,
  plans,
}: {
  locale: string;
  closures: PlanAheadClosure[];
  kids: KidLabel[];
  plans: PlanRow[];
}) {
  // Pull display names from localStorage (same pattern as the wizard). The
  // `ordinal` on kid_profiles maps to the index in the so-kids array.
  const [nameByOrdinal, setNameByOrdinal] = useState<Record<number, string>>({});
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem('so-kids');
      if (!raw) return;
      const parsed = JSON.parse(raw) as Array<{ name?: string }>;
      if (!Array.isArray(parsed)) return;
      const map: Record<number, string> = {};
      parsed.forEach((k, i) => {
        if (k?.name) map[i] = k.name;
      });
      setNameByOrdinal(map);
    } catch {
      /* ignore */
    }
  }, []);

  const kidsWithNames = useMemo(
    () =>
      kids.map((k) => ({
        ...k,
        display_name: nameByOrdinal[k.ordinal] ?? k.fallback_name,
      })),
    [kids, nameByOrdinal],
  );

  // Build a per-closure × per-kid chip state lookup.
  const stateByClosure = useMemo(() => {
    const map = new Map<string, { registered: boolean; kidNames: Set<string> }>();
    for (const p of plans) {
      map.set(p.closure_id, {
        registered: p.registered,
        kidNames: new Set(p.kid_names),
      });
    }
    return map;
  }, [plans]);

  const totalSlots = closures.length * Math.max(1, kids.length);
  let plannedSlots = 0;
  let registeredSlots = 0;
  for (const p of plans) {
    const names = p.kid_names.length || 1;
    plannedSlots += names;
    if (p.registered) registeredSlots += names;
  }
  const progressPct = totalSlots === 0 ? 0 : Math.round((plannedSlots / totalSlots) * 100);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:px-6 md:py-10">
      <header className="mb-6">
        <p className="text-[11px] font-black uppercase tracking-wider text-brand-purple">
          PLAN AHEAD
        </p>
        <h1 className="mt-1 text-3xl font-black text-ink md:text-4xl" style={{ letterSpacing: '-0.02em' }}>
          {closures.length > 0
            ? `You have ${closures.length} upcoming ${closures.length === 1 ? 'closure' : 'closures'}. Let's plan them all.`
            : 'No upcoming closures yet.'}
        </h1>
        {closures.length > 0 ? (
          <>
            <p className="mt-2 text-sm text-muted">
              {plannedSlots} of {totalSlots} planned · {registeredSlots} registered
            </p>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-cream-border">
              <div
                className="h-full rounded-full bg-brand-purple transition-all"
                style={{ width: `${progressPct}%` }}
                aria-valuenow={progressPct}
                aria-valuemin={0}
                aria-valuemax={100}
                role="progressbar"
              />
            </div>
          </>
        ) : null}
      </header>

      {closures.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-cream-border bg-white p-8 text-center text-sm text-muted">
          We&apos;ll surface them here once a verified closure lands in your
          school&apos;s calendar.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {closures.map((c) => {
            const state = stateByClosure.get(c.id);
            const lw = detectLongWeekend({ start_date: c.start_date, end_date: c.end_date });
            const dateLabel = new Date(c.start_date + 'T00:00:00').toLocaleDateString(
              locale,
              { weekday: 'short', month: 'short', day: 'numeric' },
            );
            return (
              <li key={c.id} className="rounded-2xl border border-cream-border bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <Link
                      href={closureHref(locale, c.id)}
                      className={
                        'text-base font-black text-ink hover:text-brand-purple ' + focusRing
                      }
                    >
                      <span aria-hidden className="mr-1">
                        {c.emoji}
                      </span>
                      {c.name}
                    </Link>
                    <p className="text-xs text-muted">
                      {dateLabel}
                      {c.school_name ? ` · ${c.school_name}` : ''}
                    </p>
                    {lw.isLongWeekend ? (
                      <p className="mt-1 inline-flex rounded-full bg-cream-border/60 px-2 py-0.5 text-[10px] font-bold text-ink">
                        {lw.label}
                      </p>
                    ) : null}
                  </div>
                  <ul className="flex flex-wrap gap-2">
                    {kidsWithNames.map((k) => {
                      const planned = state?.kidNames.has(k.display_name) ?? false;
                      const registered = planned && state!.registered;
                      const chipCls = registered
                        ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                        : planned
                          ? 'bg-gold text-ink border-gold'
                          : 'bg-white text-muted border-cream-border hover:border-brand-purple/40';
                      const label = registered
                        ? `${k.display_name} ✓ registered`
                        : planned
                          ? `${k.display_name} · planned`
                          : `${k.display_name} · plan?`;
                      return (
                        <li key={k.id}>
                          <Link
                            href={closureHref(locale, c.id)}
                            className={
                              'inline-flex min-h-10 items-center rounded-full border-2 px-3 py-1.5 text-xs font-bold transition-colors ' +
                              chipCls +
                              ' ' +
                              focusRing
                            }
                          >
                            {label}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
