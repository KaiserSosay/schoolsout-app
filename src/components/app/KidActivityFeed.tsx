'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useMode } from './ModeProvider';

type Activity = {
  id: string;
  action: 'saved_camp' | 'unsaved_camp' | 'viewed_closure' | 'viewed_camp';
  target_name: string;
  target_id: string | null;
  created_at: string;
  metadata?: Record<string, unknown>;
};

// DECISION: Poll every 30s. Simpler and cheaper than a Supabase realtime
// subscription for a feed that updates at most a handful of times per day.
// We reset to the server-provided `initial` on first render, then overwrite
// with polled results — avoids a blank state while the first fetch is in
// flight.
export function KidActivityFeed({ initial, locale }: { initial: Activity[]; locale: string }) {
  const t = useTranslations('app.dashboard.activity');
  const [items, setItems] = useState<Activity[]>(initial);
  const { setMode } = useMode();

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch('/api/kid-activity', { cache: 'no-store' });
        if (!res.ok) return;
        const json = (await res.json()) as { activity?: Activity[] };
        if (!cancelled && Array.isArray(json.activity)) setItems(json.activity);
      } catch {
        /* network blip — keep current list */
      }
    };
    const iv = window.setInterval(load, 30_000);
    return () => {
      cancelled = true;
      window.clearInterval(iv);
    };
  }, []);

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  const relative = (iso: string) => {
    const diffMs = new Date(iso).getTime() - Date.now();
    const diffMin = Math.round(diffMs / 60_000);
    const absMin = Math.abs(diffMin);
    if (absMin < 60) return rtf.format(diffMin, 'minute');
    const diffHr = Math.round(diffMin / 60);
    if (Math.abs(diffHr) < 24) return rtf.format(diffHr, 'hour');
    const diffDay = Math.round(diffHr / 24);
    return rtf.format(diffDay, 'day');
  };

  const describe = (a: Activity) => {
    switch (a.action) {
      case 'saved_camp':    return t('savedCamp',      { name: a.target_name });
      case 'unsaved_camp':  return t('unsavedCamp',    { name: a.target_name });
      case 'viewed_camp':   return t('viewedCamp',     { name: a.target_name });
      case 'viewed_closure':return t('viewedClosure',  { name: a.target_name });
      default: return a.target_name;
    }
  };

  return (
    <section>
      <h3 className="mb-3 text-xs font-black uppercase tracking-wider text-muted">
        {t('title')}
      </h3>
      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-cream-border bg-white/60 p-6 text-center">
          <p className="text-sm text-muted">{t('empty')}</p>
          <button
            type="button"
            onClick={() => setMode('kids')}
            className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-brand-purple hover:underline"
          >
            {t('emptyCta')}
          </button>
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((a) => (
            <li
              key={a.id}
              className="flex items-start justify-between rounded-2xl border border-cream-border bg-white px-4 py-3"
            >
              <p className="text-sm text-ink">{describe(a)}</p>
              <span className="ml-3 shrink-0 text-[11px] text-muted">{relative(a.created_at)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
