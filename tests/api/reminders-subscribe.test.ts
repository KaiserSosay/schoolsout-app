import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock env BEFORE anything imports @/lib/env
vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://x.supabase.co');
vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon');
vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service');
vi.stubEnv('RESEND_API_KEY', 're_test');
vi.stubEnv('CRON_SECRET', 'cron');
vi.stubEnv('APP_URL', 'http://localhost:3000');

const sendMock = vi.fn().mockResolvedValue({ data: { id: 'x' }, error: null });
vi.mock('resend', () => ({ Resend: class { emails = { send: sendMock }; } }));

// Mock Supabase service client
const inviteMock = vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });
const updateMock = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: [], error: null }) });
const upsertMock = vi.fn().mockResolvedValue({ data: [], error: null });
const fromMock = vi.fn((table: string) => {
  if (table === 'reminder_subscriptions') return { upsert: upsertMock };
  if (table === 'users') return { update: updateMock };
  return {};
});
vi.mock('@/lib/supabase/service', () => ({
  createServiceSupabase: () => ({
    auth: { admin: { inviteUserByEmail: inviteMock, listUsers: vi.fn().mockResolvedValue({ data: { users: [] } }) } },
    from: fromMock,
  }),
}));

beforeEach(() => {
  sendMock.mockClear();
  inviteMock.mockClear();
  upsertMock.mockClear();
});

describe('POST /api/reminders/subscribe', () => {
  it('rejects payload missing required fields', async () => {
    const { POST } = await import('@/app/api/reminders/subscribe/route');
    const res = await POST(new Request('http://localhost/api/reminders/subscribe', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ school_id: 'x' }),
    }));
    expect(res.status).toBe(400);
  });

  it('creates subscription and sends confirmation email', async () => {
    const { POST } = await import('@/app/api/reminders/subscribe/route');
    const res = await POST(new Request('http://localhost/api/reminders/subscribe', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        email: 'a@b.com',
        school_id: '00000000-0000-0000-0000-000000000001',
        age_range: 'all',
        locale: 'en',
      }),
    }));
    expect(res.status).toBe(200);
    expect(sendMock).toHaveBeenCalledOnce();
  });
});
