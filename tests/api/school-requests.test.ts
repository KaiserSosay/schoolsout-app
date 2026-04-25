import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://x.supabase.co');
vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon');
vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service');
vi.stubEnv('RESEND_API_KEY', 're_test');
vi.stubEnv('CRON_SECRET', 'cron');
vi.stubEnv('APP_URL', 'http://localhost:3000');
vi.stubEnv('ADMIN_EMAILS', 'admin@test.com');
vi.stubEnv('ADMIN_NOTIFY_EMAIL', 'notify@schoolsout.net');

const sendMock = vi.fn().mockResolvedValue({ data: { id: 'x' }, error: null });
vi.mock('resend', () => ({ Resend: class { emails = { send: sendMock }; } }));

const insertSelectSingleMock = vi.fn();
const usersMaybeSingleMock = vi.fn();
const fromMock = vi.fn((table: string) => {
  if (table === 'school_requests') {
    return {
      insert: () => ({ select: () => ({ single: insertSelectSingleMock }) }),
    };
  }
  if (table === 'users') {
    return {
      select: () => ({ eq: () => ({ maybeSingle: usersMaybeSingleMock }) }),
    };
  }
  return {};
});
vi.mock('@/lib/supabase/service', () => ({
  createServiceSupabase: () => ({ from: fromMock }),
}));
vi.mock('@/lib/supabase/server', () => ({
  createServerSupabase: () => ({
    auth: { getUser: async () => ({ data: { user: null } }) },
  }),
}));

beforeEach(() => {
  sendMock.mockClear();
  insertSelectSingleMock.mockReset();
  usersMaybeSingleMock.mockReset();
});

describe('POST /api/school-requests', () => {
  it('rejects when requested_name is too short', async () => {
    const { POST } = await import('@/app/api/school-requests/route');
    const res = await POST(
      new Request('http://localhost/api/school-requests', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ requested_name: 'A' }),
      }),
    );
    expect(res.status).toBe(400);
  });

  it('inserts the row and sends the admin notify email when valid', async () => {
    insertSelectSingleMock.mockResolvedValueOnce({
      data: { id: 'sr-1' },
      error: null,
    });
    const { POST } = await import('@/app/api/school-requests/route');
    const res = await POST(
      new Request('http://localhost/api/school-requests', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          requested_name: 'Davis Academy',
          city: 'Atlanta',
        }),
      }),
    );
    expect(res.status).toBe(200);
    const j = await res.json();
    expect(j.ok).toBe(true);
    expect(j.id).toBe('sr-1');
    expect(sendMock).toHaveBeenCalledOnce();
    const args = sendMock.mock.calls[0][0];
    expect(args.to).toBe('notify@schoolsout.net');
    expect(args.subject).toContain('Davis Academy');
  });

  it('returns 500 when the insert fails', async () => {
    insertSelectSingleMock.mockResolvedValueOnce({
      data: null,
      error: { message: 'relation "school_requests" does not exist' },
    });
    const { POST } = await import('@/app/api/school-requests/route');
    const res = await POST(
      new Request('http://localhost/api/school-requests', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ requested_name: 'Some School' }),
      }),
    );
    expect(res.status).toBe(500);
  });
});
