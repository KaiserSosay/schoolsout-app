import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://x.supabase.co');
vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon');
vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service');
vi.stubEnv('RESEND_API_KEY', 're_test');
vi.stubEnv('CRON_SECRET', 'cron');
vi.stubEnv('APP_URL', 'http://localhost:3000');

const sendMock = vi.fn().mockResolvedValue({ data: { id: 'x' }, error: null });
vi.mock('resend', () => ({ Resend: class { emails = { send: sendMock }; } }));

const MAGIC_TOKEN = 'magic-token-xyz';
const INVITE_TOKEN = 'invite-token-abc';

const generateLinkMock = vi.fn();
const usersSelectMaybeSingleMock = vi.fn();
const operatorsResult: { data: Array<{ camps: { slug: string } | null }> } = {
  data: [],
};

vi.mock('@/lib/supabase/service', () => ({
  createServiceSupabase: () => ({
    auth: { admin: { generateLink: generateLinkMock } },
    from: (table: string) => {
      if (table === 'users') {
        return {
          select: () => ({
            eq: () => ({ maybeSingle: usersSelectMaybeSingleMock }),
          }),
        };
      }
      if (table === 'camp_operators') {
        // Phase 3.1: chained .select().eq().order().limit() returning rows.
        return {
          select: () => ({
            eq: () => ({
              order: () => ({
                limit: () => Promise.resolve(operatorsResult),
              }),
            }),
          }),
        };
      }
      return {};
    },
  }),
}));

beforeEach(() => {
  sendMock.mockClear();
  generateLinkMock.mockReset();
  usersSelectMaybeSingleMock.mockReset();
  operatorsResult.data = [];
});

