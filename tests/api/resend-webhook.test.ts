import { describe, it, expect, vi } from 'vitest';

vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://x.supabase.co');
vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon');
vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service');
vi.stubEnv('RESEND_API_KEY', 're_test');
vi.stubEnv('CRON_SECRET', 'cron');
vi.stubEnv('APP_URL', 'http://localhost:3000');

const eqMock = vi.fn().mockResolvedValue({ error: null });
const updateMock = vi.fn().mockReturnValue({ eq: eqMock });
vi.mock('@/lib/supabase/service', () => ({
  createServiceSupabase: () => ({ from: () => ({ update: updateMock }) }),
}));

import { POST } from '@/app/api/webhooks/resend/route';

describe('POST /api/webhooks/resend', () => {
  it('accepts email.opened event and updates reminder_sends.opened_at', async () => {
    const body = { type: 'email.opened', data: { email_id: 'abc', tags: [{ name: 'send_id', value: 'send-uuid' }] } };
    const res = await POST(new Request('http://localhost', { method: 'POST', body: JSON.stringify(body) }));
    expect(res.status).toBe(200);
    expect(updateMock).toHaveBeenCalled();
  });

  it('accepts email.clicked event', async () => {
    const body = { type: 'email.clicked', data: { tags: [{ name: 'send_id', value: 'send-uuid' }] } };
    const res = await POST(new Request('http://localhost', { method: 'POST', body: JSON.stringify(body) }));
    expect(res.status).toBe(200);
  });

  it('ignores unknown event types but returns 200', async () => {
    const body = { type: 'email.delivered', data: { tags: [{ name: 'send_id', value: 'send-uuid' }] } };
    const res = await POST(new Request('http://localhost', { method: 'POST', body: JSON.stringify(body) }));
    expect(res.status).toBe(200);
  });
});
