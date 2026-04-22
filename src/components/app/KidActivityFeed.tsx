'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useMode } from './ModeProvider';
import { KidShareCard } from './KidShareCard';

type Activity = {
  id: string;
  action: 'saved_camp' | 'unsaved_camp' | 'viewed_closure' | 'viewed_camp';
  target_name: string;
  target_id: string | null;
  created_at: string;
  metadata?: Record<string, unknown>;
};

// DECISION: Poll every 30s (server cost), BUT merge locally-dispatched
// `so-activity` events immediately so the feed feels live when the same user
// is saving camps. The optimistic local row is deduplicated on the next poll
// by target_id+action (we keep the newer created_at).
export function KidActivityFeed({ initial, locale }: { initial: Activity[]; locale: string }) {
  const t = useTranslations('app.dashboard.activity');
  const [items, setItems] = useState<Activity[]>(initial);
  const [loaded, setLoaded] = useState(initial.length > 0);
  const { setMode } = useMode();
  const firstRun = useRef(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch('/api/kid-activity', { cache: 'no-store' });
        if (!res.ok) return;
        const json = (await res.json()) as { activity?: Activity[] };
        if (!cancelled && Array.isArray(json.activity)) {
          setItems(json.activity);
          setLoaded(true);
        }
      } catch {
        /* network blip — keep current list */
      } finally {
        if (firstRun.current) {
          firstRun.current = false;
          if (!cancelled) setLoaded(true);
        }
      }
    };
    // Prime the feed immediately so skeletons don't linger on tab-open.
    load();
    const iv = window.setInterval(load, 30_000);
    return () => {
      cancelled = true;
      window.clearInterval(iv);
    };
  }, []);

  // Optimistic insert from SaveCampButton — prepend & dedupe by id.
  useEffect(() => {
    function onActivity(e: Event) {
      const detail = (e as CustomEvent<Activity>).detail;
      if (!detail?.id) return;
      setItems((prev) => {
        if (prev.some((p) => p.id === detail.id)) return prev;
        return [detail, ...prev].slice(0, 20);
      });
    }
    window.addEventListener('so-activity', onActivity as EventListener);
    return () =>
      window.removeEventListener('so-activity', onActivity as EventListener);
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

  // Skeleton rows while the first poll is in flight AND we have no SSR initial.
  if (!loaded) {
    return (
      <section>
        <h3 className="mb-3 text-xs font-black uppercase tracking-wider text-muted">
          {t('title')}
        </h3>
        <ul className="space-y-2" aria-hidden>
          {[0, 1, 2].map((i) => (
            <li
              key={i}
              className="flex items-center justify-between rounded-2xl border border-cream-border bg-white px-4 py-3"
            >
              <div className="skeleton-shine-cream h-3 w-2/3 rounded-full" />
              <div className="skeleton-shine-cream ml-3 h-3 w-12 rounded-full" />
            </li>
          ))}
        </ul>
      </section>
    );
  }

  return (
    <section>
      <h3 className="mb-3 text-xs font-black uppercase tracking-wider text-muted">
        {t('title')}
      </h3>
      {items.length === 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-dashed border-cream-border bg-white/60 p-6 text-center">
            <div className="animate-gentle-bounce text-4xl" aria-hidden>
              👦
            </div>
            <p className="mt-3 text-sm text-muted">{t('empty')}</p>
            <button
              type="button"
              onClick={() => setMode('kids')}
              className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-brand-purple hover:underline min-h-11"
            >
              {t('emptyCta')}
            </button>
          </div>
          <KidShareCard />
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
