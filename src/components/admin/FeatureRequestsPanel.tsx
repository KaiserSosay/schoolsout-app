'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

export type AdminFeatureRequest = {
  id: string;
  user_id: string | null;
  email: string | null;
  category: 'idea' | 'bug' | 'love' | 'question';
  body: string;
  page_path: string | null;
  locale: string;
  status: 'new' | 'acknowledged' | 'in_progress' | 'shipped' | 'wont_do';
  admin_response: string | null;
  admin_responded_at: string | null;
  created_at: string;
  users: { display_name: string | null; email: string | null } | null;
};

const categoryEmoji: Record<AdminFeatureRequest['category'], string> = {
  idea: '💡',
  bug: '🐛',
  love: '❤️',
  question: '❓',
};

const statusStyle: Record<AdminFeatureRequest['status'], string> = {
  new: 'bg-gold/30 text-ink',
  acknowledged: 'bg-purple-soft text-brand-purple',
  in_progress: 'bg-blue-100 text-blue-900',
  shipped: 'bg-emerald-100 text-emerald-900',
  wont_do: 'bg-cream-border text-muted',
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

export function FeatureRequestsPanel({
  initialRequests,
}: {
  initialRequests: AdminFeatureRequest[];
}) {
  const [requests, setRequests] = useState(initialRequests);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialRequests[0]?.id ?? null,
  );

  const selected = requests.find((r) => r.id === selectedId) ?? null;

  const onUpdated = (updated: AdminFeatureRequest) => {
    setRequests((rs) => rs.map((r) => (r.id === updated.id ? updated : r)));
  };

  if (requests.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-cream-border bg-white p-8 text-center text-sm text-muted">
        No new feedback. When a parent sends you an idea it lands here.
      </p>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-[380px_1fr]">
      <ul className="max-h-[70vh] overflow-auto rounded-2xl border border-cream-border bg-white">
        {requests.map((r) => {
          const isSel = r.id === selectedId;
          const submitter = r.users?.display_name ?? r.users?.email ?? r.email ?? 'anon';
          return (
            <li key={r.id}>
              <button
                type="button"
                onClick={() => setSelectedId(r.id)}
                className={
                  'flex w-full flex-col gap-1 border-b border-cream-border px-3 py-3 text-left transition-colors ' +
                  (isSel ? 'bg-purple-soft' : 'hover:bg-cream/70')
                }
              >
                <div className="flex items-center gap-2">
                  <span aria-hidden>{categoryEmoji[r.category]}</span>
                  <span
                    className={
                      'inline-flex rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ' +
                      statusStyle[r.status]
                    }
                  >
                    {r.status.replace('_', ' ')}
                  </span>
                  <span className="ml-auto text-[10px] text-muted">
                    {relative(r.created_at)}
                  </span>
                </div>
                <p className="line-clamp-2 text-sm font-semibold text-ink">
                  {r.body.slice(0, 120)}
                </p>
                <p className="truncate text-[11px] text-muted">
                  {submitter} · {r.locale}
                </p>
              </button>
            </li>
          );
        })}
      </ul>

      {selected ? (
        <DetailPane request={selected} onUpdated={onUpdated} />
      ) : (
        <p className="rounded-2xl border border-cream-border bg-white p-8 text-sm text-muted">
          Select a feedback item to respond.
        </p>
      )}
    </div>
  );
}

