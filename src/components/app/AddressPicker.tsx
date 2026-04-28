'use client';

import { useState } from 'react';

// DECISION: Reusable address → geocode-results picker. Does NOT send the
// address itself to our server anywhere — it only calls /api/geocode which
// hits Nominatim upstream and returns coordinates + display_name. Consumers
// get lat/lng and an optional display_name back via `onPick`.

export type GeoResult = {
  display_name: string;
  latitude: number;
  longitude: number;
};

export function AddressPicker({
  labels,
  onPick,
  autoFocus,
}: {
  labels: {
    addressLabel: string;
    addressPlaceholder: string;
    findButton: string;
    finding: string;
    pickResult: string;
    findError: string;
    noResults: string;
  };
  onPick: (result: GeoResult) => void;
  autoFocus?: boolean;
}) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<GeoResult[]>([]);
  const [status, setStatus] = useState<'idle' | 'searching' | 'error' | 'empty' | 'ok'>('idle');

  const search = async () => {
    if (q.trim().length < 3 || status === 'searching') return;
    setStatus('searching');
    setResults([]);
    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(q.trim())}`);
      if (!res.ok) {
        setStatus('error');
        return;
      }
      const json = (await res.json()) as { results: GeoResult[] };
      if (!json.results || json.results.length === 0) {
        setStatus('empty');
        return;
      }
      setResults(json.results.slice(0, 3));
      setStatus('ok');
    } catch {
      setStatus('error');
    }
  };

  return (
    <div className="space-y-2">
      {/* Plain div — not a <form> — so this component nests safely inside
          another <form> (e.g. /list-your-camp). Enter inside the input still
          triggers search via the onKeyDown handler. */}
      <div className="flex gap-2">
        <label className="flex-1">
          <span className="sr-only">{labels.addressLabel}</span>
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                void search();
              }
            }}
            placeholder={labels.addressPlaceholder}
            autoFocus={autoFocus}
            className="w-full rounded-xl border border-cream-border bg-white px-3 py-2 text-sm text-ink focus:border-brand-purple focus:outline-none"
          />
        </label>
        <button
          type="button"
          onClick={() => void search()}
          disabled={q.trim().length < 3 || status === 'searching'}
          className="rounded-full bg-ink px-4 py-2 text-xs font-black text-cream hover:opacity-90 disabled:opacity-50"
        >
          {status === 'searching' ? labels.finding : labels.findButton}
        </button>
      </div>

      {status === 'error' ? (
        <p role="alert" className="text-xs font-bold text-red-600">
          {labels.findError}
        </p>
      ) : null}
      {status === 'empty' ? (
        <p className="text-xs text-muted">{labels.noResults}</p>
      ) : null}

      {results.length > 0 ? (
        <ul className="space-y-2">
          {results.map((r) => (
            <li
              key={`${r.latitude},${r.longitude}`}
              className="flex items-start gap-2 rounded-xl border border-cream-border bg-cream px-3 py-2 text-sm"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-ink">{r.display_name}</p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted">
                  {r.latitude.toFixed(3)}, {r.longitude.toFixed(3)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setResults([]);
                  setQ('');
                  setStatus('idle');
                  onPick(r);
                }}
                className="shrink-0 rounded-full bg-brand-purple px-3 py-1 text-[11px] font-black text-white hover:opacity-90"
              >
                {labels.pickResult}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
