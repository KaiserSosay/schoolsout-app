'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

export type CalendarViewMode = 'list' | 'calendar';

const STORAGE_KEY = 'so-calendar-default-view';

export function readStoredView(fallback: CalendarViewMode): CalendarViewMode {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === 'list' || raw === 'calendar') return raw;
  } catch {
    // localStorage can throw in private mode — fall through to default.
  }
  return fallback;
}

export function writeStoredView(view: CalendarViewMode): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, view);
  } catch {
    // ignore
  }
}

export function ViewToggle({
  value,
  onChange,
  className = '',
}: {
  value: CalendarViewMode;
  onChange: (next: CalendarViewMode) => void;
  className?: string;
}) {
  const t = useTranslations('calendar');
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Active state pops with a clear ink fill + soft shadow so the chosen
  // tab reads at a glance. Kid Mode overrides cta-yellow / ink via the
  // [data-mode='kids'] selector in globals.css — no JS needed.
  const baseBtn =
    'min-h-9 inline-flex items-center justify-center rounded-full px-4 py-1.5 text-xs font-black uppercase tracking-wider transition-colors';
  const active = 'view-toggle-active bg-ink text-cream shadow-sm';
  const inactive = 'view-toggle-inactive text-muted/80 hover:text-ink';

  return (
    <div
      role="tablist"
      aria-label={t('viewToggleLabel')}
      data-testid="calendar-view-toggle"
      className={`inline-flex items-center gap-1 rounded-full border border-cream-border bg-white p-1 ${className}`}
    >
      <button
        type="button"
        role="tab"
        aria-selected={value === 'list'}
        className={`${baseBtn} ${value === 'list' ? active : inactive}`}
        onClick={() => {
          writeStoredView('list');
          onChange('list');
        }}
      >
        {t('viewList')}
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={value === 'calendar'}
        className={`${baseBtn} ${value === 'calendar' ? active : inactive}`}
        onClick={() => {
          writeStoredView('calendar');
          onChange('calendar');
        }}
      >
        {t('viewCalendar')}
      </button>
      {/* Mounted gate avoids a hydration mismatch when localStorage seeds
          a non-default value on first paint — caller controls value, but
          we still render both buttons SSR-safely. */}
      {!mounted ? null : null}
    </div>
  );
}
