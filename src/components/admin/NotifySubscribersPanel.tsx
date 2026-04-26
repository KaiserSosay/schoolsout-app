'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

// Round-3 admin surface for the notify-me feature shipped last session.
// Lists every school that has pending school_calendar_notifications rows
// and exposes a one-click "Email N parents now" button per school. POSTs
// /api/admin/schools/notify-calendar-verified, which sends the batch and
// stamps notified_at on each row.
//
// Lives at the top of the calendar-reviews tab on /admin so the workflow
// is: review → verify the calendar → flip status → click here to email
// the parents who asked.

export type PendingSchoolBlock = {
  schoolId: string;
  slug: string;
  name: string;
  pendingCount: number;
  calendarStatus: string;
};

export function NotifySubscribersPanel({
  schools,
}: {
  schools: PendingSchoolBlock[];
}) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ schoolId: string; sent: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  if (schools.length === 0) return null;

  async function notify(s: PendingSchoolBlock) {
    setBusyId(s.schoolId);
    setError(null);
    setFeedback(null);
    try {
      const res = await fetch(
        '/api/admin/schools/notify-calendar-verified',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ school_id: s.schoolId }),
        },
      );
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        setError(`${res.status}: ${j.error ?? 'failed'}`);
        return;
      }
      const j = (await res.json()) as { sent: number };
      setFeedback({ schoolId: s.schoolId, sent: j.sent });
      startTransition(() => router.refresh());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'network error');
    } finally {
      setBusyId(null);
    }
  }

  const isVerified = (s: string) => s.startsWith('verified');

  return (
    <section className="rounded-3xl border-2 border-emerald-300 bg-emerald-50 p-5 md:p-6">
      <h2 className="text-base font-black text-emerald-900 md:text-lg">
        🔔 Calendar verifications — parents waiting
      </h2>
      <p className="mt-1 text-xs text-emerald-900/80">
        Each school below has parents who tapped &ldquo;Notify me&rdquo; on the
        unverified-calendar placeholder. Once the calendar status flips to
        verified, send them the &ldquo;your school&apos;s calendar is now
        live&rdquo; email.
      </p>
      <ul className="mt-4 space-y-3">
        {schools.map((s) => (
          <li
            key={s.schoolId}
            className="flex flex-col gap-2 rounded-2xl border border-emerald-300 bg-white p-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="text-sm font-black text-ink">{s.name}</p>
              <p className="text-xs text-muted">
                {s.pendingCount} parent{s.pendingCount === 1 ? '' : 's'} waiting
                {' · '}
                status:{' '}
                <span
                  className={
                    isVerified(s.calendarStatus)
                      ? 'font-bold text-emerald-700'
                      : 'font-bold text-amber-700'
                  }
                >
                  {s.calendarStatus}
                </span>
              </p>
            </div>
            <button
              type="button"
              onClick={() => notify(s)}
              disabled={
                busyId === s.schoolId || !isVerified(s.calendarStatus)
              }
              title={
                !isVerified(s.calendarStatus)
                  ? "Calendar isn't verified yet — flip status first"
                  : undefined
              }
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-ink px-4 py-2 text-sm font-black text-cream hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {busyId === s.schoolId
                ? 'Sending…'
                : `Email ${s.pendingCount} parent${s.pendingCount === 1 ? '' : 's'} now`}
            </button>
          </li>
        ))}
      </ul>
      {feedback ? (
        <p className="mt-3 rounded-xl border border-emerald-300 bg-white px-3 py-2 text-sm font-bold text-emerald-800">
          ✓ Sent {feedback.sent} email{feedback.sent === 1 ? '' : 's'}.
        </p>
      ) : null}
      {error ? (
        <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-800">
          {error}
        </p>
      ) : null}
    </section>
  );
}
