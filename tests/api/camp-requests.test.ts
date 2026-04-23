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
const fromMock = vi.fn((table: string) => {
  if (table === 'camp_applications') {
    return {
      insert: () => ({ select: () => ({ single: insertSelectSingleMock }) }),
    };
  }
  return {};
});
vi.mock('@/lib/supabase/service', () => ({
  createServiceSupabase: () => ({ from: fromMock }),
}));

beforeEach(() => {
  sendMock.mockClear();
  insertSelectSingleMock.mockReset();
});

describe('POST /api/camp-requests', () => {
  it('rejects when required fields are missing', async () => {
    const { POST } = await import('@/app/api/camp-requests/route');
    const res = await POST(
      new Request('http://localhost/api/camp-requests', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ camp_name: 'Only' }),
      }),
    );
    expect(res.status).toBe(400);
  });

  it('rejects when age_max < age_min', async () => {
    const { POST } = await import('@/app/api/camp-requests/route');
    const res = await POST(
      new Request('http://localhost/api/camp-requests', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          submitted_by_email: 'op@test.com',
          business_name: 'ACME',
          camp_name: 'Sports',
          age_min: 10,
          age_max: 8,
        }),
      }),
    );
    expect(res.status).toBe(400);
    const j = await res.json();
    expect(j.error).toBe('ages_max_lt_min');
  });

  it('inserts and fires admin notification when valid', async () => {
    insertSelectSingleMock.mockResolvedValueOnce({ data: { id: 'cr-1' }, error: null });
    const { POST } = await import('@/app/api/camp-requests/route');
    const res = await POST(
      new Request('http://localhost/api/camp-requests', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          submitted_by_email: 'op@test.com',
          business_name: 'ACME Sports',
          camp_name: 'Soccer Week',
          age_min: 5,
          age_max: 12,
          locale: 'en',
        }),
      }),
    );
    expect(res.status).toBe(200);
    const j = await res.json();
    expect(j.ok).toBe(true);
    expect(j.id).toBe('cr-1');
    expect(sendMock).toHaveBeenCalledOnce();
    const args = sendMock.mock.calls[0][0];
    expect(args.to).toBe('notify@schoolsout.net');
  });
});

describe('POST /api/admin/camp-applications/[id]/payment-link', () => {
  it('returns 503 when Stripe env vars are unset', async () => {
    const serverCtx = { user: { id: 'admin-1', email: 'admin@test.com' } };
    vi.doMock('@/lib/supabase/server', () => ({
      createServerSupabase: () => ({
        auth: { getUser: async () => ({ data: { user: serverCtx.user } }) },
      }),
    }));
    const { POST } = await import(
      '@/app/api/admin/camp-applications/[id]/payment-link/route'
    );
    const res = await POST();
    expect(res.status).toBe(503);
    const j = await res.json();
    expect(j.error).toBe('stripe_not_configured');
  });
});
