import { describe, it, expect, vi, beforeEach } from 'vitest';

beforeEach(() => {
  vi.resetModules();
});

describe('isAdminEmail', () => {
  it('returns false for empty allowlist', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://x.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service');
    vi.stubEnv('RESEND_API_KEY', 're_test');
    vi.stubEnv('CRON_SECRET', 'cron');
    vi.stubEnv('APP_URL', 'http://localhost:3000');
    vi.stubEnv('ADMIN_EMAILS', '');
    const { isAdminEmail } = await import('@/lib/admin');
    expect(isAdminEmail('rkscarlett@gmail.com')).toBe(false);
    expect(isAdminEmail(null)).toBe(false);
  });

  it('returns true only for allowlisted emails (case-insensitive)', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://x.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service');
    vi.stubEnv('RESEND_API_KEY', 're_test');
    vi.stubEnv('CRON_SECRET', 'cron');
    vi.stubEnv('APP_URL', 'http://localhost:3000');
    vi.stubEnv('ADMIN_EMAILS', 'admin@example.com, other@example.com ');
    const { isAdminEmail } = await import('@/lib/admin');
    expect(isAdminEmail('ADMIN@example.com')).toBe(true);
    expect(isAdminEmail('other@example.com')).toBe(true);
    expect(isAdminEmail('nobody@example.com')).toBe(false);
  });
});
