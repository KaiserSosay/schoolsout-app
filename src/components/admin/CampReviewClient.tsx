'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

export type AdminCampRow = {
  id: string;
  name: string;
  neighborhood: string | null;
  phone: string | null;
  address: string | null;
  hours_start: string | null;
  hours_end: string | null;
  before_care_offered: boolean;
  before_care_start: string | null;
  after_care_offered: boolean;
  after_care_end: string | null;
  latitude: number | string | null;
  longitude: number | string | null;
  logistics_verified: boolean;
};

export function CampReviewClient({ camps }: { camps: AdminCampRow[] }) {
  if (camps.length === 0) {
    return (
      <p className="text-sm text-muted">
        No camps with <code>logistics_verified=false</code>. Nice work.
      </p>
    );
  }
  return (
    <div className="space-y-6">
      {camps.map((c) => (
        <CampRow key={c.id} camp={c} />
      ))}
    </div>
  );
}

function toTime(v: string | null): string {
  if (!v) return '';
  // hh:mm:ss → hh:mm for <input type=time>
  return v.slice(0, 5);
}

function CampRow({ camp }: { camp: AdminCampRow }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const [address, setAddress] = useState(camp.address ?? '');
  const [phone, setPhone] = useState(camp.phone ?? '');
  const [hStart, setHStart] = useState(toTime(camp.hours_start));
  const [hEnd, setHEnd] = useState(toTime(camp.hours_end));
  const [bcOffered, setBcOffered] = useState(camp.before_care_offered);
  const [bcStart, setBcStart] = useState(toTime(camp.before_care_start));
  const [acOffered, setAcOffered] = useState(camp.after_care_offered);
  const [acEnd, setAcEnd] = useState(toTime(camp.after_care_end));
  const [lat, setLat] = useState(
    camp.latitude != null ? String(camp.latitude) : '',
  );
  const [lng, setLng] = useState(
    camp.longitude != null ? String(camp.longitude) : '',
  );

  const submit = async (mark_verified: boolean) => {
    setErr(null);
    setOk(null);
    const body: Record<string, unknown> = { camp_id: camp.id, mark_verified };
    if (address.trim() !== (camp.address ?? '')) body.address = address.trim() || null;
    if (phone.trim() !== (camp.phone ?? '')) body.phone = phone.trim() || null;
    if (hStart) body.hours_start = hStart;
    if (hEnd) body.hours_end = hEnd;
    body.before_care_offered = bcOffered;
    if (bcOffered && bcStart) body.before_care_start = bcStart;
    body.after_care_offered = acOffered;
    if (acOffered && acEnd) body.after_care_end = acEnd;
    const latN = Number(lat);
    const lngN = Number(lng);
    if (lat !== '' && Number.isFinite(latN)) body.latitude = latN;
    if (lng !== '' && Number.isFinite(lngN)) body.longitude = lngN;

    const res = await fetch('/api/admin/camps/update', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setErr(`${res.status}: ${(j as { error?: string }).error ?? 'failed'}`);
      return;
    }
    setOk(mark_verified ? 'Saved & verified' : 'Saved');
    startTransition(() => router.refresh());
  };

  return (
    <section className="rounded-2xl border border-cream-border bg-white p-5">
      <header className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-black text-ink">{camp.name}</h3>
          <p className="text-xs text-muted">
            {camp.neighborhood ?? '—'} ·{' '}
            <span className={camp.logistics_verified ? 'text-emerald-700' : 'text-muted'}>
              {camp.logistics_verified ? 'verified' : 'pending'}
            </span>
          </p>
        </div>
      </header>
      <div className="grid gap-2 md:grid-cols-2">
        <label className="text-xs font-bold text-muted">
          Address
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="mt-1 w-full rounded-md border border-cream-border bg-cream px-2 py-1.5 text-sm text-ink"
          />
        </label>
        <label className="text-xs font-bold text-muted">
          Phone
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="mt-1 w-full rounded-md border border-cream-border bg-cream px-2 py-1.5 text-sm text-ink"
          />
        </label>
        <label className="text-xs font-bold text-muted">
          Hours start
          <input
            type="time"
            value={hStart}
            onChange={(e) => setHStart(e.target.value)}
            className="mt-1 w-full rounded-md border border-cream-border bg-cream px-2 py-1.5 text-sm text-ink"
          />
        </label>
        <label className="text-xs font-bold text-muted">
          Hours end
          <input
            type="time"
            value={hEnd}
            onChange={(e) => setHEnd(e.target.value)}
            className="mt-1 w-full rounded-md border border-cream-border bg-cream px-2 py-1.5 text-sm text-ink"
          />
        </label>
        <label className="flex items-center gap-2 text-xs font-bold text-ink">
          <input
            type="checkbox"
            checked={bcOffered}
            onChange={(e) => setBcOffered(e.target.checked)}
          />
          Before-care offered
        </label>
        <label className="text-xs font-bold text-muted">
          Before-care start
          <input
            type="time"
            value={bcStart}
            disabled={!bcOffered}
            onChange={(e) => setBcStart(e.target.value)}
            className="mt-1 w-full rounded-md border border-cream-border bg-cream px-2 py-1.5 text-sm text-ink disabled:opacity-50"
          />
        </label>
        <label className="flex items-center gap-2 text-xs font-bold text-ink">
          <input
            type="checkbox"
            checked={acOffered}
            onChange={(e) => setAcOffered(e.target.checked)}
          />
          After-care offered
        </label>
        <label className="text-xs font-bold text-muted">
          After-care end
          <input
            type="time"
            value={acEnd}
            disabled={!acOffered}
            onChange={(e) => setAcEnd(e.target.value)}
            className="mt-1 w-full rounded-md border border-cream-border bg-cream px-2 py-1.5 text-sm text-ink disabled:opacity-50"
          />
        </label>
        <label className="text-xs font-bold text-muted">
          Latitude
          <input
            type="text"
            value={lat}
            onChange={(e) => setLat(e.target.value)}
            className="mt-1 w-full rounded-md border border-cream-border bg-cream px-2 py-1.5 text-sm text-ink"
          />
        </label>
        <label className="text-xs font-bold text-muted">
          Longitude
          <input
            type="text"
            value={lng}
            onChange={(e) => setLng(e.target.value)}
            className="mt-1 w-full rounded-md border border-cream-border bg-cream px-2 py-1.5 text-sm text-ink"
          />
        </label>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => submit(false)}
          disabled={pending}
          className="rounded-full border border-cream-border bg-white px-3 py-1.5 text-[11px] font-black text-ink disabled:opacity-50"
        >
          Save draft
        </button>
        <button
          type="button"
          onClick={() => submit(true)}
          disabled={pending}
          className="rounded-full bg-ink px-3 py-1.5 text-[11px] font-black text-cream hover:opacity-90 disabled:opacity-50"
        >
          Save &amp; mark verified
        </button>
        {ok ? <span className="text-xs font-bold text-emerald-700">{ok}</span> : null}
        {err ? (
          <span role="alert" className="text-xs font-bold text-red-600">
            {err}
          </span>
        ) : null}
      </div>
    </section>
  );
}
