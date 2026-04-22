import { createServiceSupabase } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

type Row = {
  id: string;
  email: string;
  city: string;
  state: string | null;
  user_agent: string | null;
  created_at: string;
};

export default async function AdminCityRequestsPage() {
  const db = createServiceSupabase();
  const { data } = await db
    .from('city_requests')
    .select('id, email, city, state, user_agent, created_at')
    .order('created_at', { ascending: false });
  const rows = (data ?? []) as Row[];

  const counts = new Map<string, { city: string; state: string | null; count: number }>();
  for (const r of rows) {
    const key = `${r.city.toLowerCase()}|${(r.state ?? '').toLowerCase()}`;
    const e = counts.get(key);
    if (e) e.count += 1;
    else counts.set(key, { city: r.city, state: r.state, count: 1 });
  }
  const ranked = Array.from(counts.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-black text-ink">City demand</h2>
        <p className="text-xs font-bold text-muted">
          Each row is a parent who asked us to cover their city. Honest — no weights, no interpolation.
        </p>
      </div>

      <section className="rounded-2xl border border-cream-border bg-white p-5">
        <h3 className="text-sm font-black text-ink">Top 10 cities</h3>
        {ranked.length === 0 ? (
          <p className="mt-2 text-xs text-muted">No city requests yet.</p>
        ) : (
          <table className="mt-3 w-full text-xs">
            <thead className="text-left text-[10px] font-black uppercase tracking-wider text-muted">
              <tr className="border-b border-cream-border">
                <th className="p-2">City</th>
                <th className="p-2">State</th>
                <th className="p-2 text-right">Requests</th>
              </tr>
            </thead>
            <tbody>
              {ranked.map((r) => (
                <tr key={`${r.city}|${r.state}`} className="border-b border-cream-border">
                  <td className="p-2 text-ink">{r.city}</td>
                  <td className="p-2 text-muted">{r.state ?? '—'}</td>
                  <td className="p-2 text-right font-bold text-ink">{r.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="rounded-2xl border border-cream-border bg-white p-5">
        <h3 className="text-sm font-black text-ink">All requests ({rows.length})</h3>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="text-left text-[10px] font-black uppercase tracking-wider text-muted">
              <tr className="border-b border-cream-border">
                <th className="p-2">Email</th>
                <th className="p-2">City</th>
                <th className="p-2">State</th>
                <th className="p-2">Requested</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-3 text-center text-muted">
                    No requests yet.
                  </td>
                </tr>
              ) : null}
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-cream-border">
                  <td className="p-2 text-ink">{r.email}</td>
                  <td className="p-2 text-muted">{r.city}</td>
                  <td className="p-2 text-muted">{r.state ?? '—'}</td>
                  <td className="p-2 text-muted">
                    {new Date(r.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