describe('POST /api/auth/sign-in', () => {
  it('rejects an invalid payload', async () => {
    const { POST } = await import('@/app/api/auth/sign-in/route');
    const res = await POST(
      new Request('http://localhost/api/auth/sign-in', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ locale: 'en' }),
      }),
    );
    expect(res.status).toBe(400);
  });

  it('sends a magiclink + WelcomeBack email for a returning user', async () => {
    usersSelectMaybeSingleMock.mockResolvedValueOnce({
      data: { id: 'user-1' },
      error: null,
    });
    generateLinkMock.mockResolvedValueOnce({
      data: {
        user: { id: 'user-1', email: 'r@b.com' },
        properties: {
          hashed_token: MAGIC_TOKEN,
          verification_type: 'magiclink',
          action_link: 'https://x.supabase.co/auth/v1/verify?token=raw',
        },
      },
      error: null,
    });

    const { POST } = await import('@/app/api/auth/sign-in/route');
    const res = await POST(
      new Request('http://localhost/api/auth/sign-in', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          email: 'r@b.com',
          locale: 'en',
          next: '/en/app/camps/frost-science',
        }),
      }),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({ ok: true, isReturning: true });

    expect(generateLinkMock).toHaveBeenCalledTimes(1);
    expect(generateLinkMock.mock.calls[0][0]).toMatchObject({ type: 'magiclink' });

    expect(sendMock).toHaveBeenCalledOnce();
    const sendArgs = sendMock.mock.calls[0][0];
    expect(sendArgs.html).toContain('/auth/callback');
    expect(sendArgs.html).toContain(MAGIC_TOKEN);
    expect(sendArgs.html).toContain('type=magiclink');
    // next param must be preserved through the magic link
    expect(sendArgs.html).toContain(encodeURIComponent('/en/app/camps/frost-science'));
    expect(sendArgs.subject).toMatch(/Welcome back/i);
  });

  it('sends an invite + Welcome email for an unknown email', async () => {
    usersSelectMaybeSingleMock.mockResolvedValueOnce({ data: null, error: null });
    generateLinkMock.mockResolvedValueOnce({
      data: {
        user: { id: 'user-2', email: 'new@b.com' },
        properties: {
          hashed_token: INVITE_TOKEN,
          verification_type: 'invite',
          action_link: 'https://x.supabase.co/auth/v1/verify?token=raw2',
        },
      },
      error: null,
    });

    const { POST } = await import('@/app/api/auth/sign-in/route');
    const res = await POST(
      new Request('http://localhost/api/auth/sign-in', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: 'new@b.com', locale: 'en' }),
      }),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({ ok: true, isReturning: false });
    expect(generateLinkMock.mock.calls[0][0]).toMatchObject({ type: 'invite' });
    const sendArgs = sendMock.mock.calls[0][0];
    expect(sendArgs.html).toContain(INVITE_TOKEN);
    expect(sendArgs.html).toContain('type=invite');
    // missing/invalid next falls back to /en/app
    expect(sendArgs.html).toContain(encodeURIComponent('/en/app'));
  });

  it('falls back to a magiclink when invite generation returns no token', async () => {
    usersSelectMaybeSingleMock.mockResolvedValueOnce({ data: null, error: null });
    generateLinkMock.mockResolvedValueOnce({
      data: { user: null, properties: null },
      error: { message: 'User already registered' },
    });
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

    const { POST } = await import('@/app/api/auth/sign-in/route');
    const res = await POST(
      new Request('http://localhost/api/auth/sign-in', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: 'edge@b.com', locale: 'en' }),
      }),
    );
    expect(res.status).toBe(200);
    expect(generateLinkMock).toHaveBeenCalledTimes(2);
  });

  it('routes operators to /{locale}/operator/{slug} when no explicit next is set', async () => {
    usersSelectMaybeSingleMock.mockResolvedValueOnce({
      data: { id: 'op-user' },
      error: null,
    });
    operatorsResult.data = [{ camps: { slug: 'cool-camp' } }];
    generateLinkMock.mockResolvedValueOnce({
      data: {
        user: { id: 'op-user', email: 'op@example.com' },
        properties: {
          hashed_token: MAGIC_TOKEN,
          verification_type: 'magiclink',
          action_link: 'https://x.supabase.co/auth/v1/verify?token=raw',
        },
      },
      error: null,
    });
    const { POST } = await import('@/app/api/auth/sign-in/route');
    await POST(
      new Request('http://localhost/api/auth/sign-in', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: 'op@example.com', locale: 'en' }),
      }),
    );
    const sendArgs = sendMock.mock.calls[0][0];
    // Default `next` is the operator dashboard, not /en/app.
    expect(sendArgs.html).toContain(encodeURIComponent('/en/operator/cool-camp'));
    expect(sendArgs.html).not.toContain(encodeURIComponent('/en/app"'));
  });

  it('explicit next= still wins over operator default', async () => {
    usersSelectMaybeSingleMock.mockResolvedValueOnce({
      data: { id: 'op-user' },
      error: null,
    });
    operatorsResult.data = [{ camps: { slug: 'cool-camp' } }];
    generateLinkMock.mockResolvedValueOnce({
      data: {
        user: { id: 'op-user', email: 'op@example.com' },
        properties: {
          hashed_token: MAGIC_TOKEN,
          verification_type: 'magiclink',
          action_link: 'https://x.supabase.co/auth/v1/verify?token=raw',
        },
      },
      error: null,
    });
    const { POST } = await import('@/app/api/auth/sign-in/route');
    await POST(
      new Request('http://localhost/api/auth/sign-in', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          email: 'op@example.com',
          locale: 'en',
          next: '/en/app/saved',
        }),
      }),
    );
    const sendArgs = sendMock.mock.calls[0][0];
    expect(sendArgs.html).toContain(encodeURIComponent('/en/app/saved'));
    expect(sendArgs.html).not.toContain(encodeURIComponent('/en/operator/cool-camp'));
  });

  it('rejects a foreign next= value and falls back to the locale app root', async () => {
    usersSelectMaybeSingleMock.mockResolvedValueOnce({ data: { id: 'u' }, error: null });
    generateLinkMock.mockResolvedValueOnce({
      data: {
        user: { id: 'u', email: 'a@b.com' },
        properties: {
          hashed_token: MAGIC_TOKEN,
          verification_type: 'magiclink',
          action_link: 'https://x.supabase.co/auth/v1/verify?token=raw',
        },
      },
      error: null,
    });
    const { POST } = await import('@/app/api/auth/sign-in/route');
    await POST(
      new Request('http://localhost/api/auth/sign-in', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          email: 'a@b.com',
          locale: 'es',
          next: 'https://evil.example.com/steal',
        }),
      }),
    );
    const sendArgs = sendMock.mock.calls[0][0];
    expect(sendArgs.html).toContain(encodeURIComponent('/es/app'));
    expect(sendArgs.html).not.toContain('evil.example.com');
  });
});
