// Data quality triage view for admins. Surfaces three buckets:
//   1. Camps missing an address (verified=true)
//   2. Camps missing a phone (verified=true)
//   3. Camps where last_verified_at is older than 60 days (verified=true)
//
// Server component — read-only. Editing flows through the existing
// Enrichment tab; rows here link to ?tab=enrichment for the inline
// editor and to /camps/[slug] for the public view.

import Link from 'next/link';

export type DataQualityCamp = {
  id: string;
  slug: string;
  name: string;
  address: string | null;
  phone: string | null;
  last_verified_at: string | null;
  data_completeness: number | null;
};

export type DataQualityData = {
  noAddress: DataQualityCamp[];
  noPhone: DataQualityCamp[];
  staleVerifications: DataQualityCamp[];
};

function fmtDate(iso: string | null): string {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    const yyyy = d.getUTCFullYear();
    const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(d.getUTCDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  } catch {
    return '—';
  }
}

function daysAgo(iso: string | null): string {
  if (!iso) return '—';
  try {
    const ms = Date.now() - new Date(iso).getTime();
    if (ms < 0) return '0d';
    const d = Math.floor(ms / 86400000);
    return `${d}d ago`;
  } catch {
    return '—';
  }
}

export function DataQualityPanel({
  locale,
  data,
}: {
  locale: string;
  data: DataQualityData;
}) {
  return (
    <div className="space-y-8">
      <Section
        title={`Camps needing addresses (${data.noAddress.length})`}
        helper="Verified camps with no address. Parents can't get directions or filter by neighborhood."
        emptyMsg="No verified camps are missing an address."
        rows={data.noAddress}
        locale={locale}
        showField="phone"
      />

      <Section
        title={`Camps needing phones (${data.noPhone.length})`}
        helper="Verified camps with no phone number. Parents can't call to ask questions."
        emptyMsg="No verified camps are missing a phone."
        rows={data.noPhone}
        locale={locale}
        showField="address"
      />

      <Section
        title={`Stale verifications (${data.staleVerifications.length})`}
        helper="Camps where last_verified_at is older than 60 days. Re-verify the website + hours."
        emptyMsg="All verified camps are fresh (< 60 days)."
        rows={data.staleVerifications}
        locale={locale}
        showField="lastVerified"
      />
    </div>
  );
}

function Section({
  title,
  helper,
  emptyMsg,
  rows,
  locale,
  showField,
}: {
  title: string;
  helper: string;
  emptyMsg: string;
  rows: DataQualityCamp[];
  locale: string;
  showField: 'phone' | 'address' | 'lastVerified';
}) {
  return (
    <section>
      <h3 className="text-sm font-black text-ink">{title}</h3>
      <p className="text-xs text-muted">{helper}</p>
      {rows.length === 0 ? (
        <p className="mt-2 text-xs text-emerald-700">{emptyMsg}</p>
      ) : (
        <div className="mt-3 overflow-hidden rounded-2xl border border-cream-border bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-cream/60 text-[11px] font-black uppercase tracking-wider text-muted">
              <tr>
                <th scope="col" className="px-3 py-2">Camp</th>
                <th scope="col" className="px-3 py-2">
                  {showField === 'phone'
                    ? 'Phone'
                    : showField === 'address'
                      ? 'Address'
                      : 'Last verified'}
                </th>
                <th scope="col" className="px-3 py-2">Completeness</th>
                <th scope="col" className="px-3 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-border">
              {rows.map((c) => (
                <tr key={c.id}>
                  <td className="px-3 py-2 font-bold text-ink">{c.name}</td>
                  <td className="px-3 py-2 text-muted">
                    {showField === 'phone'
                      ? (c.phone ?? '—')
                      : showField === 'address'
                        ? (c.address ?? '—')
                        : (
                          <span title={fmtDate(c.last_verified_at)}>
                            {daysAgo(c.last_verified_at)}
                          </span>
                        )}
                  </td>
                  <td className="px-3 py-2 text-muted">
                    {c.data_completeness !== null
                      ? `${Math.round((c.data_completeness ?? 0) * 100)}%`
                      : '—'}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <Link
                      href={`/${locale}/admin?tab=enrichment#camp-${c.slug}`}
                      className="mr-2 inline-flex items-center rounded-full bg-brand-purple px-3 py-1 text-[11px] font-bold text-white hover:bg-brand-purple/90"
                    >
                      Edit
                    </Link>
                    <Link
                      href={`/${locale}/camps/${c.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center rounded-full border border-cream-border bg-white px-3 py-1 text-[11px] font-bold text-ink hover:border-brand-purple/40"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
