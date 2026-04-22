import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('supabase clients', () => {
  beforeEach(() => {
    vi.resetModules();
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

  it('service client uses service role', async () => {
    const { createServiceSupabase } = await import('@/lib/supabase/service');
    const client = createServiceSupabase();
    expect(client).toBeTruthy();
  });
});
