'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { statusBadge, type SchoolStatus } from '@/lib/school-status';

type Closure = {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  emoji: string;
  status: 'ai_draft' | 'verified' | 'rejected';
  source: string;
};

type SchoolBlock = {
  id: string;
  name: string;
  district: string;
  calendar_status: SchoolStatus;
  drafts: Closure[];
  verifiedCount: number;
};

export function CalendarReviewClient({ schools }: { schools: SchoolBlock[] }) {
  if (schools.length === 0) {
    return <p className="text-sm text-muted">No schools loaded.</p>;
  }

  return (
    <div className="space-y-6">
      {schools.map((s) => (
        <SchoolBlockView key={s.id} school={s} />
      ))}
    </div>
  );
}

function SchoolBlockView({ school }: { school: SchoolBlock }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const badge = statusBadge(school.calendar_status);

  const call = async (url: string, body: unknown) => {
    setErr(null);
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setErr(`${res.status}: ${(j as { error?: string }).error ?? 'failed'}`);
      return false;
    }
    startTransition(() => router.refresh());
    return true;
  };

  const verify = (id: string) => call('/api/admin/closures/verify', { closure_id: id });
  const reject = (id: string) => {
    if (!window.confirm('Delete this draft closure?')) return Promise.resolve(false);
    return call('/api/admin/closures/reject', { closure_id: id });
  };
  const bulkVerify = () => {
    if (!window.confirm(`Verify all ${school.drafts.length} drafts for ${school.name}?`)) {
      return;
    }
    call('/api/admin/closures/bulk-verify', { school_id: school.id });
  };

  return (
    <section className="rounded-2xl border border-cream-border bg-white p-5">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span aria-hidden className="text-lg">
            {badge.emoji}
          </span>
          <div>
            <h3 className="text-sm font-black text-ink">{school.name}</h3>
            <p className="text-xs text-muted">
              {school.district} · status: <code>{school.calendar_status}</code> ·{' '}
              {school.verifiedCount} verified · {school.drafts.length} drafts
            </p>
          </div>
        </div>
        {school.drafts.length > 0 ? (
          <button
            type="button"
            onClick={bulkVerify}
            disabled={pending}
            className="rounded-full bg-ink px-3 py-1.5 text-[11px] font-black text-cream hover:opacity-90 disabled:opacity-50"
          >
            Bulk approve {school.drafts.length}
          </button>
        ) : null}
      </header>

      {school.drafts.length > 0 ? (
        <ul className="mt-4 divide-y divide-cream-border rounded-xl border border-cream-border">
          {school.drafts.map((c) => (
            <li key={c.id} className="flex flex-wrap items-center gap-3 p-3 text-sm">
              <span aria-hidden className="text-xl">
                {c.emoji}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold text-ink">{c.name}</p>
                <p className="text-xs text-muted">
                  {c.start_date} → {c.end_date} · source: {c.source}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => verify(c.id)}
                  disabled={pending}
                  className="rounded-full bg-emerald-600 px-3 py-1.5 text-[11px] font-black text-white hover:opacity-90 disabled:opacity-50"
                >
                  Approve
                </button>
                <button
                  type="button"
                  onClick={() => reject(c.id)}
                  disabled={pending}
                  className="rounded-full border border-cream-border bg-white px-3 py-1.5 text-[11px] font-black text-ink hover:border-red-500/40 hover:text-red-600 disabled:opacity-50"
                >
                  Reject
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      <AddClosureForm schoolId={school.id} onSaved={() => router.refresh()} />

      {err ? (
        <p role="alert" className="mt-2 text-xs font-bold text-red-600">
          {err}
        </p>
      ) : null}
    </section>
  );
}

function AddClosureForm({
  schoolId,
  onSaved,
}: {
  schoolId: string;
  onSaved: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [emoji, setEmoji] = useState('📅');
  const [status, setStatus] = useState<'idle' | 'saving' | 'error'>('idle');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !start || !end) return;
    setStatus('saving');
    const res = await fetch('/api/admin/closures/create', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        school_id: schoolId,
        name: name.trim(),
        start_date: start,
        end_date: end,
        emoji: emoji.trim() || '📅',
      }),
    });
    if (!res.ok) {
      setStatus('error');
      return;
    }
    setStatus('idle');
    setName('');
    setStart('');
    setEnd('');
    setEmoji('📅');
    setOpen(false);
    onSaved();
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-4 rounded-full border border-dashed border-brand-purple/40 bg-white px-4 py-2 text-xs font-bold text-brand-purple hover:bg-purple-soft"
      >
        + Add closure manually
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="mt-4 grid gap-2 rounded-xl border border-cream-border bg-cream p-3 md:grid-cols-5">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Name (e.g. Thanksgiving Break)"
        className="md:col-span-2 rounded-md border border-cream-border bg-white px-2 py-1.5 text-sm"
      />
      <input
        type="date"
        value={start}
        onChange={(e) => setStart(e.target.value)}
        className="rounded-md border border-cream-border bg-white px-2 py-1.5 text-sm"
      />
      <input
        type="date"
        value={end}
        onChange={(e) => setEnd(e.target.value)}
        className="rounded-md border border-cream-border bg-white px-2 py-1.5 text-sm"
      />
      <input
        type="text"
        value={emoji}
        onChange={(e) => setEmoji(e.target.value)}
        placeholder="📅"
        className="rounded-md border border-cream-border bg-white px-2 py-1.5 text-sm"
      />
      <div className="flex gap-2 md:col-span-5">
        <button
          type="submit"
          disabled={status === 'saving' || !name.trim() || !start || !end}
          className="rounded-full bg-ink px-3 py-1.5 text-[11px] font-black text-cream hover:opacity-90 disabled:opacity-50"
        >
          {status === 'saving' ? 'Saving…' : 'Save verified closure'}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-full border border-cream-border bg-white px-3 py-1.5 text-[11px] font-black text-ink"
        >
          Cancel
        </button>
        {status === 'error' ? (
          <span role="alert" className="text-xs font-bold text-red-600">
            Save failed
          </span>
        ) : null}
      </div>
    </form>
  );
}
