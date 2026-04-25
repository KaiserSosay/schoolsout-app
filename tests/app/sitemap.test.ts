import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://x.supabase.co');
vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon');
vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service');
vi.stubEnv('RESEND_API_KEY', 're_test');
vi.stubEnv('CRON_SECRET', 'cron');
vi.stubEnv('APP_URL', 'http://localhost:3000');

// Per-table mock: dispatch chain shapes by the first table named.
function makeChain(rows: unknown[]) {
  const c: Record<string, unknown> = {};
  const methods = ['select', 'eq', 'neq', 'order'] as const;
  for (const m of methods) c[m] = vi.fn(() => c);
  c.then = (onFulfilled: (v: { data: unknown[]; error: null }) => unknown) =>
    Promise.resolve({ data: rows, error: null }).then(onFulfilled);
  return c;
}

let campsRows: unknown[] = [];
let closuresRows: unknown[] = [];
let schoolsRows: unknown[] = [];

vi.mock('@/lib/supabase/service', () => ({
  createServiceSupabase: () => ({
    from: (table: string) => {
      if (table === 'camps') return makeChain(campsRows);
      if (table === 'closures') return makeChain(closuresRows);
      if (table === 'schools') return makeChain(schoolsRows);
      return makeChain([]);
    },
  }),
}));

beforeEach(() => {
  campsRows = [];
  closuresRows = [];
  schoolsRows = [];
});

describe('sitemap', () => {
  it('includes the /schools index per locale at priority 0.7', async () => {
    const { default: sitemap } = await import('@/app/sitemap');
    const entries = await sitemap();
    const indexes = entries.filter((e) => e.url.endsWith('/schools'));
    expect(indexes.length).toBe(2);
    for (const e of indexes) {
      expect(e.priority).toBe(0.7);
    }
  });

  it('includes per-school detail pages at priority 0.7', async () => {
    schoolsRows = [{ slug: 'the-growing-place-school', created_at: '2026-01-01' }];
    const { default: sitemap } = await import('@/app/sitemap');
    const entries = await sitemap();
    const detail = entries.filter((e) =>
      e.url.endsWith('/schools/the-growing-place-school'),
    );
    expect(detail.length).toBe(2); // en + es
    for (const e of detail) {
      expect(e.priority).toBe(0.7);
    }
  });

  it('skips schools without a slug', async () => {
    schoolsRows = [
      { slug: '', created_at: '2026-01-01' },
      { slug: 'good-slug', created_at: '2026-01-01' },
    ];
    const { default: sitemap } = await import('@/app/sitemap');
    const entries = await sitemap();
    expect(entries.filter((e) => e.url.includes('/schools/good-slug')).length).toBe(2);
    expect(entries.filter((e) => e.url.endsWith('/schools/')).length).toBe(0);
  });
});
