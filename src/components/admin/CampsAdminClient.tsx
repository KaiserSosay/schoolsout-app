'use client';

import { Fragment, useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

export type AdminCamp = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  ages_min: number;
  ages_max: number;
  price_tier: '$' | '$$' | '$$$';
  categories: string[];
  website_url: string | null;
  image_url: string | null;
  neighborhood: string | null;
  address: string | null;
  phone: string | null;
  latitude: number | string | null;
  longitude: number | string | null;
  hours_start: string | null;
  hours_end: string | null;
  before_care_offered: boolean;
  before_care_start: string | null;
  before_care_price_cents: number | null;
  after_care_offered: boolean;
  after_care_end: string | null;
  after_care_price_cents: number | null;
  closed_on_holidays: boolean;
  verified: boolean;
  logistics_verified: boolean;
  is_featured: boolean;
  is_launch_partner: boolean;
  launch_partner_until: string | null;
  created_at: string;
  clicks30d: number;
  savesCount: number;
};

function toTime(v: string | null): string {
  return v ? v.slice(0, 5) : '';
}

export function CampsAdminClient({ camps }: { camps: AdminCamp[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [filterVerified, setFilterVerified] = useState<'all' | 'yes' | 'no'>('all');
  const [filterLP, setFilterLP] = useState<'all' | 'yes' | 'no'>('all');
  const [category, setCategory] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [openId, setOpenId] = useState<string | null>(null);

  const allCategories = useMemo(() => {
    const s = new Set<string>();
    for (const c of camps) for (const cat of c.categories ?? []) s.add(cat);
    return Array.from(s).sort();
  }, [camps]);

  const rows = useMemo(() => {
    let list = camps;
    if (filterVerified !== 'all') {
      list = list.filter((c) => c.verified === (filterVerified === 'yes'));
    }
    if (filterLP !== 'all') {
      list = list.filter((c) => c.is_launch_partner === (filterLP === 'yes'));
    }
    if (category) list = list.filter((c) => c.categories.includes(category));
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) => c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q),
      );
    }
    return list;
  }, [camps, filterVerified, filterLP, category, search]);

  const toggleLaunchPartner = async (camp: AdminCamp) => {
    const res = await fetch(`/api/admin/camps/${camp.slug}/toggle-launch-partner`, {
      method: 'POST',
    });
    if (!res.ok) {
      alert(`Toggle failed: ${res.status}`);
      return;
    }
    startTransition(() => router.refresh());
  };

  const quickFlip = async (camp: AdminCamp, key: 'verified' | 'logistics_verified' | 'is_featured') => {
    const res = await fetch(`/api/admin/camps/${camp.slug}/edit`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ [key]: !camp[key] }),
    });
    if (!res.ok) {
      alert(`Flip failed: ${res.status}`);
      return;
    }
    startTransition(() => router.refresh());
  };

  const deleteCamp = async (camp: AdminCamp) => {
    if (!window.confirm(`Delete ${camp.name}? Cascades saves & clicks. Cannot be undone.`)) return;
    const res = await fetch(`/api/admin/camps/${camp.slug}/edit`, { method: 'DELETE' });
    if (!res.ok) {
      alert(`Delete failed: ${res.status}`);
      return;
    }
    startTransition(() => router.refresh());
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <Filter label="Verified" value={filterVerified} setValue={setFilterVerified} />
        <Filter label="Launch partner" value={filterLP} setValue={setFilterLP} />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-full border border-cream-border bg-white px-3 py-1.5 font-bold text-ink"
        >
          <option value="">All categories</option>
          {allCategories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <input
          type="search"
          placeholder="name / slug…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-full border border-cream-border bg-white px-3 py-1.5 text-sm text-ink placeholder:text-muted"
        />
        <span className="text-xs font-bold text-muted">
          {rows.length} / {camps.length}
          {pending ? ' · saving…' : ''}
        </span>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-cream-border bg-white">
        <table className="w-full text-xs">
          <thead className="text-left text-[10px] font-black uppercase tracking-wider text-muted">
            <tr className="border-b border-cream-border">
              <th className="p-3">Name</th>
              <th className="p-3">Slug</th>
              <th className="p-3">Categories</th>
              <th className="p-3">Ages</th>
              <th className="p-3">Price</th>
              <th className="p-3 text-center">Verified</th>
              <th className="p-3 text-center">Logistics</th>
              <th className="p-3 text-center">LP</th>
              <th className="p-3 text-center">Feat</th>
              <th className="p-3 text-center">Clicks 30d</th>
              <th className="p-3 text-center">Saves</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={12} className="p-6 text-center text-muted">
                  No camps match filters.
                </td>
              </tr>
            ) : null}
            {rows.map((c) => {
              const isOpen = openId === c.id;
              return (
                <Fragment key={c.id}>
                  <tr
                    className={
                      'border-b border-cream-border transition-colors hover:bg-cream/30 ' +
                      (isOpen ? 'bg-cream/40' : '')
                    }
                  >
                    <td className="p-3 font-bold text-ink">
                      <button
                        type="button"
                        onClick={() => setOpenId(isOpen ? null : c.id)}
                        className="text-left hover:text-brand-purple"
                      >
                        {c.name}
                      </button>
                    </td>
                    <td className="p-3 text-muted">{c.slug}</td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1">
                        {c.categories.map((cat) => (
                          <span
                            key={cat}
                            className="rounded-full bg-brand-purple/10 px-1.5 py-0.5 text-[10px] font-black text-brand-purple"
                          >
                            {cat}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-3 text-muted">
                      {c.ages_min}-{c.ages_max}
                    </td>
                    <td className="p-3 text-ink">{c.price_tier}</td>
                    <Toggle value={c.verified} onClick={() => quickFlip(c, 'verified')} />
                    <Toggle
                      value={c.logistics_verified}
                      onClick={() => quickFlip(c, 'logistics_verified')}
                    />
                    <Toggle
                      value={c.is_launch_partner}
                      onClick={() => toggleLaunchPartner(c)}
                      title={c.launch_partner_until ? `expires ${new Date(c.launch_partner_until).toLocaleDateString()}` : undefined}
                    />
                    <Toggle value={c.is_featured} onClick={() => quickFlip(c, 'is_featured')} />
                    <td className="p-3 text-center text-ink">{c.clicks30d}</td>
                    <td className="p-3 text-center text-ink">{c.savesCount}</td>
                    <td className="p-3 text-right">
                      <button
                        type="button"
                        onClick={() => deleteCamp(c)}
                        className="rounded-full border border-red-300 bg-white px-2 py-1 text-[10px] font-black text-red-700 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                  {isOpen ? (
                    <tr className="bg-cream/30">
                      <td colSpan={12} className="p-4">
                        <CampEditor
                          camp={c}
                          onSaved={() => {
                            setOpenId(null);
                            startTransition(() => router.refresh());
                          }}
                        />
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Filter({
  label,
  value,
  setValue,
}: {
  label: string;
  value: 'all' | 'yes' | 'no';
  setValue: (v: 'all' | 'yes' | 'no') => void;
}) {
  return (
    <label className="inline-flex items-center gap-1">
      <span className="text-[10px] font-black uppercase tracking-wider text-muted">{label}</span>
      <select
        value={value}
        onChange={(e) => setValue(e.target.value as 'all' | 'yes' | 'no')}
        className="rounded-full border border-cream-border bg-white px-3 py-1.5 font-bold text-ink"
      >
        <option value="all">all</option>
        <option value="yes">yes</option>
        <option value="no">no</option>
      </select>
    </label>
  );
}

function Toggle({
  value,
  onClick,
  title,
}: {
  value: boolean;
  onClick: () => void;
  title?: string;
}) {
  return (
    <td className="p-3 text-center">
      <button
        type="button"
        onClick={onClick}
        title={title}
        className={
          'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-black ' +
          (value ? 'bg-emerald-100 text-emerald-900' : 'bg-ink/5 text-muted')
        }
      >
        {value ? 'yes' : 'no'}
      </button>
    </td>
  );
}

const inputCls =
  'mt-1 w-full rounded-md border border-cream-border bg-white px-2 py-1.5 text-sm text-ink';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-[10px] font-black uppercase tracking-wider text-muted">
      {label}
      {children}
    </label>
  );
}

function CampEditor({ camp, onSaved }: { camp: AdminCamp; onSaved: () => void }) {
  const [name, setName] = useState(camp.name);
  const [slug, setSlug] = useState(camp.slug);
  const [description, setDescription] = useState(camp.description ?? '');
  const [agesMin, setAgesMin] = useState(String(camp.ages_min));
  const [agesMax, setAgesMax] = useState(String(camp.ages_max));
  const [priceTier, setPriceTier] = useState<'$' | '$$' | '$$$'>(camp.price_tier);
  const [categories, setCategories] = useState((camp.categories ?? []).join(', '));
  const [website, setWebsite] = useState(camp.website_url ?? '');
  const [image, setImage] = useState(camp.image_url ?? '');
  const [neighborhood, setNeighborhood] = useState(camp.neighborhood ?? '');
  const [address, setAddress] = useState(camp.address ?? '');
  const [phone, setPhone] = useState(camp.phone ?? '');
  const [lat, setLat] = useState(camp.latitude != null ? String(camp.latitude) : '');
  const [lng, setLng] = useState(camp.longitude != null ? String(camp.longitude) : '');
  const [hStart, setHStart] = useState(toTime(camp.hours_start));
  const [hEnd, setHEnd] = useState(toTime(camp.hours_end));
  const [bcOffered, setBcOffered] = useState(camp.before_care_offered);
  const [bcStart, setBcStart] = useState(toTime(camp.before_care_start));
  const [acOffered, setAcOffered] = useState(camp.after_care_offered);
  const [acEnd, setAcEnd] = useState(toTime(camp.after_care_end));
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // react-hooks exhaustive-deps: intentionally re-init when camp id changes only
  useEffect(() => {
    setErr(null);
    setOk(null);
  }, [camp.id]);

  const save = async () => {
    setErr(null);
    setOk(null);
    setSaving(true);
    const body: Record<string, unknown> = {
      name,
      slug,
      description: description.trim() || null,
      ages_min: parseInt(agesMin, 10),
      ages_max: parseInt(agesMax, 10),
      price_tier: priceTier,
      categories: categories.split(',').map((c) => c.trim()).filter(Boolean),
      website_url: website.trim() || null,
      image_url: image.trim() || null,
      neighborhood: neighborhood.trim() || null,
      address: address.trim() || null,
      phone: phone.trim() || null,
      before_care_offered: bcOffered,
      after_care_offered: acOffered,
    };
    if (hStart) body.hours_start = hStart;
    if (hEnd) body.hours_end = hEnd;
    if (bcOffered && bcStart) body.before_care_start = bcStart;
    if (acOffered && acEnd) body.after_care_end = acEnd;
    const latN = Number(lat);
    const lngN = Number(lng);
    if (lat !== '' && Number.isFinite(latN)) body.latitude = latN;
    if (lng !== '' && Number.isFinite(lngN)) body.longitude = lngN;

    const res = await fetch(`/api/admin/camps/${camp.slug}/edit`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    setSaving(false);
    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      setErr(`${res.status}: ${j.error ?? 'failed'}`);
      return;
    }
    setOk('Saved');
    onSaved();
  };

  return (
    <div className="grid gap-3 md:grid-cols-3">
      <Field label="Name"><input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} /></Field>
      <Field label="Slug"><input value={slug} onChange={(e) => setSlug(e.target.value)} className={inputCls} /></Field>
      <Field label="Neighborhood"><input value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} className={inputCls} /></Field>

      <Field label="Ages min"><input type="number" value={agesMin} onChange={(e) => setAgesMin(e.target.value)} className={inputCls} /></Field>
      <Field label="Ages max"><input type="number" value={agesMax} onChange={(e) => setAgesMax(e.target.value)} className={inputCls} /></Field>
      <Field label="Price tier">
        <select value={priceTier} onChange={(e) => setPriceTier(e.target.value as '$' | '$$' | '$$$')} className={inputCls}>
          <option value="$">$</option><option value="$$">$$</option><option value="$$$">$$$</option>
        </select>
      </Field>

      <Field label="Categories"><input value={categories} onChange={(e) => setCategories(e.target.value)} className={inputCls} placeholder="sports, art, stem" /></Field>
      <Field label="Website"><input value={website} onChange={(e) => setWebsite(e.target.value)} className={inputCls} /></Field>
      <Field label="Image URL"><input value={image} onChange={(e) => setImage(e.target.value)} className={inputCls} /></Field>

      <Field label="Address"><input value={address} onChange={(e) => setAddress(e.target.value)} className={inputCls} /></Field>
      <Field label="Phone"><input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} /></Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Lat"><input value={lat} onChange={(e) => setLat(e.target.value)} className={inputCls} /></Field>
        <Field label="Lng"><input value={lng} onChange={(e) => setLng(e.target.value)} className={inputCls} /></Field>
      </div>

      <Field label="Hours start"><input type="time" value={hStart} onChange={(e) => setHStart(e.target.value)} className={inputCls} /></Field>
      <Field label="Hours end"><input type="time" value={hEnd} onChange={(e) => setHEnd(e.target.value)} className={inputCls} /></Field>
      <div />

      <label className="flex items-center gap-2 text-xs font-bold text-ink">
        <input type="checkbox" checked={bcOffered} onChange={(e) => setBcOffered(e.target.checked)} />
        Before-care offered
      </label>
      <Field label="Before-care start">
        <input type="time" value={bcStart} disabled={!bcOffered} onChange={(e) => setBcStart(e.target.value)} className={inputCls + ' disabled:opacity-40'} />
      </Field>
      <div />

      <label className="flex items-center gap-2 text-xs font-bold text-ink">
        <input type="checkbox" checked={acOffered} onChange={(e) => setAcOffered(e.target.checked)} />
        After-care offered
      </label>
      <Field label="After-care end">
        <input type="time" value={acEnd} disabled={!acOffered} onChange={(e) => setAcEnd(e.target.value)} className={inputCls + ' disabled:opacity-40'} />
      </Field>
      <div />

      <div className="md:col-span-3">
        <Field label="Description">
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className={inputCls} />
        </Field>
      </div>

      <div className="md:col-span-3 flex items-center gap-2">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="rounded-full bg-ink px-4 py-2 text-xs font-black text-cream hover:opacity-90 disabled:opacity-50"
        >
          Save all fields
        </button>
        {ok ? <span className="text-xs font-bold text-emerald-700">{ok}</span> : null}
        {err ? (
          <span role="alert" className="text-xs font-bold text-red-600">
            {err}
          </span>
        ) : null}
      </div>
    </div>
  );
}
