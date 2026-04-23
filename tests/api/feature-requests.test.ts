import { describe, it, expect, vi, beforeEach } from 'vitest';

// Env must be stubbed before the env module gets accessed.
vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://x.supabase.co');
vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon');
vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service');
vi.stubEnv('RESEND_API_KEY', 're_test');
vi.stubEnv('CRON_SECRET', 'cron');
vi.stubEnv('APP_URL', 'http://localhost:3000');
vi.stubEnv('ADMIN_EMAILS', 'admin@test.com');
vi.stubEnv('ADMIN_NOTIFY_EMAIL', 'notify@schoolsout.net');

const sendMock = vi.fn().mockResolvedValue({ data: { id: 'x' }, error: null });
vi.mock('resend', () => ({ Resend: class { emails = { send: sendMock }; } }));

// --- Supabase mocks ----------------------------------------------------------
type Ctx = { user: { id: string; email: string } | null };
const serverCtx: Ctx = { user: null };
vi.mock('@/lib/supabase/server', () => ({
  createServerSupabase: () => ({
    auth: { getUser: async () => ({ data: { user: serverCtx.user } }) },
  }),
}));

const insertSelectSingleMock = vi.fn();
const usersSelectMock = vi.fn().mockReturnValue({
  eq: () => ({ maybeSingle: async () => ({ data: { display_name: 'Ada' } }) }),
});
const updateSelectSingleMock = vi.fn();
const loadMaybeSingleMock = vi.fn();

const fromMock = vi.fn((table: string) => {
  if (table === 'feature_requests') {
    return {
      insert: () => ({ select: () => ({ single: insertSelectSingleMock }) }),
      update: () => ({
        eq: () => ({ select: () => ({ single: updateSelectSingleMock }) }),
      }),
      select: () => ({ eq: () => ({ maybeSingle: loadMaybeSingleMock }) }),
    };
  }
  if (table === 'users') {
    return { select: usersSelectMock };
  }
  return {};
});
vi.mock('@/lib/supabase/service', () => ({
  createServiceSupabase: () => ({ from: fromMock }),
}));

beforeEach(() => {
  sendMock.mockClear();
  insertSelectSingleMock.mockReset();
  updateSelectSingleMock.mockReset();
  loadMaybeSingleMock.mockReset();
  serverCtx.user = null;
});

describe('POST /api/feature-requests', () => {
  it('rejects when body is missing', async () => {
    const { POST } = await import('@/app/api/feature-requests/route');
    const res = await POST(new Request('http://localhost/api/feature-requests', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({}),
    }));
    expect(res.status).toBe(400);
  });

  it('rejects anonymous submit without an email', async () => {
    const { POST } = await import('@/app/api/feature-requests/route');
    const res = await POST(new Request('http://localhost/api/feature-requests', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ category: 'idea', body: 'more cowbell', locale: 'en' }),
    }));
    expect(res.status).toBe(400);
  });

  it('inserts anonymous submission when email supplied + fires notify email', async () => {
    insertSelectSingleMock.mockResolvedValueOnce({ data: { id: 'fr-1' }, error: null });
    const { POST } = await import('@/app/api/feature-requests/route');
    const res = await POST(new Request('http://localhost/api/feature-requests', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        category: 'bug',
        body: 'calendar shows wrong date',
        email: 'parent@example.com',
        locale: 'en',
        page_path: '/en/app/calendar',
      }),
    }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.id).toBe('fr-1');
    expect(sendMock).toHaveBeenCalledOnce();
    const args = sendMock.mock.calls[0][0];
    expect(args.to).toBe('notify@schoolsout.net');
    expect(args.subject).toContain('🐛');
  });

  it('attaches user_id when the submitter is logged in', async () => {
    serverCtx.user = { id: 'u1', email: 'logged@in.com' };
    insertSelectSingleMock.mockResolvedValueOnce({ data: { id: 'fr-2' }, error: null });
    const { POST } = await import('@/app/api/feature-requests/route');
    const res = await POST(new Request('http://localhost/api/feature-requests', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ category: 'idea', body: 'love this', locale: 'en' }),
    }));
    expect(res.status).toBe(200);
    // Subject still fires for admin notify
    expect(sendMock).toHaveBeenCalledOnce();
  });
});

describe('PATCH /api/admin/feature-requests/[id]', () => {
  it('returns 401 for non-admin callers', async () => {
    serverCtx.user = { id: 'u1', email: 'not-admin@test.com' };
    const { PATCH } = await import('@/app/api/admin/feature-requests/[id]/route');
    const res = await PATCH(
      new Request('http://localhost/api/admin/feature-requests/1', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ status: 'shipped' }),
      }),
      { params: Promise.resolve({ id: 'fr-1' }) },
    );
    expect(res.status).toBe(401);
  });

  it('updates status + sends reply email when send_reply=true', async () => {
    serverCtx.user = { id: 'admin-1', email: 'admin@test.com' };
    loadMaybeSingleMock.mockResolvedValueOnce({
      data: {
        id: 'fr-1',
        email: 'parent@example.com',
        user_id: null,
        locale: 'en',
        body: 'the original',
        admin_response: null,
        status: 'new',
      },
      error: null,
    });
    updateSelectSingleMock.mockResolvedValueOnce({
      data: {
        id: 'fr-1',
        email: 'parent@example.com',
        user_id: null,
        locale: 'en',
        body: 'the original',
        admin_response: 'great idea',
        admin_responded_at: '2026-04-23T00:00:00Z',
        status: 'shipped',
      },
      error: null,
    });
    const { PATCH } = await import('@/app/api/admin/feature-requests/[id]/route');
    const res = await PATCH(
      new Request('http://localhost/api/admin/feature-requests/fr-1', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ status: 'shipped', admin_response: 'great idea', send_reply: true }),
      }),
      { params: Promise.resolve({ id: 'fr-1' }) },
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.emailSent).toBe(true);
    expect(sendMock).toHaveBeenCalledOnce();
    const args = sendMock.mock.calls[0][0];
    expect(args.to).toBe('parent@example.com');
    expect(args.subject).toContain('Noah');
  });

  it('does not send email when send_reply is missing', async () => {
    serverCtx.user = { id: 'admin-1', email: 'admin@test.com' };
    loadMaybeSingleMock.mockResolvedValueOnce({
      data: {
        id: 'fr-1',
        email: 'parent@example.com',
        user_id: null,
        locale: 'en',
        body: 'x',
        admin_response: null,
        status: 'new',
      },
      error: null,
    });
    updateSelectSingleMock.mockResolvedValueOnce({
      data: {
        id: 'fr-1',
        email: 'parent@example.com',
        user_id: null,
        locale: 'en',
        body: 'x',
        admin_response: 'draft',
        admin_responded_at: '2026-04-23T00:00:00Z',
        status: 'acknowledged',
      },
      error: null,
    });
    const { PATCH } = await import('@/app/api/admin/feature-requests/[id]/route');
    const res = await PATCH(
      new Request('http://localhost/api/admin/feature-requests/fr-1', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          status: 'acknowledged',
          admin_response: 'draft',
        }),
      }),
      { params: Promise.resolve({ id: 'fr-1' }) },
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.emailSent).toBe(false);
    expect(sendMock).not.toHaveBeenCalled();
  });
});
