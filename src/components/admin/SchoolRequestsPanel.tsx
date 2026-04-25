'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

export type AdminSchoolRequest = {
  id: string;
  user_id: string | null;
  requested_name: string;
  city: string | null;
  notes: string | null;
  status: 'pending' | 'researching' | 'added' | 'rejected';
  reviewed_by: string | null;
  reviewed_at: string | null;
  linked_school_id: string | null;
  created_at: string;
  users: { display_name: string | null; email: string | null } | null;
};

export type SchoolOption = { id: string; name: string };

const statusStyle: Record<AdminSchoolRequest['status'], string> = {
  pending: 'bg-gold/30 text-ink',
  researching: 'bg-blue-100 text-blue-900',
  added: 'bg-emerald-100 text-emerald-900',
  rejected: 'bg-cream-border text-muted',
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

export function SchoolRequestsPanel({
  initialRequests,
  schools,
}: {
  initialRequests: AdminSchoolRequest[];
  schools: SchoolOption[];
}) {
  const [requests, setRequests] = useState(initialRequests);
  const [linkChoice, setLinkChoice] = useState<Record<string, string>>({});
  const [pending, start] = useTransition();
  const [busy, setBusy] = useState<string | null>(null);
  const router = useRouter();

  if (requests.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-cream-border bg-white p-8 text-center text-sm text-muted">
        No school requests yet. They land here when a parent types a school
        we don&apos;t have and taps &quot;+ Add&quot;.
      </p>
    );
  }

  const update = async (
    id: string,
    body: {
      status: AdminSchoolRequest['status'];
      linked_school_id?: string | null;
    },
  ) => {
    setBusy(id);
    try {
      const res = await fetch(
        `/api/admin/school-requests/${encodeURIComponent(id)}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        },
      );
      if (!res.ok) return;
      const json = (await res.json()) as { request: AdminSchoolRequest };
      setRequests((rs) => rs.map((r) => (r.id === id ? { ...r, ...json.request } : r)));
      start(() => router.refresh());
    } finally {
      setBusy(null);
    }
  };

  return (
    <ul className="space-y-3" data-testid="school-requests-panel">
      {requests.map((r) => {
        const submitter =
          r.users?.display_name ?? r.users?.email ?? (r.user_id ? 'logged-in user' : 'anonymous');
        const choice = linkChoice[r.id] ?? '';
        const isBusy = busy === r.id || pending;
        return (
          <li
            key={r.id}
            className="rounded-2xl border border-cream-border bg-white p-4"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={
                  'inline-flex rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ' +
                  statusStyle[r.status]
                }
              >
                {r.status}
              </span>
              <h3 className="text-base font-black text-ink">🏫 {r.requested_name}</h3>
              <span className="ml-auto text-xs text-muted">{relative(r.created_at)}</span>
            </div>
            <dl className="mt-2 grid gap-2 text-xs md:grid-cols-3">
              <div>
                <dt className="font-bold text-muted">From</dt>
                <dd className="text-ink">{submitter}</dd>
              </div>
              {r.city ? (
                <div>
                  <dt className="font-bold text-muted">City</dt>
                  <dd className="text-ink">{r.city}</dd>
                </div>
              ) : null}
              {r.linked_school_id ? (
                <div>
                  <dt className="font-bold text-muted">Linked to</dt>
                  <dd className="text-ink">
                    {schools.find((s) => s.id === r.linked_school_id)?.name ?? r.linked_school_id}
                  </dd>
                </div>
              ) : null}
            </dl>
            {r.notes ? (
              <p className="mt-3 whitespace-pre-wrap rounded-xl bg-cream/70 p-3 text-sm text-ink">
                {r.notes}
              </p>
            ) : null}

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={isBusy || r.status === 'researching'}
                onClick={() => update(r.id, { status: 'researching' })}
                className="min-h-9 rounded-full bg-blue-600 px-3 py-1.5 text-xs font-black text-white hover:bg-blue-700 disabled:opacity-50"
              >
                Mark researching
              </button>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={choice}
                  onChange={(e) =>
                    setLinkChoice((prev) => ({ ...prev, [r.id]: e.target.value }))
                  }
                  className="rounded-xl border border-cream-border bg-cream px-2 py-1.5 text-xs text-ink focus:border-brand-purple focus:outline-none"
                  aria-label="Link to existing school"
                >
                  <option value="">Pick existing school…</option>
                  {schools.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={isBusy || !choice}
                  onClick={() =>
                    update(r.id, { status: 'added', linked_school_id: choice })
                  }
                  className="min-h-9 rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-black text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  Mark added
                </button>
              </div>

              <button
                type="button"
                disabled={isBusy || r.status === 'rejected'}
                onClick={() => update(r.id, { status: 'rejected' })}
                className="min-h-9 rounded-full border border-cream-border bg-white px-3 py-1.5 text-xs font-black text-muted hover:border-red-500/40 hover:text-red-600 disabled:opacity-50"
              >
                Reject
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
