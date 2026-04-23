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

// Mock Supabase service client — generateLink returns hashed_token + verification_type
// which the subscribe route embeds into a /auth/callback URL so the server can
// call verifyOtp() to mint the session.
const INVITE_TOKEN = 'invite-token-abc';
const MAGIC_TOKEN = 'magic-token-xyz';

const generateLinkMock = vi.fn();
const updateMock = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: [], error: null }) });
const upsertMock = vi.fn().mockResolvedValue({ data: [], error: null });

// DECISION: The route now queries public.users BEFORE generateLink() to detect
// new-vs-returning. The users .select().eq().maybeSingle() chain must be
// mockable — we expose `usersSelectMock` so each test can decide whether the
// email corresponds to an existing user (returning) or not (new).
const usersSelectMaybeSingleMock = vi.fn();

const fromMock = vi.fn((table: string) => {
  if (table === 'reminder_subscriptions') return { upsert: upsertMock };
  if (table === 'users') {
    return {
      update: updateMock,
      select: () => ({
        eq: () => ({
          maybeSingle: usersSelectMaybeSingleMock,
        }),
      }),
    };
  }
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
  usersSelectMaybeSingleMock.mockReset();
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

  it('creates subscription + sends invite email for NEW user (isReturning=false)', async () => {
    // public.users returns no row → new user
    usersSelectMaybeSingleMock.mockResolvedValueOnce({ data: null, error: null });

    generateLinkMock.mockResolvedValueOnce({
      data: {
        user: { id: 'user-1', email: 'a@b.com' },
        properties: {
          hashed_token: INVITE_TOKEN,
          verification_type: 'invite',
          action_link: 'https://x.supabase.co/auth/v1/verify?token=raw',
        },
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
    const body = await res.json();
    expect(body).toMatchObject({ ok: true, isReturning: false });

    // Primary (invite) generateLink called once — no fallback needed
    expect(generateLinkMock).toHaveBeenCalledTimes(1);
    expect(generateLinkMock).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'invite', email: 'a@b.com' }),
    );
    expect(sendMock).toHaveBeenCalledOnce();
    const sendArgs = sendMock.mock.calls[0][0];
    // The HTML body must contain a link to our own /auth/callback with the
    // token_hash embedded — NOT the raw Supabase /auth/v1/verify action_link.
    expect(sendArgs.html).toContain('/auth/callback');
    expect(sendArgs.html).toContain(INVITE_TOKEN);
    expect(sendArgs.html).toContain('type=invite');
    expect(sendArgs.html).not.toContain('/auth/v1/verify');
    // New-user subject is the warm "You're in" line, not the old "Confirm your subscription".
    expect(sendArgs.subject).toMatch(/You(&#x27;|')re in/);
    // From is the "Noah at" friendly name on the verified hello@ mailbox.
    expect(sendArgs.from).toContain("Noah at School");
    expect(sendArgs.from).toContain('hello@schoolsout.net');
  });

  it('creates subscription + sends welcome-back email for RETURNING user (isReturning=true)', async () => {
    // public.users returns a row → returning user
    usersSelectMaybeSingleMock.mockResolvedValueOnce({ data: { id: 'user-2' }, error: null });

    // Primary type is magiclink now (returning) — succeeds on first call
    generateLinkMock.mockResolvedValueOnce({
      data: {
        user: { id: 'user-2', email: 'existing@b.com' },
        properties: {
          hashed_token: MAGIC_TOKEN,
          verification_type: 'magiclink',
          action_link: 'https://x.supabase.co/auth/v1/verify?token=raw2',
        },
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
    const body = await res.json();
    expect(body).toMatchObject({ ok: true, isReturning: true });

    // Exactly one generateLink call — the primary magiclink path.
    expect(generateLinkMock).toHaveBeenCalledTimes(1);
    expect(generateLinkMock.mock.calls[0][0]).toMatchObject({ type: 'magiclink' });
    expect(sendMock).toHaveBeenCalledOnce();
    const sendArgs = sendMock.mock.calls[0][0];
    expect(sendArgs.html).toContain('/auth/callback');
    expect(sendArgs.html).toContain(MAGIC_TOKEN);
    expect(sendArgs.html).toContain('type=magiclink');
    expect(sendArgs.subject).toMatch(/Qué bueno verte/);
  });

  it('still recovers via fallback link type when primary returns null user', async () => {
    // DECISION: Covers the safety-net branch — detection says "new" (invite)
    // but invite somehow fails (e.g. race, stale users row). Route falls back
    // to magiclink and still succeeds.
    usersSelectMaybeSingleMock.mockResolvedValueOnce({ data: null, error: null });

    // Primary (invite) — returns null user
    generateLinkMock.mockResolvedValueOnce({
      data: { user: null, properties: null },
      error: { message: 'User already registered' },
    });
    // Fallback (magiclink) — succeeds
    generateLinkMock.mockResolvedValueOnce({
      data: {
        user: { id: 'user-3', email: 'edge@b.com' },
        properties: {
          hashed_token: MAGIC_TOKEN,
          verification_type: 'magiclink',
          action_link: 'https://x.supabase.co/auth/v1/verify?token=raw3',
        },
      },
      error: null,
    });

    const { POST } = await import('@/app/api/reminders/subscribe/route');
    const res = await POST(new Request('http://localhost/api/reminders/subscribe', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        email: 'edge@b.com',
        school_id: '00000000-0000-0000-0000-000000000001',
        age_range: 'all',
        locale: 'en',
      }),
    }));

    expect(res.status).toBe(200);
    expect(generateLinkMock).toHaveBeenCalledTimes(2);
    expect(generateLinkMock.mock.calls[0][0]).toMatchObject({ type: 'invite' });
    expect(generateLinkMock.mock.calls[1][0]).toMatchObject({ type: 'magiclink' });
    expect(sendMock).toHaveBeenCalledOnce();
  });
});
