import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://x.supabase.co');
vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon');
vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service');
vi.stubEnv('RESEND_API_KEY', 're_test');
vi.stubEnv('CRON_SECRET', 'cron');
vi.stubEnv('APP_URL', 'http://localhost:3000');

// Build a chainable stub that returns whatever rows the test sets via
// `lastChain = makeChain(rows)`. Any chained method (eq, neq, ilike, …)
// is a no-op returning the same object so the route can call them freely.
function makeChain(rows: unknown[]) {
  const c: Record<string, unknown> = {};
  const methods = ['select', 'order', 'overlaps', 'lte', 'gte', 'eq', 'neq', 'in', 'ilike'] as const;
  for (const m of methods) c[m] = vi.fn(() => c);
  c.then = (onFulfilled: (v: { data: unknown[]; error: null }) => unknown) =>
    Promise.resolve({ data: rows, error: null }).then(onFulfilled);
  return c;
}

let lastChain: Record<string, unknown> = makeChain([]);
const fromMock = vi.fn(() => lastChain);

vi.mock('@/lib/supabase/service', () => ({
  createServiceSupabase: () => ({ from: fromMock }),
}));

beforeEach(() => {
  fromMock.mockClear();
});

const baseCamp = {
  description: null,
  website_url: null,
  image_url: null,
  is_featured: false,
  verified: true,
  created_at: '2026-01-01',
  address: null,
  latitude: null,
  longitude: null,
  before_care_price_cents: null,
  after_care_price_cents: null,
  closed_on_holidays: true,
  phone: null,
  logistics_verified: true,
  website_status: 'ok',
  website_last_verified_at: '2026-01-01',
};

describe('GET /api/camps — shared filter library', () => {
  it('?q= matches camp name case-insensitively', async () => {
    lastChain = makeChain([
      { id: 'c1', slug: 'frost', name: 'Frost Science Summer', ages_min: 5, ages_max: 12, price_tier: '$$', categories: ['STEM'], neighborhood: 'Downtown', hours_start: null, hours_end: null, before_care_offered: false, before_care_start: null, after_care_offered: false, after_care_end: null, ...baseCamp },
      { id: 'c2', slug: 'soccer', name: 'Coral Soccer', ages_min: 6, ages_max: 12, price_tier: '$', categories: ['Soccer'], neighborhood: 'Coral Gables', hours_start: null, hours_end: null, before_care_offered: false, before_care_start: null, after_care_offered: false, after_care_end: null, ...baseCamp },
    ]);
    const { GET } = await import('@/app/api/camps/route');
    const res = await GET(new Request('http://localhost/api/camps?q=frost'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.camps).toHaveLength(1);
    expect(body.camps[0].slug).toBe('frost');
  });

  it('?full_workday=1 keeps only camps with effective 8am-5:30pm coverage', async () => {
    lastChain = makeChain([
      // No hours data → excluded
      { id: 'c1', slug: 'a', name: 'A', ages_min: 5, ages_max: 12, price_tier: '$$', categories: [], neighborhood: null, hours_start: null, hours_end: null, before_care_offered: false, before_care_start: null, after_care_offered: false, after_care_end: null, ...baseCamp },
      // Partial coverage → excluded
      { id: 'c2', slug: 'b', name: 'B', ages_min: 5, ages_max: 12, price_tier: '$$', categories: [], neighborhood: null, hours_start: '09:00', hours_end: '15:00', before_care_offered: false, before_care_start: null, after_care_offered: false, after_care_end: null, ...baseCamp },
      // Full coverage via extended care → included
      { id: 'c3', slug: 'c', name: 'C', ages_min: 5, ages_max: 12, price_tier: '$$', categories: [], neighborhood: null, hours_start: '09:00', hours_end: '15:00', before_care_offered: true, before_care_start: '07:30', after_care_offered: true, after_care_end: '18:00', ...baseCamp },
    ]);
    const { GET } = await import('@/app/api/camps/route');
    const res = await GET(new Request('http://localhost/api/camps?full_workday=1'));
    const body = await res.json();
    expect(body.camps).toHaveLength(1);
    expect(body.camps[0].slug).toBe('c');
  });

  it('combines ?cats=, ?tier=, ?ages= as AND', async () => {
    lastChain = makeChain([
      { id: 'c1', slug: 'a', name: 'A', ages_min: 5, ages_max: 12, price_tier: '$', categories: ['STEM'], neighborhood: null, hours_start: null, hours_end: null, before_care_offered: false, before_care_start: null, after_care_offered: false, after_care_end: null, ...baseCamp },
      { id: 'c2', slug: 'b', name: 'B', ages_min: 5, ages_max: 12, price_tier: '$$$', categories: ['STEM'], neighborhood: null, hours_start: null, hours_end: null, before_care_offered: false, before_care_start: null, after_care_offered: false, after_care_end: null, ...baseCamp },
      { id: 'c3', slug: 'c', name: 'C', ages_min: 13, ages_max: 17, price_tier: '$', categories: ['STEM'], neighborhood: null, hours_start: null, hours_end: null, before_care_offered: false, before_care_start: null, after_care_offered: false, after_care_end: null, ...baseCamp },
    ]);
    const { GET } = await import('@/app/api/camps/route');
    const res = await GET(
      new Request('http://localhost/api/camps?cats=STEM&tier=$&ages=6-9'),
    );
    const body = await res.json();
    expect(body.camps).toHaveLength(1);
    expect(body.camps[0].slug).toBe('a');
  });
});
