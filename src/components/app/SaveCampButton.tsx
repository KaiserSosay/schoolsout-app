'use client';

import { useEffect, useRef, useState, useTransition, type MouseEvent } from 'react';
import { useTranslations } from 'next-intl';

// DECISION: Optimistic flip with retry-on-failure. /api/saved-camps writes
// kid_activity server-side, so we don't double-post. On 401 we roll back and
// warn via toast. On success (next=true only) we trigger a sparkle burst,
// fire a haptic on supported devices, and dispatch a `so-activity` CustomEvent
// so the RecentActivityFeed can optimistically prepend a row without waiting
// for the next 30s poll.
export function SaveCampButton({
  campId,
  campName,
  initiallySaved,
  size = 'md',
  fullWidth = false,
  labelWhenSaved,
  labelWhenUnsaved,
}: {
  campId: string;
  campName?: string;
  initiallySaved: boolean;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  labelWhenSaved?: string;
  labelWhenUnsaved?: string;
}) {
  const t = useTranslations('app.camps');
  const tSaved = useTranslations('app.saved');
  const tToast = useTranslations('app.camps.toast');
  const [saved, setSaved] = useState(initiallySaved);
  const [pending, startTransition] = useTransition();
  const [burstKey, setBurstKey] = useState(0);
  const [popKey, setPopKey] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const popRef = useRef<HTMLSpanElement>(null);

  // Retrigger the emoji "pop" whenever saved flips true.
  useEffect(() => {
    if (popKey === 0) return;
    const el = popRef.current;
    if (!el) return;
    el.classList.remove('animate-save-pop');
    void el.offsetWidth;
    el.classList.add('animate-save-pop');
  }, [popKey]);

  const onClick = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (pending) return;

    const next = !saved;
    setSaved(next);
    setError(null);

    if (next) {
      setBurstKey((k) => k + 1);
      setPopKey((k) => k + 1);
      try {
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
          navigator.vibrate?.(10);
        }
      } catch {
        /* iOS Safari ignores vibrate — noop */
      }
    }

    startTransition(async () => {
      try {
        const res = await fetch('/api/saved-camps', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ camp_id: campId, saved: next }),
        });
        if (res.status === 401) {
          setSaved(!next);
          setError(tSaved('loginToSave'));
          showToast(tSaved('loginToSave'), 'error');
          return;
        }
        if (!res.ok) {
          setSaved(!next);
          setError('error');
          showToast(tToast('saveFailed'), 'error');
          return;
        }
        if (next && campName) {
          showToast(tToast('saved', { name: campName }));
          // Optimistic activity insert — picked up by RecentActivityFeed.
          try {
            window.dispatchEvent(
              new CustomEvent('so-activity', {
                detail: {
                  id: 'local-' + Date.now(),
                  action: 'saved_camp',
                  target_id: campId,
                  target_name: campName,
                  created_at: new Date().toISOString(),
                },
              }),
            );
          } catch {
            /* CustomEvent unsupported — noop */
          }
        }
      } catch {
        setSaved(!next);
        setError('error');
        showToast(tToast('saveFailed'), 'error');
      }
    });
  };

  const sizeCls =
    size === 'sm'
      ? 'h-11 w-11 text-base'
      : size === 'lg'
        ? 'h-12 w-12 text-2xl'
        : 'h-11 w-11 text-xl';

  // Full-width button variant (used on camp detail page)
  if (fullWidth) {
    const label = saved
      ? labelWhenSaved ?? t('saved')
      : labelWhenUnsaved ?? t('save');
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={saved}
        aria-label={label}
        disabled={pending}
        className={
          'relative flex w-full min-h-11 items-center justify-center gap-2 rounded-2xl border border-cream-border bg-white px-4 py-3 text-sm font-black text-ink transition-[transform,background,border] duration-[var(--duration-micro)] ease-[var(--ease-premium)] hover:border-brand-purple/40 active:scale-[0.98] disabled:opacity-60'
        }
      >
        <span
          ref={popRef}
          aria-hidden
          className={
            'inline-block transition-transform ' +
            (saved ? 'text-gold' : 'text-muted')
          }
        >
          {saved ? '⭐' : '☆'}
        </span>
        <span>{label}</span>
        {burstKey > 0 && <SparkleBurst key={burstKey} />}
      </button>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={onClick}
        aria-pressed={saved}
        aria-label={saved ? t('saved') : t('save')}
        disabled={pending}
        className={
          'relative inline-flex shrink-0 items-center justify-center rounded-full transition-[transform,background] duration-[var(--duration-micro)] ease-[var(--ease-premium)] active:scale-[0.92] disabled:opacity-60 ' +
          sizeCls +
          ' ' +
          (saved
            ? 'text-gold hover:bg-gold/10'
            : 'text-muted hover:bg-ink/5 hover:text-ink')
        }
      >
        <span ref={popRef} aria-hidden className="inline-block">
          {saved ? '⭐' : '☆'}
        </span>
        {burstKey > 0 && <SparkleBurst key={burstKey} />}
      </button>
      {error && error !== 'error' ? (
        <span role="status" className="sr-only">
          {error}
        </span>
      ) : null}
    </>
  );
}

// 6 gold squares flung outward. Keyframe is .sparkle-fling in globals.css.
function SparkleBurst() {
  return (
    <span aria-hidden className="pointer-events-none absolute inset-0">
      {Array.from({ length: 6 }).map((_, i) => (
        <span
          key={i}
          className="sparkle-particle absolute left-1/2 top-1/2 h-1.5 w-1.5 rounded-sm bg-gold"
          style={
            {
              '--angle': `${i * 60}deg`,
              '--delay': `${i * 20}ms`,
            } as React.CSSProperties
          }
        />
      ))}
    </span>
  );
}

// Imperative toast. In-memory queue, no state, no portal — one shared host
// div pinned to the bottom. Respects reduced-motion via CSS duration tokens.
function showToast(msg: string, variant: 'success' | 'error' = 'success') {
  if (typeof document === 'undefined') return;
  const host = ensureToastHost();
  const el = document.createElement('div');
  el.className =
    'rounded-2xl px-4 py-3 text-sm font-semibold shadow-lg transition-all duration-[var(--duration-standard)] translate-y-3 opacity-0 pointer-events-auto ' +
    (variant === 'success' ? 'bg-ink text-white' : 'bg-red-600 text-white');
  el.textContent = msg;
  el.setAttribute('role', 'status');
  host.appendChild(el);
  requestAnimationFrame(() => {
    el.classList.remove('translate-y-3', 'opacity-0');
  });
  setTimeout(() => {
    el.classList.add('opacity-0');
    setTimeout(() => el.remove(), 300);
  }, 2000);
}

function ensureToastHost(): HTMLElement {
  let host = document.getElementById('so-toast-host');
  if (!host) {
    host = document.createElement('div');
    host.id = 'so-toast-host';
    host.className =
      'fixed bottom-24 left-0 right-0 z-[100] flex flex-col items-center gap-2 px-4 pointer-events-none';
    document.body.appendChild(host);
  }
  return host;
}
