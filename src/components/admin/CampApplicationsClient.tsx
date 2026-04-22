'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

export type AdminCampApplication = {
  id: string;
  camp_name: string;
  website: string;
  ages: string;
  neighborhood: string;
  email: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  reviewed_at: string | null;
  notes: string | null;
};

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 60);
}

function parseAges(raw: string): { min: number; max: number } {
  // Typical inputs: "5-12", "K-8", "4 to 14", "ages 6-11".
  const nums = raw.match(/\d+/g)?.map((n) => parseInt(n, 10)) ?? [];
  if (nums.length >= 2) return { min: Math.min(...nums), max: Math.max(...nums) };
  if (nums.length === 1) return { min: nums[0], max: nums[0] + 5 };
  return { min: 5, max: 14 };
}

export function CampApplicationsClient({ apps }: { apps: AdminCampApplication[] }) {
  return (
    <div className="space-y-3">
      {apps.length === 0 ? (
        <p className="text-sm text-muted">No applications yet.</p>
      ) : null}
      {apps.map((a) => (
        <ApplicationRow key={a.id} app={a} />
      ))}
    </div>
  );
}

function StatusPill({ status }: { status: AdminCampApplication['status'] }) {
  const cls =
    status === 'pending'
      ? 'bg-yellow-100 text-yellow-900'
      : status === 'approved'
        ? 'bg-emerald-100 text-emerald-900'
        : 'bg-red-100 text-red-900';
  return (
    <span
      className={
        'inline-flex rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ' + cls
      }
    >
      {status}
    </span>
  );
}

