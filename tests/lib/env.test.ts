import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('env', () => {
  beforeEach(() => { vi.resetModules(); });

  it('throws on missing required var', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '');
    await expect(import('@/lib/env')).rejects.toThrow(/NEXT_PUBLIC_SUPABASE_URL/);
  });

  it('returns parsed env when all present', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://x.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service');
    vi.stubEnv('RESEND_API_KEY', 're_test');
    vi.stubEnv('CRON_SECRET', 'cron');
    vi.stubEnv('APP_URL', 'http://localhost:3000');
    const { env } = await import('@/lib/env');
    expect(env.NEXT_PUBLIC_SUPABASE_URL).toBe('https://x.supabase.co');
  });
});
