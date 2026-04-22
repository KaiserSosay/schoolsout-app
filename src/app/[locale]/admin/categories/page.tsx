import { createServiceSupabase } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

type CampRow = { id: string; categories: string[]; price_tier: '$' | '$$' | '$$$' };

const tierRank: Record<string, number> = { $: 1, $$: 2, $$$: 3 };
const rankTier: Record<number, string> = { 1: '$', 2: '$$', 3: '$$$' };

export default async function AdminCategoriesPage() {
  const db = createServiceSupabase();
  const d30 = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();

  const [campsResp, clicksResp] = await Promise.all([
    db.from('camps').select('id, categories, price_tier'),
    db.from('camp_clicks').select('camp_id').gte('clicked_at', d30),
  ]);

  const camps = (campsResp.data ?? []) as CampRow[];
  const clicksByCamp = new Map<string, number>();
  for (const r of (clicksResp.data ?? []) as { camp_id: string }[]) {
    clicksByCamp.set(r.camp_id, (clicksByCamp.get(r.camp_id) ?? 0) + 1);
  }

  type Agg = { count: number; priceSum: number; clicks: number };
  const buckets = new Map<string, Agg>();

  for (const c of camps) {
    for (const cat of c.categories ?? []) {
      const bucket = buckets.get(cat) ?? { count: 0, priceSum: 0, clicks: 0 };
      bucket.count += 1;
      bucket.priceSum += tierRank[c.price_tier] ?? 0;
      bucket.clicks += clicksByCamp.get(c.id) ?? 0;
      buckets.set(cat, bucket);
    }
  }

  const ranked = Array.from(buckets.entries())
    .map(([name, b]) => ({
      name,
      count: b.count,
      avgPriceTier: b.count ? rankTier[Math.round(b.priceSum / b.count)] ?? '$' : '$',
      clicks30d: b.clicks,
    }))
    .sort((a, b) => b.count - a.count);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-black text-ink">Categories</h2>
        <p className="text-xs font-bold text-muted">
          Categories are tags on each camp. There&apos;s no separate &ldquo;categories&rdquo; table — this is a denormalized view aggregated from <code>camps.categories[]</code>.
        </p>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-cream-border bg-white">
        <table className="w-full text-xs">
          <thead className="text-left text-[10px] font-black uppercase tracking-wider text-muted">
            <tr className="border-b border-cream-border">
              <th className="p-3">Category</th>
              <th className="p-3 text-right">Camps</th>
              <th className="p-3 text-right">Avg price tier</th>
              <th className="p-3 text-right">Clicks 30d</th>
            </tr>
          </thead>
          <tbody>
            {ranked.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-6 text-center text-muted">
                  No categories yet — add one to a camp in the Camps tab.
                </td>
              </tr>
            ) : null}
            {ranked.map((r) => (
              <tr key={r.name} className="border-b border-cream-border">
                <td className="p-3 font-bold text-ink">{r.name}</td>
                <td className="p-3 text-right text-ink">{r.count}</td>
                <td className="p-3 text-right text-ink">{r.avgPriceTier}</td>
                <td className="p-3 text-right text-ink">{r.clicks30d}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
