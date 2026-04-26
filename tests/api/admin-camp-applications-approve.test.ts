import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://x.supabase.co');
vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon');
vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service');
vi.stubEnv('RESEND_API_KEY', 're_test');
vi.stubEnv('CRON_SECRET', 'cron');
vi.stubEnv('APP_URL', 'http://localhost:3000');
vi.stubEnv('ADMIN_EMAILS', 'admin@example.com');

const getUserMock = vi.fn();
const insertCamp = vi.fn();
const updateApp = vi.fn();
const insertOperator = vi.fn();
const insertUser = vi.fn();
const userLookupResult: { data: { id: string } | null } = { data: null };
const sendEmailMock = vi.fn().mockResolvedValue({ data: { id: 'mail-1' }, error: null });

vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: { send: sendEmailMock },
  })),
}));

vi.mock('@/lib/supabase/server', () => ({
  createServerSupabase: () => ({
    auth: { getUser: getUserMock },
  }),
}));

vi.mock('@/lib/supabase/service', () => ({
  createServiceSupabase: () => ({
    from: (table: string) => {
      if (table === 'camp_applications') {
        return {
          // initial fetch of application
          select: () => ({
            eq: () => ({
              maybeSingle: () =>
                Promise.resolve({
                  data: {
                    id: 'app-1',
                    email: 'operator@example.com',
                    camp_name: 'Cool Camp',
                    status: 'pending',
                  },
                  error: null,
                }),
            }),
          }),
          // update to approved
          update: (_patch: Record<string, unknown>) => {
            updateApp(_patch);
            return {
              eq: () => Promise.resolve({ error: null }),
            };
          },
        };
      }
      if (table === 'camps') {
        return {
          insert: (payload: Record<string, unknown>) => {
            insertCamp(payload);
            return {
              select: () => ({
                maybeSingle: () =>
                  Promise.resolve({
                    data: { id: 'camp-new', slug: (payload as { slug: string }).slug },
                    error: null,
                  }),
              }),
            };
          },
        };
      }
      if (table === 'users') {
        return {
          // Lookup by email for operator-invite resolution
          select: () => ({
            eq: () => ({
              maybeSingle: () => Promise.resolve(userLookupResult),
            }),
          }),
          // Provisional insert when the operator's email isn't a user yet
          insert: (payload: Record<string, unknown>) => {
            insertUser(payload);
            return {
              select: () => ({
                maybeSingle: () =>
                  Promise.resolve({
                    data: { id: (payload as { id: string }).id },
                    error: null,
                  }),
              }),
            };
          },
        };
      }
      if (table === 'camp_operators') {
        return {
          insert: (payload: Record<string, unknown>) => {
            insertOperator(payload);
            return Promise.resolve({ data: null, error: null });
          },
        };
      }
      return {};
    },
  }),
}));

beforeEach(() => {
  getUserMock.mockReset();
  insertCamp.mockReset();
  updateApp.mockReset();
  insertOperator.mockReset();
  insertUser.mockReset();
  userLookupResult.data = null;
});

