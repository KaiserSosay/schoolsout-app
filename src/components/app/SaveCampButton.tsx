'use client';

import { useState, useTransition, type MouseEvent } from 'react';
import { useTranslations } from 'next-intl';

// DECISION: Optimistic flip on click. /api/saved-camps already writes the
// kid_activity entry server-side, so we don't need to double-post. On 401
// (unauthenticated) we roll back the optimistic flip and show a toast — this
// can only happen if the session expired mid-session because SaveCampButton
// only renders inside the /app layout that already guards auth.
export function SaveCampButton({
  campId,
  initiallySaved,
  size = 'md',
  fullWidth = false,
  labelWhenSaved,
  labelWhenUnsaved,
}: {
  campId: string;
  // DECISION: campName is accepted so the component's API matches parent
  // expectations (CampCard, camp detail page), but we don't need it on the
  // client — server-side /api/saved-camps looks up the name itself when
  // writing kid_activity. Kept optional so callers don't have to thread it.
  campName?: string;
  initiallySaved: boolean;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  labelWhenSaved?: string;
  labelWhenUnsaved?: string;
}) {
  const t = useTranslations('app.camps');
  const tSaved = useTranslations('app.saved');
  const [saved, setSaved] = useState(initiallySaved);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const onClick = (e: MouseEvent) => {
    // Card is a <Link>; prevent navigation when clicking the star.
    e.preventDefault();
    e.stopPropagation();
    if (pending) return;

    const next = !saved;
    setSaved(next);
    setError(null);

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
          return;
        }
        if (!res.ok) {
          setSaved(!next);
          setError('error');
          return;
        }
      } catch {
        setSaved(!next);
        setError('error');
      }
    });
  };

  const sizeCls =
    size === 'sm'
      ? 'h-8 w-8 text-base'
      : size === 'lg'
        ? 'h-12 w-12 text-2xl'
        : 'h-10 w-10 text-xl';

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
          'flex w-full items-center justify-center gap-2 rounded-2xl border border-cream-border bg-white px-4 py-3 text-sm font-black text-ink transition-colors hover:border-brand-purple/40 disabled:opacity-60'
        }
      >
        <span aria-hidden className={saved ? 'text-gold' : 'text-muted'}>
          {saved ? '⭐' : '☆'}
        </span>
        <span>{label}</span>
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
          'flex shrink-0 items-center justify-center rounded-full transition-colors disabled:opacity-60 ' +
          sizeCls +
          ' ' +
          (saved
            ? 'text-gold hover:bg-gold/10'
            : 'text-muted hover:bg-ink/5 hover:text-ink')
        }
      >
        <span aria-hidden>{saved ? '⭐' : '☆'}</span>
      </button>
      {error && error !== 'error' ? (
        <span role="status" className="sr-only">
          {error}
        </span>
      ) : null}
    </>
  );
}
