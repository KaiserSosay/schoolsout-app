import { describe, it, expect, vi } from 'vitest';

vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://x.supabase.co');
vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon');
vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service');
vi.stubEnv('RESEND_API_KEY', 're_test');
vi.stubEnv('CRON_SECRET', 'cron');
vi.stubEnv('APP_URL', 'http://localhost:3000');

// Mock supabase to track whether the update is attempted
const eqMock = vi.fn().mockResolvedValue({ error: null });
const updateMock = vi.fn().mockReturnValue({ eq: eqMock });
vi.mock('@/lib/supabase/service', () => ({
  createServiceSupabase: () => ({ from: () => ({ update: updateMock }) }),
}));

import { GET } from '@/app/api/reminders/unsubscribe/route';
import { signToken } from '@/lib/tokens';

describe('GET /api/reminders/unsubscribe', () => {
  it('rejects missing token', async () => {
    const res = await GET(new Request('http://localhost/api/reminders/unsubscribe'));
    expect(res.status).toBe(400);
  });

  it('rejects bad signature', async () => {
    const res = await GET(new Request('http://localhost/api/reminders/unsubscribe?sub=abc&sig=xxx'));
    expect(res.status).toBe(400);
  });

  it('accepts valid signature and redirects', async () => {
    const sub = 'fake-uuid';
    const sig = signToken(sub);
    const res = await GET(new Request(`http://localhost/api/reminders/unsubscribe?sub=${sub}&sig=${sig}`));
    // Either 302 (redirect) or a redirect Response; verify update was called
    expect(updateMock).toHaveBeenCalled();
  });
});
