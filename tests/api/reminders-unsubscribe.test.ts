import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://x.supabase.co');
vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon');
vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service');
vi.stubEnv('RESEND_API_KEY', 're_test');
vi.stubEnv('CRON_SECRET', 'cron');
vi.stubEnv('APP_URL', 'http://localhost:3000');

// Mock supabase. The route now both updates the subscription AND looks up
// the owning user_id so it can revoke all their sessions; the mock chain
// supports update().eq().select().single() and select().eq().single().
const updateEqResult: { error: { message: string } | null } = { error: null };
const subscriptionLookup: { user_id: string } | null = { user_id: 'user-123' };

const eqUpdateMock = vi.fn().mockImplementation(async () => updateEqResult);
const updateMock = vi.fn().mockReturnValue({ eq: eqUpdateMock });

const singleSelectMock = vi.fn().mockImplementation(async () => ({
  data: subscriptionLookup,
  error: null,
}));
const eqSelectMock = vi.fn().mockReturnValue({ single: singleSelectMock });
const selectMock = vi.fn().mockReturnValue({ eq: eqSelectMock });

vi.mock('@/lib/supabase/service', () => ({
  createServiceSupabase: () => ({
    from: () => ({ update: updateMock, select: selectMock }),
  }),
}));

const fetchMock = vi.fn();

import { GET } from '@/app/api/reminders/unsubscribe/route';
import { signToken } from '@/lib/tokens';

describe('GET /api/reminders/unsubscribe', () => {
  beforeEach(() => {
    updateMock.mockClear();
    eqUpdateMock.mockClear();
    selectMock.mockClear();
    eqSelectMock.mockClear();
    singleSelectMock.mockClear();
    fetchMock.mockReset();
    fetchMock.mockResolvedValue(new Response(null, { status: 200 }));
    // @ts-expect-error -- jsdom global fetch override is fine for tests
    global.fetch = fetchMock;
  });

  it('rejects missing token', async () => {
    const res = await GET(new Request('http://localhost/api/reminders/unsubscribe'));
    expect(res.status).toBe(400);
  });

  it('rejects bad signature', async () => {
    const res = await GET(new Request('http://localhost/api/reminders/unsubscribe?sub=abc&sig=xxx'));
    expect(res.status).toBe(400);
  });

  it('accepts valid signature and redirects', async () => {
    const sub = 'fake-uuid';
    const sig = signToken(sub);
    await GET(new Request(`http://localhost/api/reminders/unsubscribe?sub=${sub}&sig=${sig}`));
    expect(updateMock).toHaveBeenCalled();
  });

  it('revokes all sessions for the owning user via the GoTrue admin endpoint', async () => {
    const sub = 'fake-uuid';
    const sig = signToken(sub);
    await GET(new Request(`http://localhost/api/reminders/unsubscribe?sub=${sub}&sig=${sig}`));
    const calls = fetchMock.mock.calls;
    const adminCall = calls.find(([url]) =>
      typeof url === 'string' && url.includes('/auth/v1/admin/users/user-123/logout'),
    );
    expect(adminCall, 'expected fetch to GoTrue admin logout endpoint').toBeTruthy();
    const init = adminCall![1] as RequestInit;
    expect(init.method).toBe('POST');
    const headers = init.headers as Record<string, string>;
    expect(headers['Authorization']).toBe('Bearer service');
    expect(headers['apikey']).toBe('service');
    const body = JSON.parse(init.body as string);
    expect(body.scope).toBe('global');
  });

  it('still redirects even when session revocation fails', async () => {
    fetchMock.mockResolvedValueOnce(new Response('boom', { status: 500 }));
    const sub = 'fake-uuid';
    const sig = signToken(sub);
    const res = await GET(new Request(`http://localhost/api/reminders/unsubscribe?sub=${sub}&sig=${sig}`));
    expect(res.status).toBe(307);
  });
});
