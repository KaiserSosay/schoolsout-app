import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock env BEFORE anything imports @/lib/env.
vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://x.supabase.co');
vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon');
vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service');
vi.stubEnv('RESEND_API_KEY', 're_test');
vi.stubEnv('CRON_SECRET', 'cron');
vi.stubEnv('APP_URL', 'http://localhost:3000');

const sendMock = vi.fn().mockResolvedValue({ data: { id: 'x' }, error: null });
vi.mock('resend', () => ({ Resend: class { emails = { send: sendMock }; } }));

const insertMock = vi.fn();
const fromMock = vi.fn(() => ({ insert: insertMock }));
vi.mock('@/lib/supabase/service', () => ({
  createServiceSupabase: () => ({ from: fromMock }),
}));

beforeEach(() => {
  insertMock.mockReset();
  sendMock.mockClear();
  fromMock.mockClear();
});

const GOOD_BODY = {
  camp_name: 'Test Camp',
  website: 'https://testcamp.example.com',
  ages: '5-12',
  neighborhood: 'Coconut Grove',
  email: 'owner@testcamp.example.com',
};

describe('POST /api/camps/apply', () => {
  it('rejects payload missing required fields', async () => {
    const { POST } = await import('@/app/api/camps/apply/route');
    const res = await POST(new Request('http://localhost/api/camps/apply', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ camp_name: 'Only name' }),
    }));
    expect(res.status).toBe(400);
  });

  it('rejects payload with non-URL website', async () => {
    const { POST } = await import('@/app/api/camps/apply/route');
    const res = await POST(new Request('http://localhost/api/camps/apply', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ...GOOD_BODY, website: 'not-a-url' }),
    }));
    expect(res.status).toBe(400);
  });

  it('inserts application and sends notification email on good body', async () => {
    insertMock.mockResolvedValueOnce({ data: [], error: null });
    const { POST } = await import('@/app/api/camps/apply/route');
    const res = await POST(new Request('http://localhost/api/camps/apply', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(GOOD_BODY),
    }));
    expect(res.status).toBe(200);
    expect(fromMock).toHaveBeenCalledWith('camp_applications');
    expect(insertMock).toHaveBeenCalledOnce();
    expect(insertMock.mock.calls[0][0]).toMatchObject(GOOD_BODY);
    expect(sendMock).toHaveBeenCalledOnce();
    const sendArgs = sendMock.mock.calls[0][0];
    expect(sendArgs.to).toBe('rkscarlett@gmail.com');
    expect(sendArgs.subject).toContain('Test Camp');
    expect(sendArgs.html).toContain('Coconut Grove');
  });

  it('returns 500 on DB error', async () => {
    insertMock.mockResolvedValueOnce({ data: null, error: { code: '42P01', message: 'table missing' } });
    const { POST } = await import('@/app/api/camps/apply/route');
    const res = await POST(new Request('http://localhost/api/camps/apply', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(GOOD_BODY),
    }));
    expect(res.status).toBe(500);
    expect(sendMock).not.toHaveBeenCalled();
  });

  it('still returns 200 if notification email throws', async () => {
    insertMock.mockResolvedValueOnce({ data: [], error: null });
    sendMock.mockRejectedValueOnce(new Error('resend blew up'));
    const { POST } = await import('@/app/api/camps/apply/route');
    const res = await POST(new Request('http://localhost/api/camps/apply', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(GOOD_BODY),
    }));
    expect(res.status).toBe(200);
  });
});
