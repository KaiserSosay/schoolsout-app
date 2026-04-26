import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://x.supabase.co');
vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon');
vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service');
vi.stubEnv('ADMIN_EMAILS', 'admin@example.com');
vi.stubEnv('APP_URL', 'http://localhost:3000');
vi.stubEnv('RESEND_API_KEY', 're_test');
vi.stubEnv('CRON_SECRET', 'cron');
vi.stubEnv('ADMIN_NOTIFY_EMAIL', 'notify@schoolsout.net');

const getUserMock = vi.fn();
const updateMock = vi.fn();
const updateResult: { data: Record<string, unknown> | null; error: { message: string } | null } = {
  data: { id: 'sub-1', status: 'approved' },
  error: null,
};

vi.mock('@/lib/supabase/server', () => ({
  createServerSupabase: () => ({
    auth: { getUser: getUserMock },
  }),
}));

vi.mock('@/lib/supabase/service', () => ({
  createServiceSupabase: () => ({
    from: (table: string) => {
      if (table === 'school_calendar_submissions') {
        return {
          update: (patch: Record<string, unknown>) => {
            updateMock(patch);
            return {
              eq: () => ({
                select: () => ({
                  single: () => Promise.resolve(updateResult),
                }),
              }),
            };
          },
        };
      }
      if (table === 'users') {
        // requireAdmin role lookup — return null so it falls back to env.
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: () => Promise.resolve({ data: null }),
            }),
          }),
        };
      }
      return {};
    },
  }),
}));

beforeEach(() => {
  getUserMock.mockReset();
  updateMock.mockReset();
  updateResult.data = { id: 'sub-1', status: 'approved' };
  updateResult.error = null;
});

describe('PATCH /api/admin/calendar-submissions/[id]', () => {
  it('rejects anonymous callers with 401', async () => {
    getUserMock.mockResolvedValueOnce({ data: { user: null } });
    const { PATCH } = await import(
      '@/app/api/admin/calendar-submissions/[id]/route'
    );
    const res = await PATCH(
      new Request('http://localhost/admin/calendar-submissions/sub-1', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'approved' }),
      }),
      { params: Promise.resolve({ id: 'sub-1' }) },
    );
    expect(res.status).toBe(401);
  });

  it('rejects non-admin users with 403', async () => {
    getUserMock.mockResolvedValueOnce({
      data: { user: { id: 'u', email: 'parent@example.com' } },
    });
    const { PATCH } = await import(
      '@/app/api/admin/calendar-submissions/[id]/route'
    );
    const res = await PATCH(
      new Request('http://localhost/admin/calendar-submissions/sub-1', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'approved' }),
      }),
      { params: Promise.resolve({ id: 'sub-1' }) },
    );
    expect(res.status).toBe(403);
  });

  it('rejects invalid status with 400', async () => {
    getUserMock.mockResolvedValueOnce({
      data: { user: { id: 'admin', email: 'admin@example.com' } },
    });
    const { PATCH } = await import(
      '@/app/api/admin/calendar-submissions/[id]/route'
    );
    const res = await PATCH(
      new Request('http://localhost/admin/calendar-submissions/sub-1', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'bogus' }),
      }),
      { params: Promise.resolve({ id: 'sub-1' }) },
    );
    expect(res.status).toBe(400);
  });

  it('flips status to approved and stamps reviewer + reviewed_at', async () => {
    getUserMock.mockResolvedValueOnce({
      data: { user: { id: 'admin-id', email: 'admin@example.com' } },
    });
    updateResult.data = { id: 'sub-1', status: 'approved' };
    const { PATCH } = await import(
      '@/app/api/admin/calendar-submissions/[id]/route'
    );
    const res = await PATCH(
      new Request('http://localhost/admin/calendar-submissions/sub-1', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'approved' }),
      }),
      { params: Promise.resolve({ id: 'sub-1' }) },
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.submission.status).toBe('approved');
    expect(updateMock).toHaveBeenCalledTimes(1);
    const patch = updateMock.mock.calls[0][0] as Record<string, unknown>;
    expect(patch.status).toBe('approved');
    expect(patch.reviewed_by).toBe('admin-id');
    expect(typeof patch.reviewed_at).toBe('string');
  });

  it('accepts incorporated and rejected status values', async () => {
    getUserMock.mockResolvedValue({
      data: { user: { id: 'admin-id', email: 'admin@example.com' } },
    });
    const { PATCH } = await import(
      '@/app/api/admin/calendar-submissions/[id]/route'
    );

    updateResult.data = { id: 'sub-1', status: 'incorporated' };
    const res1 = await PATCH(
      new Request('http://localhost/admin/calendar-submissions/sub-1', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'incorporated' }),
      }),
      { params: Promise.resolve({ id: 'sub-1' }) },
    );
    expect(res1.status).toBe(200);

    updateResult.data = { id: 'sub-1', status: 'rejected' };
    const res2 = await PATCH(
      new Request('http://localhost/admin/calendar-submissions/sub-1', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'rejected', review_notes: 'duplicate' }),
      }),
      { params: Promise.resolve({ id: 'sub-1' }) },
    );
    expect(res2.status).toBe(200);
    const lastPatch = updateMock.mock.calls.at(-1)?.[0] as Record<string, unknown>;
    expect(lastPatch.review_notes).toBe('duplicate');
  });

  it('returns 500 on db error', async () => {
    getUserMock.mockResolvedValueOnce({
      data: { user: { id: 'admin-id', email: 'admin@example.com' } },
    });
    updateResult.data = null;
    updateResult.error = { message: 'unique_violation' };
    const { PATCH } = await import(
      '@/app/api/admin/calendar-submissions/[id]/route'
    );
    const res = await PATCH(
      new Request('http://localhost/admin/calendar-submissions/sub-1', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'approved' }),
      }),
      { params: Promise.resolve({ id: 'sub-1' }) },
    );
    expect(res.status).toBe(500);
  });
});
