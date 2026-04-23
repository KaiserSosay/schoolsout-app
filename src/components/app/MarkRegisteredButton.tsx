'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { focusRing } from '@/lib/links';

// Small client button that flips user_plans.registered=true. Opens the
// registration URL in a new tab first so the parent can confirm before
// we commit — if the tab doesn't open, they still get the mark action.
export function MarkRegisteredButton({
  planId,
  registrationUrl,
}: {
  planId: string;
  registrationUrl: string | null;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState(false);

  const click = async () => {
    if (registrationUrl) {
      window.open(registrationUrl, '_blank', 'noopener');
    }
    setErr(false);
    const res = await fetch('/api/plans', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan_id: planId, registered: true }),
    });
    if (!res.ok) {
      setErr(true);
      return;
    }
    start(() => router.refresh());
  };

  return (
    <button
      type="button"
      onClick={click}
      disabled={pending}
      className={
        'min-h-10 rounded-full bg-gold px-3 py-1.5 text-xs font-black text-ink hover:brightness-105 disabled:opacity-60 ' +
        focusRing
      }
    >
      {err ? 'Retry mark registered' : 'Mark registered'}
    </button>
  );
}