function ApplicationRow({ app }: { app: AdminCampApplication }) {
  const router = useRouter();
  const [mode, setMode] = useState<'none' | 'approve' | 'reject'>('none');
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const ages = parseAges(app.ages);
  const [name, setName] = useState(app.camp_name);
  const [slug, setSlug] = useState(slugify(app.camp_name));
  const [description, setDescription] = useState('');
  const [agesMin, setAgesMin] = useState(String(ages.min));
  const [agesMax, setAgesMax] = useState(String(ages.max));
  const [priceTier, setPriceTier] = useState<'$' | '$$' | '$$$'>('$$');
  const [categories, setCategories] = useState('');
  const [website, setWebsite] = useState(app.website);
  const [neighborhood, setNeighborhood] = useState(app.neighborhood);

  const [reason, setReason] = useState('');

  const submitApprove = async () => {
    setErr(null);
    setOk(null);
    const min = parseInt(agesMin, 10);
    const max = parseInt(agesMax, 10);
    if (!name || !slug || !Number.isFinite(min) || !Number.isFinite(max)) {
      setErr('fill name, slug, ages');
      return;
    }
    const body = {
      camp_data: {
        name,
        slug,
        description: description.trim() || null,
        ages_min: min,
        ages_max: max,
        price_tier: priceTier,
        categories: categories.split(',').map((c) => c.trim()).filter(Boolean),
        website_url: website.trim() || null,
        neighborhood: neighborhood.trim() || null,
      },
    };
    const res = await fetch(`/api/admin/camp-applications/${app.id}/approve`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      setErr(`${res.status}: ${j.error ?? 'failed'}`);
      return;
    }
    setOk('Approved. Applicant emailed.');
    setMode('none');
    startTransition(() => router.refresh());
  };

  const submitReject = async () => {
    setErr(null);
    setOk(null);
    const res = await fetch(`/api/admin/camp-applications/${app.id}/reject`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ reason: reason || undefined }),
    });
    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      setErr(`${res.status}: ${j.error ?? 'failed'}`);
      return;
    }
    setOk('Rejected. Applicant emailed.');
    setMode('none');
    startTransition(() => router.refresh());
  };

  return (
    <section className="rounded-2xl border border-cream-border bg-white p-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-black text-ink">{app.camp_name}</h3>
          <p className="text-xs text-muted">
            {app.neighborhood} · ages {app.ages} ·{' '}
            <a href={app.website} target="_blank" rel="noopener noreferrer" className="underline">
              {app.website}
            </a>{' '}
            · from {app.email}
          </p>
          <p className="text-[11px] text-muted">
            applied {new Date(app.created_at).toLocaleDateString('en-US')}{' '}
            {app.reviewed_at ? '· reviewed ' + new Date(app.reviewed_at).toLocaleDateString('en-US') : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatusPill status={app.status} />
          {app.status === 'pending' ? (
            <>
              <button
                type="button"
                onClick={() => setMode(mode === 'approve' ? 'none' : 'approve')}
                className="rounded-full bg-ink px-3 py-1.5 text-[11px] font-black text-cream hover:opacity-90"
              >
                Approve
              </button>
              <button
                type="button"
                onClick={() => setMode(mode === 'reject' ? 'none' : 'reject')}
                className="rounded-full border border-cream-border bg-white px-3 py-1.5 text-[11px] font-black text-red-700 hover:border-red-300"
              >
                Reject
              </button>
            </>
          ) : null}
        </div>
      </header>

      {app.notes ? (
        <p className="mt-2 rounded-lg bg-cream p-2 text-xs text-muted">
          <span className="font-black text-ink">Note:</span> {app.notes}
        </p>
      ) : null}

      {mode === 'approve' ? (
        <div className="mt-4 grid gap-3 rounded-xl border border-cream-border bg-cream/50 p-4 md:grid-cols-2">
          <Field label="Camp name">
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Slug">
            <input value={slug} onChange={(e) => setSlug(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Website URL">
            <input value={website} onChange={(e) => setWebsite(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Neighborhood">
            <input value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Ages min">
            <input value={agesMin} onChange={(e) => setAgesMin(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Ages max">
            <input value={agesMax} onChange={(e) => setAgesMax(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Price tier">
            <select
              value={priceTier}
              onChange={(e) => setPriceTier(e.target.value as '$' | '$$' | '$$$')}
              className={inputCls}
            >
              <option value="$">$</option>
              <option value="$$">$$</option>
              <option value="$$$">$$$</option>
            </select>
          </Field>
          <Field label="Categories (comma-separated)">
            <input
              value={categories}
              onChange={(e) => setCategories(e.target.value)}
              placeholder="sports, art, stem"
              className={inputCls}
            />
          </Field>
          <div className="md:col-span-2">
            <Field label="Description">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className={inputCls}
              />
            </Field>
          </div>
          <div className="flex items-center gap-2 md:col-span-2">
            <button
              type="button"
              onClick={submitApprove}
              disabled={pending}
              className="rounded-full bg-brand-purple px-4 py-2 text-xs font-black text-white hover:brightness-110 disabled:opacity-50"
            >
              Approve & create camp
            </button>
            <button
              type="button"
              onClick={() => setMode('none')}
              className="rounded-full border border-cream-border bg-white px-4 py-2 text-xs font-black text-ink"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      {mode === 'reject' ? (
        <div className="mt-4 space-y-2 rounded-xl border border-cream-border bg-cream/50 p-4">
          <Field label="Reason (optional — included in the rejection email)">
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className={inputCls}
            />
          </Field>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={submitReject}
              disabled={pending}
              className="rounded-full bg-red-700 px-4 py-2 text-xs font-black text-white hover:brightness-110 disabled:opacity-50"
            >
              Send rejection
            </button>
            <button
              type="button"
              onClick={() => setMode('none')}
              className="rounded-full border border-cream-border bg-white px-4 py-2 text-xs font-black text-ink"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      {ok ? <p className="mt-2 text-xs font-bold text-emerald-700">{ok}</p> : null}
      {err ? (
        <p role="alert" className="mt-2 text-xs font-bold text-red-600">
          {err}
        </p>
      ) : null}
    </section>
  );
}

const inputCls =
  'mt-1 w-full rounded-md border border-cream-border bg-white px-2 py-1.5 text-sm text-ink';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-[11px] font-black uppercase tracking-wider text-muted">
      {label}
      {children}
    </label>
  );
}
