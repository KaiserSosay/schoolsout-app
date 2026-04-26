import { describe, it, expect, vi, beforeEach } from 'vitest';

const createBrowserClientMock = vi.fn(() => ({}));
vi.mock('@supabase/ssr', () => ({
  createBrowserClient: (...args: unknown[]) => createBrowserClientMock(...args),
}));

describe('supabase clients', () => {
  beforeEach(() => {
    vi.resetModules();
    createBrowserClientMock.mockClear();
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://x.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service');
    vi.stubEnv('RESEND_API_KEY', 're_test');
    vi.stubEnv('CRON_SECRET', 'cron');
    vi.stubEnv('APP_URL', 'http://localhost:3000');
  });

  it('browser client factory is a function', async () => {
    const { createBrowserSupabase } = await import('@/lib/supabase/browser');
    expect(typeof createBrowserSupabase).toBe('function');
  });

  it('browser client passes explicit session-persistence auth options', async () => {
    const { createBrowserSupabase } = await import('@/lib/supabase/browser');
    createBrowserSupabase();
    expect(createBrowserClientMock).toHaveBeenCalledTimes(1);
    const call = createBrowserClientMock.mock.calls[0];
    expect(call[0]).toBe('https://x.supabase.co');
    expect(call[1]).toBe('anon');
    const opts = call[2] as { auth?: Record<string, unknown> } | undefined;
    expect(opts?.auth).toEqual({
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
    });
  });

  it('service client uses service role', async () => {
    const { createServiceSupabase } = await import('@/lib/supabase/service');
    const client = createServiceSupabase();
    expect(client).toBeTruthy();
  });
});
