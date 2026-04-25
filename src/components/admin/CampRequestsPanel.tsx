'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

export type AdminCampRequest = {
  id: string;
  // Legacy short-form fields (always populated).
  camp_name: string;
  website: string;
  ages: string;
  neighborhood: string;
  email: string;
  status:
    | 'pending'
    | 'approved'
    | 'rejected'
    | 'denied'
    | 'payment_sent'
    | 'paid'
    | 'active';
  created_at: string;
  reviewed_at: string | null;
  notes: string | null;
  // New extended fields (populated when submitted via /list-your-camp).
  submitted_by_email: string | null;
  submitted_by_name: string | null;
  business_name: string | null;
  phone: string | null;
  address: string | null;
  age_min: number | null;
  age_max: number | null;
  description: string | null;
  categories: string[] | null;
  price_min_cents: number | null;
  price_max_cents: number | null;
  admin_notes: string | null;
  linked_camp_id: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
};

const statusStyle: Record<AdminCampRequest['status'], string> = {
  pending: 'bg-gold/30 text-ink',
  approved: 'bg-emerald-100 text-emerald-900',
  rejected: 'bg-cream-border text-muted',
  denied: 'bg-red-100 text-red-900',
  payment_sent: 'bg-blue-100 text-blue-900',
  paid: 'bg-brand-purple text-white',
  active: 'bg-emerald-600 text-white',
};

function relative(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${Math.max(0, mins)}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 60);
}

export function CampRequestsPanel({
  initialRequests,
}: {
  initialRequests: AdminCampRequest[];
}) {
  const [requests, setRequests] = useState(initialRequests);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialRequests[0]?.id ?? null,
  );
  const selected = requests.find((r) => r.id === selectedId) ?? null;

  const onUpdated = (updated: AdminCampRequest) => {
    setRequests((rs) => rs.map((r) => (r.id === updated.id ? updated : r)));
  };

  if (requests.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-cream-border bg-white p-8 text-center text-sm text-muted">
        No pending camp requests. Share{' '}
        <code className="rounded bg-cream px-1">/list-your-camp</code> to get operators in the door.
      </p>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-[380px_1fr]">
      <ul className="max-h-[70vh] overflow-auto rounded-2xl border border-cream-border bg-white">
        {requests.map((r) => {
          const isSel = r.id === selectedId;
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
                <p className="truncate text-sm font-semibold text-ink">
                  {r.business_name ?? r.camp_name}
                </p>
                <p className="truncate text-[11px] text-muted">
                  {r.camp_name} · {r.submitted_by_email ?? r.email}
                </p>
              </button>
            </li>
          );
        })}
      </ul>

      {selected ? (
        <CampDetail request={selected} onUpdated={onUpdated} />
      ) : (
        <p className="rounded-2xl border border-cream-border bg-white p-8 text-sm text-muted">
          Select a camp request to review.
        </p>
      )}
    </div>
  );
}

