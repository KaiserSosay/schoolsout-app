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

// Mock Supabase service client — generateLink handles both invite and magiclink
// DECISION: No `&` in these fixture URLs — React Email escapes `&` to `&amp;`
// in href attributes, so a literal substring match would fail. We only need a
// unique, recognizable token to confirm the right link made it into the email.
const INVITE_LINK = 'https://x.supabase.co/auth/v1/verify?invite-token-abc';
const MAGIC_LINK = 'https://x.supabase.co/auth/v1/verify?magic-token-xyz';

const generateLinkMock = vi.fn();
const updateMock = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: [], error: null }) });
const upsertMock = vi.fn().mockResolvedValue({ data: [], error: null });
const fromMock = vi.fn((table: string) => {
  if (table === 'reminder_subscriptions') return { upsert: upsertMock };
  if (table === 'users') return { update: updateMock };
  return {};
});
vi.mock('@/lib/supabase/service', () => ({
  createServiceSupabase: () => ({
    auth: { admin: { generateLink: generateLinkMock } },
    from: fromMock,
  }),
}));

beforeEach(() => {
  sendMock.mockClear();
  generateLinkMock.mockReset();
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

  it('creates subscription and sends branded confirmation email when user is new (invite path)', async () => {
    generateLinkMock.mockResolvedValueOnce({
      data: {
        user: { id: 'user-1', email: 'a@b.com' },
        properties: { action_link: INVITE_LINK },
      },
      error: null,
    });

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
    // Only the invite generateLink was called (no fallback needed)
    expect(generateLinkMock).toHaveBeenCalledTimes(1);
    expect(generateLinkMock).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'invite', email: 'a@b.com' }),
    );
    expect(sendMock).toHaveBeenCalledOnce();
    // The HTML body must contain the actual action_link so users can click it
    const sendArgs = sendMock.mock.calls[0][0];
    expect(sendArgs.html).toContain(INVITE_LINK);
    expect(sendArgs.subject).toMatch(/Confirm your School's Out/);
  });

  it('falls back to magiclink when user already exists (invite returns null user)', async () => {
    // First call (invite) — user is null → fall back
    generateLinkMock.mockResolvedValueOnce({
      data: { user: null, properties: null },
      error: { message: 'User already registered' },
    });
    // Second call (magiclink) — succeeds
    generateLinkMock.mockResolvedValueOnce({
      data: {
        user: { id: 'user-2', email: 'existing@b.com' },
        properties: { action_link: MAGIC_LINK },
      },
      error: null,
    });

    const { POST } = await import('@/app/api/reminders/subscribe/route');
    const res = await POST(new Request('http://localhost/api/reminders/subscribe', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        email: 'existing@b.com',
        school_id: '00000000-0000-0000-0000-000000000001',
        age_range: 'all',
        locale: 'es',
      }),
    }));

    expect(res.status).toBe(200);
    expect(generateLinkMock).toHaveBeenCalledTimes(2);
    expect(generateLinkMock.mock.calls[0][0]).toMatchObject({ type: 'invite' });
    expect(generateLinkMock.mock.calls[1][0]).toMatchObject({ type: 'magiclink' });
    expect(sendMock).toHaveBeenCalledOnce();
    const sendArgs = sendMock.mock.calls[0][0];
    expect(sendArgs.html).toContain(MAGIC_LINK);
    expect(sendArgs.subject).toMatch(/Confirma tu suscripción/);
  });
});
