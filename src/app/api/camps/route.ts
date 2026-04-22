import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceSupabase } from '@/lib/supabase/service';

// DECISION: Use service role for public GET so RLS isn't a blocker even though
// the "anyone reads camps" policy would allow anon SELECT. Service role is
// simpler and avoids needing cookies for unauthenticated browsing.
const priceTier = z.enum(['$', '$$', '$$$']);

const querySchema = z.object({
  // categories is a comma-separated list
  categories: z.string().optional(),
  age: z.coerce.number().int().min(0).max(25).optional(),
  min_price: priceTier.optional(),
  max_price: priceTier.optional(),
});

const tierRank: Record<string, number> = { $: 1, $$: 2, $$$: 3 };

export async function GET(req: Request) {
  const url = new URL(req.url);
  const raw = {
    categories: url.searchParams.get('categories') ?? undefined,
    age: url.searchParams.get('age') ?? undefined,
    min_price: url.searchParams.get('min_price') ?? undefined,
    max_price: url.searchParams.get('max_price') ?? undefined,
  };
  const parsed = querySchema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: 'invalid_query' }, { status: 400 });

  const { categories, age, min_price, max_price } = parsed.data;
  const db = createServiceSupabase();
  let q = db
    .from('camps')
    .select('id, slug, name, description, ages_min, ages_max, price_tier, categories, website_url, image_url, neighborhood, is_featured, verified, created_at')
    .order('is_featured', { ascending: false })
    .order('verified', { ascending: false })
    .order('created_at', { ascending: false });

  if (categories) {
    const list = categories
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);
    if (list.length) q = q.overlaps('categories', list);
  }
  if (typeof age === 'number') {
    q = q.lte('ages_min', age).gte('ages_max', age);
  }

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: 'db_error', detail: error.message }, { status: 500 });

  // DECISION: Price filtering done in JS — price_tier is a 3-value enum string
  // ('$','$$','$$$'), and Supabase .in() or .gte() on strings won't respect the
  // ordinal rank. Tiny row count (<1000 camps) makes this cheap.
  let camps = data ?? [];
  if (min_price) {
    const min = tierRank[min_price];
    camps = camps.filter((c) => tierRank[c.price_tier] >= min);
  }
  if (max_price) {
    const max = tierRank[max_price];
    camps = camps.filter((c) => tierRank[c.price_tier] <= max);
  }

  return NextResponse.json({ camps });
}
