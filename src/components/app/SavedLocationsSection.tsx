'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { AddressPicker, type GeoResult } from './AddressPicker';

type SavedLocation = {
  id: string;
  label: string;
  latitude: number | string;
  longitude: number | string;
  is_primary: boolean;
};

// DECISION: Client-side loads + mutations against /api/saved-locations so the
// "Distance from" panel can stay fresh without a full page refresh after each
// edit. Optimistic updates aren't worth the complexity here — locations are
// low-frequency edits and a loading spinner is fine.
export function SavedLocationsSection() {
  const t = useTranslations('app.settings.sections.locations');
  const [locations, setLocations] = useState<SavedLocation[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [adding, setAdding] = useState(false);
  const [label, setLabel] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    const res = await fetch('/api/saved-locations');
    if (!res.ok) {
      setError(`${res.status}`);
      setLoaded(true);
      return;
    }
    const j = (await res.json()) as { locations: SavedLocation[] };
    setLocations(j.locations ?? []);
    setLoaded(true);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = async (picked: GeoResult) => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch('/api/saved-locations', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          label: label.trim() || 'Home',
          latitude: picked.latitude,
          longitude: picked.longitude,
        }),
      });
      if (!res.ok) {
        setError(`${res.status}`);
        return;
      }
      setLabel('');
      setAdding(false);
      await load();
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm(t('deleteConfirm'))) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/saved-locations/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        setError(`${res.status}`);
        return;
      }
      await load();
    } finally {
      setBusy(false);
    }
  };

  const makePrimary = async (id: string) => {
    setBusy(true);
    try {
      const res = await fetch(`/api/saved-locations/${id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ is_primary: true }),
      });
      if (!res.ok) {
        setError(`${res.status}`);
        return;
      }
      await load();
    } finally {
      setBusy(false);
    }
  };

  return (
    <section
      className="rounded-3xl border border-cream-border bg-white p-5"
      aria-labelledby="settings-locations-title"
    >
      <h2
        id="settings-locations-title"
        className="text-xs font-black uppercase tracking-wider text-muted"
      >
        {t('title')}
      </h2>
      <p className="mt-1 text-sm text-muted">{t('body')}</p>
      <p className="mt-1 text-[11px] italic text-muted">{t('privacyNote')}</p>

      {loaded && locations.length === 0 ? (
        <p className="mt-3 rounded-xl border border-cream-border bg-cream px-3 py-2 text-xs text-muted">
          {t('empty')}
        </p>
      ) : null}

      {locations.length > 0 ? (
        <ul className="mt-3 space-y-2">
          {locations.map((l) => {
            const lat = typeof l.latitude === 'string' ? Number(l.latitude) : l.latitude;
            const lng = typeof l.longitude === 'string' ? Number(l.longitude) : l.longitude;
            return (
              <li
                key={l.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-cream-border bg-cream px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-sm font-bold text-ink">
                    {l.label}
                    {l.is_primary ? (
                      <span className="rounded-full bg-brand-purple px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white">
                        {t('primaryBadge')}
                      </span>
                    ) : null}
                  </p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted">
                    {Number.isFinite(lat) ? lat.toFixed(3) : '—'},{' '}
                    {Number.isFinite(lng) ? lng.toFixed(3) : '—'}
                  </p>
                </div>
                <div className="flex gap-2">
                  {!l.is_primary ? (
                    <button
                      type="button"
                      onClick={() => makePrimary(l.id)}
                      disabled={busy}
                      className="rounded-full border border-cream-border bg-white px-3 py-1 text-[11px] font-black text-ink hover:border-brand-purple/40 disabled:opacity-50"
                    >
                      {t('makePrimary')}
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => remove(l.id)}
                    disabled={busy}
                    className="rounded-full border border-cream-border bg-white px-3 py-1 text-[11px] font-black text-ink hover:border-red-500/40 hover:text-red-600 disabled:opacity-50"
                  >
                    {t('delete')}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}

      {adding ? (
        <div className="mt-4 space-y-3 rounded-2xl border border-cream-border bg-cream px-3 py-3">
          <label className="block text-[11px] font-black uppercase tracking-wider text-muted">
            {t('addLabel')}
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder={t('addPlaceholder')}
              className="mt-1 w-full rounded-xl border border-cream-border bg-white px-3 py-2 text-sm text-ink"
            />
          </label>
          <AddressPicker
            labels={{
              addressLabel: t('addressLabel'),
              addressPlaceholder: t('addressPlaceholder'),
              findButton: t('findButton'),
              finding: t('finding'),
              pickResult: t('pickResult'),
              findError: t('findError'),
              noResults: t('noResults'),
            }}
            onPick={save}
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setAdding(false);
                setLabel('');
              }}
              className="rounded-full border border-cream-border bg-white px-3 py-1 text-[11px] font-black text-ink"
            >
              {t('cancel')}
            </button>
            {locations.length === 0 ? (
              <span className="text-[11px] italic text-muted">{t('firstIsPrimary')}</span>
            ) : null}
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="mt-4 rounded-full border border-dashed border-brand-purple/40 bg-white px-4 py-2 text-xs font-bold text-brand-purple hover:bg-purple-soft"
        >
          {t('add')}
        </button>
      )}

      {error ? (
        <p role="alert" className="mt-2 text-xs font-bold text-red-600">
          {error}
        </p>
      ) : null}
    </section>
  );
}
