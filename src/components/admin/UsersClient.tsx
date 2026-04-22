'use client';

import { Fragment, useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

export type AdminUserRow = {
  id: string;
  email: string;
  display_name: string | null;
  preferred_language: string;
  role: string;
  coppa_consent_at: string;
  created_at: string;
  last_seen_at: string | null;
  kidCount: number;
  ageRanges: string[];
  activeReminders: number;
  savedCamps: number;
  isAdmin: boolean;
};

type Expanded = {
  kids: Array<{ school_name: string | null; age_range: string }>;
  saves: Array<{ name: string; slug: string }>;
  subs: Array<{ school_name: string | null; enabled: boolean; age_range: string }>;
  loading: boolean;
  error?: string;
};

function fmtDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function UsersClient({
  initialUsers,
  initialTotal,
  initialSearch,
}: {
  initialUsers: AdminUserRow[];
  initialTotal: number;
  initialSearch: string;
}) {
  const router = useRouter();
  const [users] = useState(initialUsers);
  const [total] = useState(initialTotal);
  const [search, setSearch] = useState(initialSearch);
  const [pending, startTransition] = useTransition();
  const [openId, setOpenId] = useState<string | null>(null);
  const [detail, setDetail] = useState<Record<string, Expanded>>({});

  // Debounced search via URL.
  useEffect(() => {
    const handle = setTimeout(() => {
      const u = new URL(window.location.href);
      if (search) u.searchParams.set('search', search);
      else u.searchParams.delete('search');
      startTransition(() => router.push(u.pathname + u.search));
    }, 300);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const toggleOpen = async (id: string) => {
    if (openId === id) {
      setOpenId(null);
      return;
    }
    setOpenId(id);
    if (detail[id]) return;
    setDetail((d) => ({ ...d, [id]: { kids: [], saves: [], subs: [], loading: true } }));
    try {
      const res = await fetch(`/api/admin/users/${id}/detail`);
      if (!res.ok) throw new Error(`${res.status}`);
      const body = (await res.json()) as {
        kids: Expanded['kids'];
        saves: Expanded['saves'];
        subs: Expanded['subs'];
      };
      setDetail((d) => ({ ...d, [id]: { ...body, loading: false } }));
    } catch (e) {
      setDetail((d) => ({
        ...d,
        [id]: { kids: [], saves: [], subs: [], loading: false, error: (e as Error).message },
      }));
    }
  };

  const deleteUser = async (id: string, email: string) => {
    if (
      !window.confirm(
        `Delete ${email}? This wipes kid profiles, reminders, saved camps, saved locations. It cannot be undone.`,
      )
    )
      return;
    const res = await fetch(`/api/admin/users/${id}/delete`, { method: 'POST' });
    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      alert(`Delete failed: ${j.error ?? res.status}`);
      return;
    }
    startTransition(() => router.refresh());
  };

  const tableRows = useMemo(() => users, [users]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="search"
          placeholder="Search by email fragment…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-xs rounded-full border border-cream-border bg-white px-3 py-1.5 text-sm text-ink placeholder:text-muted"
        />
        <span className="text-xs font-bold text-muted">
          {users.length} shown · {total} total{pending ? ' · loading…' : ''}
        </span>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-cream-border bg-white">
        <table className="w-full text-xs">
          <thead className="text-left text-[10px] font-black uppercase tracking-wider text-muted">
            <tr className="border-b border-cream-border">
              <th className="p-3">Email</th>
              <th className="p-3">Name</th>
              <th className="p-3">Lang</th>
              <th className="p-3">Signed up</th>
              <th className="p-3">Last seen</th>
              <th className="p-3 text-center">Kids</th>
              <th className="p-3">Ages</th>
              <th className="p-3 text-center">Subs</th>
              <th className="p-3 text-center">Saves</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {tableRows.length === 0 ? (
              <tr>
                <td colSpan={10} className="p-6 text-center text-muted">
                  No users match.
                </td>
              </tr>
            ) : null}
            {tableRows.map((u) => {
              const d = detail[u.id];
              const isOpen = openId === u.id;
              return (
                <Fragment key={u.id}>
                  <tr
                    className={
                      'border-b border-cream-border transition-colors hover:bg-cream/50 ' +
                      (isOpen ? 'bg-cream/50' : '')
                    }
                  >
                    <td className="p-3 font-bold text-ink">
                      <button
                        type="button"
                        onClick={() => toggleOpen(u.id)}
                        className="text-left hover:text-brand-purple"
                      >
                        {u.email}
                      </button>
                      {u.isAdmin ? (
                        <span className="ml-2 inline-flex rounded-full bg-brand-purple/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-brand-purple">
                          admin
                        </span>
                      ) : null}
                    </td>
                    <td className="p-3 text-muted">{u.display_name ?? '—'}</td>
                    <td className="p-3 text-muted">{u.preferred_language}</td>
                    <td className="p-3 text-muted">{fmtDate(u.created_at)}</td>
                    <td className="p-3 text-muted">{fmtDate(u.last_seen_at)}</td>
                    <td className="p-3 text-center text-ink">{u.kidCount}</td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1">
                        {u.ageRanges.length === 0 ? (
                          <span className="text-muted">—</span>
                        ) : (
                          u.ageRanges.map((a) => (
                            <span
                              key={a}
                              className="rounded-full bg-brand-purple/10 px-1.5 py-0.5 text-[10px] font-black text-brand-purple"
                            >
                              {a}
                            </span>
                          ))
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-center text-ink">{u.activeReminders}</td>
                    <td className="p-3 text-center text-ink">{u.savedCamps}</td>
                    <td className="p-3 text-right">
                      <button
                        type="button"
                        onClick={() => deleteUser(u.id, u.email)}
                        className="rounded-full border border-red-300 bg-white px-2 py-1 text-[10px] font-black text-red-700 hover:bg-red-50 disabled:opacity-40"
                        disabled={u.isAdmin}
                        title={u.isAdmin ? "Can't delete an admin from this UI" : 'Delete user (COPPA right-to-be-forgotten)'}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                  {isOpen ? (
                    <tr className="bg-cream/30">
                      <td colSpan={10} className="p-4">
                        {d?.loading ? (
                          <p className="text-xs text-muted">Loading…</p>
                        ) : d?.error ? (
                          <p className="text-xs text-red-600">Failed: {d.error}</p>
                        ) : d ? (
                          <div className="grid gap-4 md:grid-cols-3">
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-wider text-muted">
                                Kid profiles ({d.kids.length})
                              </p>
                              <p className="text-[10px] text-muted">age_range + school only</p>
                              <ul className="mt-1 space-y-1 text-xs text-ink">
                                {d.kids.length === 0 ? <li className="text-muted">—</li> : null}
                                {d.kids.map((k, i) => (
                                  <li key={i}>
                                    <span className="font-bold">{k.age_range}</span> at{' '}
                                    {k.school_name ?? '(no school)'}
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-wider text-muted">
                                Reminder subscriptions ({d.subs.length})
                              </p>
                              <ul className="mt-1 space-y-1 text-xs text-ink">
                                {d.subs.length === 0 ? <li className="text-muted">—</li> : null}
                                {d.subs.map((s, i) => (
                                  <li key={i}>
                                    {s.school_name ?? '(school)'} ·{' '}
                                    <span className="text-muted">{s.age_range}</span>{' '}
                                    {s.enabled ? '' : '(paused)'}
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-wider text-muted">
                                Saved camps ({d.saves.length})
                              </p>
                              <ul className="mt-1 space-y-1 text-xs text-ink">
                                {d.saves.length === 0 ? <li className="text-muted">—</li> : null}
                                {d.saves.map((s, i) => (
                                  <li key={i}>{s.name}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        ) : null}
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