function CampDetail({
  request,
  onUpdated,
}: {
  request: AdminCampRequest;
  onUpdated: (r: AdminCampRequest) => void;
}) {
  const [adminNotes, setAdminNotes] = useState(request.admin_notes ?? '');
  const [denyReason, setDenyReason] = useState('');
  const [slug, setSlug] = useState(slugify(request.camp_name));
  const [toast, setToast] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();

  const submitterEmail = request.submitted_by_email ?? request.email;

  const approve = async () => {
    setToast(null);
    const payload = {
      camp_data: {
        name: request.camp_name,
        slug,
        description: request.description ?? null,
        ages_min: request.age_min ?? 5,
        ages_max: request.age_max ?? 14,
        price_tier: '$$' as const,
        categories: request.categories ?? [],
        website_url: request.website || null,
        neighborhood: request.neighborhood || null,
      },
    };
    const res = await fetch(
      `/api/admin/camp-applications/${encodeURIComponent(request.id)}/approve`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      },
    );
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setToast(j.error === 'duplicate_slug' ? 'Slug already exists — edit it.' : 'Approve failed.');
      return;
    }
    const j = await res.json();
    onUpdated({ ...request, status: 'approved', linked_camp_id: j.camp_id });
    setToast('Approved. Camp created + operator emailed.');
    start(() => router.refresh());
  };

  const deny = async () => {
    setToast(null);
    const res = await fetch(
      `/api/admin/camp-applications/${encodeURIComponent(request.id)}/deny`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: denyReason || null, admin_notes: adminNotes || null }),
      },
    );
    if (!res.ok) {
      setToast('Deny failed.');
      return;
    }
    onUpdated({ ...request, status: 'denied', admin_notes: adminNotes || null });
    setToast('Denied. Operator emailed.');
    start(() => router.refresh());
  };

  const sendPaymentLink = async () => {
    setToast(null);
    const res = await fetch(
      `/api/admin/camp-applications/${encodeURIComponent(request.id)}/payment-link`,
      { method: 'POST' },
    );
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setToast(
        j.error === 'stripe_not_configured'
          ? 'Stripe not configured — finish setup before approving operators.'
          : 'Payment link failed.',
      );
      return;
    }
    const j = await res.json();
    onUpdated({ ...request, status: 'payment_sent' });
    if (j.url && typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(j.url).catch(() => undefined);
    }
    setToast('Payment link sent to operator and copied to clipboard.');
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
        <span className="text-xs text-muted">{relative(request.created_at)}</span>
      </header>

      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div className="col-span-2">
          <dt className="text-[11px] font-bold text-muted uppercase">Business</dt>
          <dd className="font-bold text-ink">{request.business_name ?? '—'}</dd>
        </div>
        <div className="col-span-2">
          <dt className="text-[11px] font-bold text-muted uppercase">Camp</dt>
          <dd className="font-bold text-ink">{request.camp_name}</dd>
        </div>
        <div>
          <dt className="text-[11px] font-bold text-muted uppercase">Email</dt>
          <dd>
            <a
              href={`mailto:${submitterEmail}`}
              className="text-brand-purple underline"
            >
              {submitterEmail}
            </a>
          </dd>
        </div>
        <div>
          <dt className="text-[11px] font-bold text-muted uppercase">Phone</dt>
          <dd>{request.phone ?? '—'}</dd>
        </div>
        <div>
          <dt className="text-[11px] font-bold text-muted uppercase">Website</dt>
          <dd className="truncate">
            {request.website ? (
              <a
                href={request.website}
                target="_blank"
                rel="noreferrer"
                className="text-brand-purple underline"
              >
                {request.website}
              </a>
            ) : (
              '—'
            )}
          </dd>
        </div>
        <div>
          <dt className="text-[11px] font-bold text-muted uppercase">Ages</dt>
          <dd>
            {request.age_min != null && request.age_max != null
              ? `${request.age_min}–${request.age_max}`
              : request.ages || '—'}
          </dd>
        </div>
        <div className="col-span-2">
          <dt className="text-[11px] font-bold text-muted uppercase">Address</dt>
          <dd>{request.address ?? '—'}</dd>
        </div>
        <div>
          <dt className="text-[11px] font-bold text-muted uppercase">Neighborhood</dt>
          <dd>{request.neighborhood || '—'}</dd>
        </div>
        <div>
          <dt className="text-[11px] font-bold text-muted uppercase">Price</dt>
          <dd>
            {request.price_min_cents != null
              ? `$${(request.price_min_cents / 100).toFixed(0)}${request.price_max_cents ? ` – $${(request.price_max_cents / 100).toFixed(0)}` : ''}`
              : '—'}
          </dd>
        </div>
        {request.categories && request.categories.length > 0 ? (
          <div className="col-span-2">
            <dt className="text-[11px] font-bold text-muted uppercase">Categories</dt>
            <dd className="flex flex-wrap gap-1">
              {request.categories.map((c) => (
                <span
                  key={c}
                  className="rounded-full bg-purple-soft px-2 py-0.5 text-[11px] font-semibold text-brand-purple"
                >
                  {c}
                </span>
              ))}
            </dd>
          </div>
        ) : null}
        {request.description ? (
          <div className="col-span-2">
            <dt className="text-[11px] font-bold text-muted uppercase">Description</dt>
            <dd className="whitespace-pre-wrap text-sm text-ink">{request.description}</dd>
          </div>
        ) : null}
      </dl>

      {request.status === 'pending' ? (
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-ink">Slug (auto-derived, editable)</label>
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className="rounded-2xl border border-cream-border p-2 text-sm text-ink focus:border-brand-purple focus:outline-none"
          />
        </div>
      ) : null}

      <div>
        <label
          htmlFor={`notes-${request.id}`}
          className="block text-xs font-bold text-ink"
        >
          Admin notes (private)
        </label>
        <textarea
          id={`notes-${request.id}`}
          value={adminNotes}
          onChange={(e) => setAdminNotes(e.target.value)}
          rows={2}
          className="mt-1 w-full resize-none rounded-2xl border border-cream-border p-3 text-sm text-ink focus:border-brand-purple focus:outline-none"
        />
      </div>

      {request.status === 'pending' ? (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={approve}
            disabled={pending}
            className="min-h-10 rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-black text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            Approve &amp; create camp
          </button>
          <input
            value={denyReason}
            onChange={(e) => setDenyReason(e.target.value)}
            placeholder="Reason (optional, emailed)"
            className="min-w-[200px] flex-1 rounded-full border border-cream-border px-3 text-xs focus:border-brand-purple focus:outline-none"
          />
          <button
            type="button"
            onClick={deny}
            disabled={pending}
            className="min-h-10 rounded-full border border-red-300 bg-white px-3 py-1.5 text-xs font-black text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            Deny
          </button>
        </div>
      ) : null}

      {request.status === 'approved' ? (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={sendPaymentLink}
            disabled={pending}
            className="min-h-10 rounded-full bg-gold px-3 py-1.5 text-xs font-black text-ink hover:bg-gold/90 disabled:opacity-50"
          >
            Send payment link
          </button>
        </div>
      ) : null}

      {(request.status === 'paid' || request.status === 'active') &&
      request.stripe_customer_id ? (
        <p className="text-xs text-muted">
          Billing portal available via{' '}
          <code className="rounded bg-cream px-1">/api/admin/camp-applications/{request.id}/portal</code>{' '}
          (Goal 4).
        </p>
      ) : null}

      {toast ? (
        <p className="rounded-xl bg-cream/70 px-3 py-2 text-xs font-semibold text-ink">
          {toast}
        </p>
      ) : null}
    </div>
  );
}
