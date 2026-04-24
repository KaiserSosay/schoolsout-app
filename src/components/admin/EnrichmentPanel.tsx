'use client';

import { useMemo, useState } from 'react';
import { computeCompleteness, bandFor } from '@/lib/camps/completeness';

export type EnrichmentCamp = {
  id: string;
  slug: string;
  name: string;
  phone: string | null;
  address: string | null;
  website_url: string | null;
  ages_min: number | null;
  ages_max: number | null;
  hours_start: string | null;
  hours_end: string | null;
  price_min_cents: number | null;
  price_max_cents: number | null;
  description: string | null;
  categories: string[] | null;
  registration_url: string | null;
  registration_deadline: string | null;
  last_verified_at: string | null;
  last_enriched_at: string | null;
  data_completeness: number | null;
  missing_fields: string[] | null;
};

type SortKey = 'completeness' | 'name' | 'last_enriched_at';
type SortDir = 'asc' | 'desc';

// Admin enrichment dashboard — shows camps below 100% completeness with
// the fields still missing. Inline edit is scoped to the free-form text
// fields the script can't always grab (description, registration URL)
// and to dates/times typed manually. Bulk re-run isn't wired in this
// commit — placeholder button calls the enrichment API endpoint (TODO).
export function EnrichmentPanel({
  initialCamps,
}: {
  initialCamps: EnrichmentCamp[];
}) {
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({
    key: 'completeness',
    dir: 'asc',
  });
  const [query, setQuery] = useState('');

  const rows = useMemo(() => {
    const filtered = query
      ? initialCamps.filter((c) =>
          c.name.toLowerCase().includes(query.toLowerCase()),
        )
      : initialCamps;
    const scored = filtered.map((c) => {
      const computed = computeCompleteness(c);
      return { ...c, _score: computed.score, _missing: computed.missing };
    });
    return scored
      .filter((c) => c._score < 1.0)
      .sort((a, b) => {
        if (sort.key === 'name') {
          const cmp = a.name.localeCompare(b.name);
          return sort.dir === 'asc' ? cmp : -cmp;
        }
        if (sort.key === 'last_enriched_at') {
          const av = a.last_enriched_at ?? '';
          const bv = b.last_enriched_at ?? '';
          const cmp = av.localeCompare(bv);
          return sort.dir === 'asc' ? cmp : -cmp;
        }
        return sort.dir === 'asc'
          ? a._score - b._score
          : b._score - a._score;
      });
  }, [initialCamps, sort, query]);

  const bump = (key: SortKey) =>
    setSort((s) =>
      s.key === key
        ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' }
        : { key, dir: 'asc' },
    );

  return (
    <div className="space-y-4">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-sm font-black text-ink">
            Camps below 100% ({rows.length})
          </h3>
          <p className="text-xs text-muted">
            Sorted by the lowest data-completeness score. Parent browse
            surfaces &lt;70% as &quot;Limited info — help us verify.&quot;
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="search"
            placeholder="Filter by name…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-9 w-48 rounded-full border border-cream-border bg-white px-3 text-xs text-ink placeholder:text-muted focus:border-brand-purple focus:outline-none"
          />
          <button
            type="button"
            onClick={() => alert('TODO: wire /api/admin/enrichment/run')}
            className="h-9 rounded-full border border-cream-border bg-white px-3 text-xs font-bold text-ink hover:border-brand-purple/40"
            title="Runs scripts/enrich-camps.ts against visible rows"
          >
            Re-run enrichment
          </button>
        </div>
      </header>

      <div className="overflow-x-auto rounded-2xl border border-cream-border bg-white">
        <table className="min-w-full text-xs">
          <thead className="bg-cream/60 text-muted">
            <tr>
              <Th label="Name" onClick={() => bump('name')} />
              <Th label="Score" onClick={() => bump('completeness')} />
              <Th label="Missing" />
              <Th label="Last enriched" onClick={() => bump('last_enriched_at')} />
              <th className="px-3 py-2 text-right font-bold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-cream-border">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-muted">
                  {query
                    ? 'No camps match that filter.'
                    : 'Every camp is 100% complete. 🎉'}
                </td>
              </tr>
            ) : (
              rows.map((c) => <Row key={c.id} camp={c} />)
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({ label, onClick }: { label: string; onClick?: () => void }) {
  return (
    <th className="px-3 py-2 text-left font-bold">
      {onClick ? (
        <button
          type="button"
          onClick={onClick}
          className="hover:text-ink"
          aria-label={`Sort by ${label}`}
        >
          {label}
        </button>
      ) : (
        label
      )}
    </th>
  );
}

function Row({
  camp,
}: {
  camp: EnrichmentCamp & { _score: number; _missing: string[] };
}) {
  const band = bandFor(camp._score);
  const pct = Math.round(camp._score * 100);
  const pillCls =
    band === 'limited'
      ? 'bg-amber-100 text-amber-900 border-amber-300'
      : 'bg-cream text-ink border-cream-border';
  return (
    <tr>
      <td className="px-3 py-2 align-top">
        <div className="font-bold text-ink">{camp.name}</div>
        <div className="text-[11px] text-muted">{camp.slug}</div>
      </td>
      <td className="px-3 py-2 align-top">
        <span
          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-bold ${pillCls}`}
        >
          {pct}%
        </span>
      </td>
      <td className="px-3 py-2 align-top text-muted">
        {camp._missing.length === 0 ? '—' : camp._missing.join(', ')}
      </td>
      <td className="px-3 py-2 align-top text-muted">
        {camp.last_enriched_at
          ? new Date(camp.last_enriched_at).toLocaleDateString()
          : '—'}
      </td>
      <td className="px-3 py-2 text-right align-top">
        <a
          href={`/en/app/camps/${camp.slug}`}
          target="_blank"
          rel="noreferrer"
          className="text-brand-purple hover:underline"
        >
          View →
        </a>
      </td>
    </tr>
  );
}