function DetailPane({
  request,
  onUpdated,
}: {
  request: AdminFeatureRequest;
  onUpdated: (r: AdminFeatureRequest) => void;
}) {
  const [response, setResponse] = useState(request.admin_response ?? '');
  const [pending, start] = useTransition();
  const router = useRouter();
  const [toast, setToast] = useState<string | null>(null);

  const submitter =
    request.users?.display_name ?? request.users?.email ?? request.email ?? '—';

  const call = async (
    patch: Partial<{
      status: AdminFeatureRequest['status'];
      admin_response: string;
      send_reply: boolean;
    }>,
  ) => {
    setToast(null);
    const res = await fetch(
      `/api/admin/feature-requests/${encodeURIComponent(request.id)}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      },
    );
    if (!res.ok) {
      setToast('Update failed. Check the logs.');
      return;
    }
    const body = await res.json();
    onUpdated({ ...request, ...body.request });
    setToast(body.emailSent ? 'Saved. Reply email sent.' : 'Saved.');
    start(() => router.refresh());
  };

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-cream-border bg-white p-5">
      <header className="flex flex-wrap items-center gap-2">
        <span
          className={
            'inline-flex rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ' +
            statusStyle[request.status]
          }
        >
          {request.status.replace('_', ' ')}
        </span>
        <span className="text-xs font-bold text-muted">{request.locale}</span>
        <span className="text-xs text-muted">{relative(request.created_at)}</span>
      </header>
      <blockquote className="rounded-2xl border-l-4 border-brand-purple bg-cream/70 p-4 text-sm text-ink">
        {request.body}
      </blockquote>
      <dl className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <dt className="font-bold text-muted">From</dt>
          <dd className="text-ink">{submitter}</dd>
        </div>
        <div>
          <dt className="font-bold text-muted">Email</dt>
          <dd>
            {request.email ? (
              <a href={`mailto:${request.email}`} className="text-brand-purple underline">
                {request.email}
              </a>
            ) : (
              <span className="text-muted">—</span>
            )}
          </dd>
        </div>
        {request.page_path ? (
          <div className="col-span-2">
            <dt className="font-bold text-muted">Submitted from</dt>
            <dd>
              <a
                href={request.page_path}
                target="_blank"
                rel="noreferrer"
                className="text-brand-purple underline"
              >
                {request.page_path}
              </a>
            </dd>
          </div>
        ) : null}
      </dl>

      <div>
        <label
          htmlFor={`response-${request.id}`}
          className="block text-xs font-bold text-ink"
        >
          Your reply (sent via email when you use a reply-triggering action)
        </label>
        <textarea
          id={`response-${request.id}`}
          value={response}
          onChange={(e) => setResponse(e.target.value.slice(0, 1000))}
          rows={5}
          className="mt-1 w-full resize-none rounded-2xl border border-cream-border p-3 text-sm text-ink focus:border-brand-purple focus:outline-none"
          placeholder="I read this yesterday — here's what I'm going to do…"
        />
        <div className="mt-1 text-right text-[11px] text-muted">
          {response.length} / 1000
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <ActionButton
          onClick={() => call({ status: 'acknowledged', admin_response: response || undefined })}
          disabled={pending}
          color="purple"
        >
          Acknowledge
        </ActionButton>
        <ActionButton
          onClick={() =>
            call({
              status: 'in_progress',
              admin_response: response,
              send_reply: true,
            })
          }
          disabled={pending || !response.trim() || !request.email}
          color="gold"
        >
          Reply &amp; mark in progress
        </ActionButton>
        <ActionButton
          onClick={() =>
            call({
              status: 'shipped',
              admin_response: response || undefined,
              send_reply: Boolean(response.trim() && request.email),
            })
          }
          disabled={pending}
          color="emerald"
        >
          Mark shipped
        </ActionButton>
        <ActionButton
          onClick={() =>
            call({
              status: 'wont_do',
              admin_response: response || undefined,
              send_reply: Boolean(response.trim() && request.email),
            })
          }
          disabled={pending}
          color="muted"
        >
          Won&apos;t do
        </ActionButton>
      </div>

      {toast ? (
        <p className="rounded-xl bg-cream/70 px-3 py-2 text-xs font-semibold text-ink">
          {toast}
        </p>
      ) : null}
    </div>
  );
}

function ActionButton({
  children,
  onClick,
  disabled,
  color,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  color: 'purple' | 'gold' | 'emerald' | 'muted';
}) {
  const bg =
    color === 'purple'
      ? 'bg-brand-purple text-white hover:bg-brand-purple/90'
      : color === 'gold'
        ? 'bg-gold text-ink hover:bg-gold/90'
        : color === 'emerald'
          ? 'bg-emerald-600 text-white hover:bg-emerald-700'
          : 'border border-cream-border bg-white text-muted hover:border-muted';
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={
        'min-h-10 rounded-full px-3 py-1.5 text-xs font-black transition-colors disabled:opacity-50 ' +
        bg
      }
    >
      {children}
    </button>
  );
}
