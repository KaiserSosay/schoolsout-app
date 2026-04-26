import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://x.supabase.co');
vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon');
vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service');
vi.stubEnv('RESEND_API_KEY', 're_test');
vi.stubEnv('CRON_SECRET', 'cron');
vi.stubEnv('APP_URL', 'http://localhost:3000');

const signInWithPasswordMock = vi.fn();
const updateUserMock = vi.fn();
const getUserMock = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createServerSupabase: () => ({
    auth: {
      signInWithPassword: (
        ...args: Parameters<typeof signInWithPasswordMock>
      ) => signInWithPasswordMock(...args),
      updateUser: (...args: Parameters<typeof updateUserMock>) =>
        updateUserMock(...args),
      getUser: getUserMock,
    },
  }),
}));

beforeEach(() => {
  signInWithPasswordMock.mockReset();
  updateUserMock.mockReset();
  getUserMock.mockReset();
});

async function callSignIn(body: unknown) {
  const { POST } = await import(
    '@/app/api/auth/sign-in-with-password/route'
  );
  return POST(
    new Request('http://localhost/api/auth/sign-in-with-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: typeof body === 'string' ? body : JSON.stringify(body),
    }),
  );
}

async function callSetPassword(body: unknown) {
  const { POST } = await import('@/app/api/auth/set-password/route');
  return POST(
    new Request('http://localhost/api/auth/set-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: typeof body === 'string' ? body : JSON.stringify(body),
    }),
  );
}

describe('POST /api/auth/sign-in-with-password', () => {
  it('rejects invalid body (400)', async () => {
    const res = await callSignIn({ email: 'not-an-email', password: 'short' });
    expect(res.status).toBe(400);
  });

  it('passes email + password to Supabase signInWithPassword', async () => {
    signInWithPasswordMock.mockResolvedValue({
      data: { session: { access_token: 't' } },
      error: null,
    });
    const res = await callSignIn({
      email: 'mom@example.com',
      password: 'miamicoralgables',
    });
    expect(res.status).toBe(200);
    expect(signInWithPasswordMock).toHaveBeenCalledWith({
      email: 'mom@example.com',
      password: 'miamicoralgables',
    });
  });

  it('returns 401 when Supabase rejects credentials', async () => {
    signInWithPasswordMock.mockResolvedValue({
      data: { session: null },
      error: { message: 'Invalid login credentials' },
    });
    const res = await callSignIn({
      email: 'mom@example.com',
      password: 'wrongpassword',
    });
    expect(res.status).toBe(401);
    const j = (await res.json()) as { error: string };
    expect(j.error).toBe('invalid_credentials');
  });
});

describe('POST /api/auth/set-password', () => {
  it('rejects unauthenticated callers (401)', async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });
    const res = await callSetPassword({ password: 'miamicoralgables' });
    expect(res.status).toBe(401);
  });

  it('rejects passwords shorter than 8 characters (400)', async () => {
    getUserMock.mockResolvedValue({
      data: { user: { id: 'u1', email: 'mom@example.com' } },
    });
    const res = await callSetPassword({ password: 'short' });
    expect(res.status).toBe(400);
    const j = (await res.json()) as { error: string };
    expect(j.error).toBe('too_short');
  });

  it('rejects common passwords (400)', async () => {
    getUserMock.mockResolvedValue({
      data: { user: { id: 'u1', email: 'mom@example.com' } },
    });
    const res = await callSetPassword({ password: 'password' });
    expect(res.status).toBe(400);
    const j = (await res.json()) as { error: string };
    expect(j.error).toBe('too_common');
  });

  it('updates the auth user when password is valid + caller authed', async () => {
    getUserMock.mockResolvedValue({
      data: { user: { id: 'u1', email: 'mom@example.com' } },
    });
    updateUserMock.mockResolvedValue({ data: { user: {} }, error: null });
    const res = await callSetPassword({ password: 'miamicoralgables' });
    expect(res.status).toBe(200);
    expect(updateUserMock).toHaveBeenCalledWith({
      password: 'miamicoralgables',
    });
  });
});
