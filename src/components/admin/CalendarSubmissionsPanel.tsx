'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Phase 4.7.1 — admin review tab for public calendar submissions. Sort
// already applied server-side: domain-verified first, then created_at desc.

export type AdminCalendarSubmission = {
  id: string;
  school_id: string;
  submitter_email: string;
  submitter_name: string | null;
  submitter_role: 'principal' | 'teacher' | 'office_manager' | 'parent' | 'other';
  proposed_updates: string;
  notes: string | null;
  domain_verified: boolean;
  status: 'pending' | 'approved' | 'rejected' | 'incorporated';
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  created_at: string;
  school: { slug: string; name: string } | null;
};

const ROLE_LABEL: Record<AdminCalendarSubmission['submitter_role'], string> = {
  principal: 'Principal',
  teacher: 'Teacher',
  office_manager: 'Office manager',
  parent: 'Parent',
  other: 'Other',
};

const STATUS_STYLE: Record<AdminCalendarSubmission['status'], string> = {
  pending: 'bg-gold/30 text-ink',
  approved: 'bg-blue-100 text-blue-900',
  rejected: 'bg-cream-border text-muted',
  incorporated: 'bg-emerald-100 text-emerald-900',
};

function relative(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(ts).toLocaleDateString();
}

export function CalendarSubmissionsPanel({
  locale,
  initialSubmissions,
}: {
  locale: string;
  initialSubmissions: AdminCalendarSubmission[];
}) {
  const [submissions, setSubmissions] = useState(initialSubmissions);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();

  if (submissions.length === 0) {
    return (
      <p
        data-testid="calendar-submissions-empty"
        className="rounded-2xl border border-dashed border-cream-border bg-white p-8 text-center text-sm text-muted"
      >
        No public calendar submissions yet. Parents and school staff can send
        updates from any school detail page.
      </p>
    );
  }

  const flip = async (
    id: string,
    status: AdminCalendarSubmission['status'],
  ) => {
    setBusy(id);
    try {
      const res = await fetch(
        `/api/admin/calendar-submissions/${encodeURIComponent(id)}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        },
      );
      if (!res.ok) return;
      const json = (await res.json()) as { submission: AdminCalendarSubmission };
      setSubmissions((rows) =>
        rows.map((r) => (r.id === id ? { ...r, ...json.submission } : r)),
      );
      start(() => router.refresh());
    } finally {
      setBusy(null);
    }
  };

  return (
    <ul className="space-y-3" data-testid="calendar-submissions-panel">
      {submissions.map((s) => {
        const isOpen = expanded[s.id] ?? false;
        const isBusy = busy === s.id || pending;
        const isPending = s.status === 'pending';
        return (
          <li
            key={s.id}
            data-testid={`submission-row-${s.id}`}
            className={
              'rounded-2xl border bg-white p-4 ' +
              (s.domain_verified
                ? 'border-emerald-300'
                : 'border-cream-border')
            }
          >
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={
                  'inline-flex rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ' +
                  STATUS_STYLE[s.status]
                }
              >
                {s.status}
              </span>
              {s.domain_verified ? (
                <span
                  data-testid="domain-verified-pill"
                  className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-900"
                  title="Email domain matches the school's website"
                >
                  ✓ Domain verified
                </span>
              ) : null}
              <h3 className="text-base font-black text-ink">
                {s.school?.name ?? 'Unknown school'}
              </h3>
              {s.school?.slug ? (
                <span className="text-xs font-bold text-muted">
                  {s.school.slug}
                </span>
              ) : null}
              <span className="ml-auto text-xs text-muted">
                {relative(s.created_at)}
              </span>
            </div>

            <dl className="mt-2 grid gap-2 text-xs md:grid-cols-3">
              <div>
                <dt className="font-bold text-muted">From</dt>
                <dd className="text-ink">
                  {s.submitter_name ? `${s.submitter_name} · ` : ''}
                  <a
                    href={`mailto:${s.submitter_email}`}
                    className="underline hover:text-brand-purple"
                  >
                    {s.submitter_email}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="font-bold text-muted">Role</dt>
                <dd className="text-ink">{ROLE_LABEL[s.submitter_role]}</dd>
              </div>
              <div>
                <dt className="font-bold text-muted">Posted</dt>
                <dd className="text-ink">
                  {new Date(s.created_at).toLocaleString()}
                </dd>
              </div>
            </dl>

            <div className="mt-3">
              <button
                type="button"
                data-testid={`toggle-updates-${s.id}`}
                onClick={() =>
                  setExpanded((p) => ({ ...p, [s.id]: !isOpen }))
                }
                aria-expanded={isOpen}
                className="text-xs font-bold text-brand-purple hover:underline"
              >
                {isOpen ? 'Hide proposed updates ▴' : 'Show proposed updates ▾'}
              </button>
              {isOpen ? (
                <div className="mt-2 space-y-2">
                  <p
                    data-testid={`proposed-updates-${s.id}`}
                    className="whitespace-pre-wrap rounded-xl bg-cream/70 p-3 text-sm text-ink"
                  >
                    {s.proposed_updates}
                  </p>
                  {s.notes ? (
                    <p className="whitespace-pre-wrap rounded-xl bg-cream/40 p-3 text-xs text-muted">
                      <span className="font-bold text-ink">Notes: </span>
                      {s.notes}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={isBusy || s.status === 'approved'}
                onClick={() => flip(s.id, 'approved')}
                className="min-h-9 rounded-full bg-blue-600 px-3 py-1.5 text-xs font-black text-white hover:bg-blue-700 disabled:opacity-50"
              >
                Mark approved
              </button>
              <button
                type="button"
                disabled={isBusy || s.status === 'incorporated'}
                onClick={() => flip(s.id, 'incorporated')}
                className="min-h-9 rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-black text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                Mark incorporated
              </button>
              <button
                type="button"
                disabled={isBusy || s.status === 'rejected'}
                onClick={() => flip(s.id, 'rejected')}
                className="min-h-9 rounded-full border border-cream-border bg-white px-3 py-1.5 text-xs font-black text-muted hover:border-red-500/40 hover:text-red-600 disabled:opacity-50"
              >
                Mark rejected
              </button>
              {s.school?.slug ? (
                <Link
                  href={`/${locale}/schools/${s.school.slug}`}
                  className="min-h-9 rounded-full border border-brand-purple/40 bg-purple-soft px-3 py-1.5 text-xs font-black text-brand-purple hover:border-brand-purple"
                >
                  View school →
                </Link>
              ) : null}
              {!isPending && s.reviewed_at ? (
                <span className="ml-auto text-[11px] font-bold text-muted">
                  reviewed {relative(s.reviewed_at)}
                </span>
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
