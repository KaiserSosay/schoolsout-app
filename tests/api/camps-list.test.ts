import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://x.supabase.co');
vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon');
vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service');
vi.stubEnv('RESEND_API_KEY', 're_test');
vi.stubEnv('CRON_SECRET', 'cron');
vi.stubEnv('APP_URL', 'http://localhost:3000');

// Build a chainable stub that also supports `await` at the end of the chain.
// Each chained method returns the same object; the final resolution is set
// per test via `resolve`.
function makeChain(rows: unknown[]) {
  const thenable: Record<string, unknown> = {};
  const make = (): typeof thenable => {
    const c: Record<string, unknown> = {};
    const methods = ['select', 'order', 'overlaps', 'lte', 'gte', 'eq', 'neq', 'in', 'ilike'] as const;
    for (const m of methods) c[m] = vi.fn(() => c);
    c.then = (onFulfilled: (v: { data: unknown[]; error: null }) => unknown) =>
      Promise.resolve({ data: rows, error: null }).then(onFulfilled);
    return c;
  };
  Object.assign(thenable, make());
  return thenable;
}

let lastChain: Record<string, unknown> = makeChain([]);
const fromMock = vi.fn(() => lastChain);

vi.mock('@/lib/supabase/service', () => ({
  createServiceSupabase: () => ({ from: fromMock }),
}));

beforeEach(() => {
  fromMock.mockClear();
});

describe('GET /api/camps', () => {
  it('returns all camps with no filters', async () => {
    lastChain = makeChain([
      { id: 'c1', slug: 'a', name: 'A', ages_min: 5, ages_max: 10, price_tier: '$$', categories: ['STEM'], is_featured: false, verified: false, created_at: '2026-01-01' },
    ]);
    const { GET } = await import('@/app/api/camps/route');
    const res = await GET(new Request('http://localhost/api/camps'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.camps).toHaveLength(1);
    expect(fromMock).toHaveBeenCalledWith('camps');
  });

  it('applies category + age filters', async () => {
    lastChain = makeChain([
      { id: 'c1', slug: 'a', name: 'A', ages_min: 5, ages_max: 10, price_tier: '$$', categories: ['Soccer'], is_featured: false, verified: false, created_at: '2026-01-01' },
    ]);
    const { GET } = await import('@/app/api/camps/route');
    const res = await GET(new Request('http://localhost/api/camps?categories=Soccer,STEM&age=7'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.camps).toHaveLength(1);
  });

  it('filters out camps outside the min_price/max_price band', async () => {
    lastChain = makeChain([
      { id: 'c1', slug: 'cheap', name: 'Cheap', ages_min: 5, ages_max: 10, price_tier: '$',   categories: [], is_featured: false, verified: false, created_at: '2026-01-01' },
      { id: 'c2', slug: 'mid',   name: 'Mid',   ages_min: 5, ages_max: 10, price_tier: '$$',  categories: [], is_featured: false, verified: false, created_at: '2026-01-02' },
      { id: 'c3', slug: 'pricy', name: 'Pricy', ages_min: 5, ages_max: 10, price_tier: '$$$', categories: [], is_featured: false, verified: false, created_at: '2026-01-03' },
    ]);
    const { GET } = await import('@/app/api/camps/route');
    const res = await GET(new Request('http://localhost/api/camps?min_price=$$&max_price=$$'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.camps).toHaveLength(1);
    expect(body.camps[0].slug).toBe('mid');
  });

  it('returns 400 on bad query param', async () => {
    const { GET } = await import('@/app/api/camps/route');
    const res = await GET(new Request('http://localhost/api/camps?age=not-a-number'));
    expect(res.status).toBe(400);
  });
});