describe('POST /api/admin/camp-applications/[id]/approve', () => {
  it('rejects non-admin', async () => {
    getUserMock.mockResolvedValueOnce({
      data: { user: { id: 'u', email: 'nope@example.com' } },
    });
    const { POST } = await import(
      '@/app/api/admin/camp-applications/[id]/approve/route'
    );
    const res = await POST(
      new Request('http://localhost/approve', {
        method: 'POST',
        body: JSON.stringify({ camp_data: {} }),
      }),
      { params: { id: '00000000-0000-0000-0000-000000000001' } },
    );
    expect(res.status).toBe(403);
  });

  it('creates camp + flips application status + returns camp_id', async () => {
    getUserMock.mockResolvedValueOnce({
      data: { user: { id: 'admin', email: 'admin@example.com' } },
    });
    const { POST } = await import(
      '@/app/api/admin/camp-applications/[id]/approve/route'
    );
    const res = await POST(
      new Request('http://localhost/approve', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          camp_data: {
            name: 'Cool Camp',
            slug: 'cool-camp',
            description: 'A fun summer camp.',
            ages_min: 5,
            ages_max: 12,
            price_tier: '$$',
            categories: ['sports'],
            website_url: 'https://example.com',
            neighborhood: 'Coral Gables',
          },
        }),
      }),
      { params: { id: '00000000-0000-0000-0000-000000000001' } },
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.camp_id).toBe('camp-new');
    expect(body.slug).toBe('cool-camp');

    expect(insertCamp).toHaveBeenCalledTimes(1);
    const payload = insertCamp.mock.calls[0][0] as Record<string, unknown>;
    expect(payload.slug).toBe('cool-camp');
    expect(payload.verified).toBe(false);
    expect(payload.logistics_verified).toBe(false);

    expect(updateApp).toHaveBeenCalledTimes(1);
    const updatePatch = updateApp.mock.calls[0][0] as Record<string, unknown>;
    expect(updatePatch.status).toBe('approved');
    expect(updatePatch.reviewed_at).toBeTypeOf('string');

    // Phase 3.1: provisions a camp_operators row pointing at the new camp
    // and at a freshly-created users row for the applicant's email.
    expect(insertUser).toHaveBeenCalledTimes(1);
    const userPayload = insertUser.mock.calls[0][0] as Record<string, unknown>;
    expect(userPayload.email).toBe('operator@example.com');
    expect(userPayload.role).toBe('operator');

    expect(insertOperator).toHaveBeenCalledTimes(1);
    const opPayload = insertOperator.mock.calls[0][0] as Record<string, unknown>;
    expect(opPayload.camp_id).toBe('camp-new');
    expect(opPayload.role).toBe('owner');
    expect(opPayload.invite_token).toBeTypeOf('string');
    expect(typeof opPayload.invite_expires_at).toBe('string');
    // Email isn't sent unless ALLOW_OPERATOR_INVITE_EMAILS=true.
    expect(body.operator_invited).toBe(true);
    expect(body.operator_email_sent).toBe(false);
  });

  it('reuses existing users row when applicant email already has one', async () => {
    userLookupResult.data = { id: 'existing-user-id' };
    getUserMock.mockResolvedValueOnce({
      data: { user: { id: 'admin', email: 'admin@example.com' } },
    });
    const { POST } = await import(
      '@/app/api/admin/camp-applications/[id]/approve/route'
    );
    await POST(
      new Request('http://localhost/approve', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          camp_data: {
            name: 'Reuse Camp',
            slug: 'reuse-camp',
            ages_min: 5,
            ages_max: 12,
            price_tier: '$',
            categories: [],
          },
        }),
      }),
      { params: { id: '00000000-0000-0000-0000-000000000001' } },
    );
    // No new users row when the applicant already has one — operator just
    // points at the existing user_id.
    expect(insertUser).not.toHaveBeenCalled();
    expect(insertOperator).toHaveBeenCalledTimes(1);
    expect(insertOperator.mock.calls[0][0].user_id).toBe('existing-user-id');
  });

  it('422s ages_max < ages_min', async () => {
    getUserMock.mockResolvedValueOnce({
      data: { user: { id: 'admin', email: 'admin@example.com' } },
    });
    const { POST } = await import(
      '@/app/api/admin/camp-applications/[id]/approve/route'
    );
    const res = await POST(
      new Request('http://localhost/approve', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          camp_data: {
            name: 'Bad Camp',
            slug: 'bad-camp',
            ages_min: 10,
            ages_max: 5,
            price_tier: '$',
            categories: [],
          },
        }),
      }),
      { params: { id: '00000000-0000-0000-0000-000000000001' } },
    );
    expect(res.status).toBe(400);
  });
});
