import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock env BEFORE anything imports @/lib/env.
vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://x.supabase.co');
vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon');
vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service');
vi.stubEnv('RESEND_API_KEY', 're_test');
vi.stubEnv('CRON_SECRET', 'cron');
vi.stubEnv('APP_URL', 'http://localhost:3000');

const insertMock = vi.fn();
const fromMock = vi.fn(() => ({ insert: insertMock }));
vi.mock('@/lib/supabase/service', () => ({
  createServiceSupabase: () => ({ from: fromMock }),
}));

beforeEach(() => {
  insertMock.mockReset();
  fromMock.mockClear();
});

describe('POST /api/city-request', () => {
  it('rejects payload missing required fields', async () => {
    const { POST } = await import('@/app/api/city-request/route');
    const res = await POST(new Request('http://localhost/api/city-request', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'not-an-email' }),
    }));
    expect(res.status).toBe(400);
  });

  it('inserts city request on good body', async () => {
    insertMock.mockResolvedValueOnce({ data: [], error: null });
    const { POST } = await import('@/app/api/city-request/route');
    const res = await POST(new Request('http://localhost/api/city-request', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'user-agent': 'jest-test' },
      body: JSON.stringify({ email: 'a@b.com', city: 'Austin', state: 'TX' }),
    }));
    expect(res.status).toBe(200);
    expect(fromMock).toHaveBeenCalledWith('city_requests');
    expect(insertMock).toHaveBeenCalledOnce();
    const insertArgs = insertMock.mock.calls[0][0];
    expect(insertArgs).toMatchObject({ email: 'a@b.com', city: 'Austin', state: 'TX', user_agent: 'jest-test' });
  });

  it('treats unique-constraint collision (23505) as success', async () => {
    insertMock.mockResolvedValueOnce({ data: null, error: { code: '23505', message: 'duplicate' } });
    const { POST } = await import('@/app/api/city-request/route');
    const res = await POST(new Request('http://localhost/api/city-request', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'a@b.com', city: 'Austin' }),
    }));
    expect(res.status).toBe(200);
  });

  it('returns 500 on other DB errors', async () => {
    insertMock.mockResolvedValueOnce({ data: null, error: { code: '42P01', message: 'table missing' } });
    const { POST } = await import('@/app/api/city-request/route');
    const res = await POST(new Request('http://localhost/api/city-request', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'a@b.com', city: 'Austin' }),
    }));
    expect(res.status).toBe(500);
  });
});
