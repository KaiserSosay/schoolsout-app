'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { createBrowserSupabase } from '@/lib/supabase/browser';
import { ErrorState } from '@/components/ErrorState';

type ReminderSend = {
  id: string;
  created_at: string;
  days_before: number;
  closures: { name: string | null; emoji: string | null } | null;
};

// Stubbed notifications surface. Lists the user's 20 most recent reminder
// email sends from reminder_sends → closures. No push-notification machinery
// yet; when we build one, this drawer is the obvious home for it.
//
// DECISION (Phase 3.0 / Item 1.7): every failure path here renders the
// branded ErrorState in-place rather than throwing. A previous version
// could push the route-segment error boundary into the foreground when
// the bell was tapped on flaky mobile networks — that's the wrong UX
// (an error boundary unmounts the entire page), and the bell is supposed
// to be a low-stakes "what reminders did I get?" peek.
export function NotificationsDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const t = useTranslations('app.nav');
  const [sends, setSends] = useState<ReminderSend[] | null>(null);
  const [errored, setErrored] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    if (!open || sends !== null) return;
    let cancelled = false;
    (async () => {
      try {
        const sb = createBrowserSupabase();
        const { data, error } = await sb
          .from('reminder_sends')
          .select('id, created_at, days_before, closures(name, emoji)')
          .order('created_at', { ascending: false })
          .limit(20);
        if (cancelled) return;
        if (error) {
          setErrored(true);
          setSends([]);
          return;
        }
        const rows = (data ?? []).map((r) => {
          const c = r.closures as
            | { name: string | null; emoji: string | null }
            | Array<{ name: string | null; emoji: string | null }>
            | null;
          return {
            id: r.id,
            created_at: r.created_at,
            days_before: r.days_before,
            closures: Array.isArray(c) ? (c[0] ?? null) : c,
          };
        });
        setSends(rows);
        setErrored(false);
      } catch {
        if (!cancelled) {
          setErrored(true);
          setSends([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, sends, retryKey]);

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-ink/30"
        onClick={onClose}
        aria-hidden
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={t('notifications')}
        className="fixed right-0 top-0 z-50 flex h-full w-full max-w-sm flex-col border-l border-cream-border bg-white shadow-2xl"
      >
        <header className="flex items-center justify-between border-b border-cream-border px-4 py-3">
          <h2 className="text-base font-black text-ink">
            {t('notificationsTitle')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-cream hover:text-ink"
          >
            ✕
          </button>
        </header>
        <div className="flex-1 overflow-auto">
          {sends === null ? (
            <div className="p-4 text-sm text-muted">…</div>
          ) : errored ? (
            <ErrorState
              compact
              onRetry={() => {
                setSends(null);
                setErrored(false);
                setRetryKey((k) => k + 1);
              }}
            />
          ) : sends.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted">
              {t('notificationsEmpty')}
            </div>
          ) : (
            <ul className="divide-y divide-cream-border">
              {sends.map((s) => (
                <li key={s.id} className="flex items-start gap-3 px-4 py-3">
                  <span aria-hidden className="text-xl">
                    {s.closures?.emoji ?? '🗓️'}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-ink">
                      {s.closures?.name ?? '—'}
                    </div>
                    <div className="text-xs text-muted">
                      {new Date(s.created_at).toLocaleDateString()} ·{' '}
                      {s.days_before}d
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>
    </>
  );
}
