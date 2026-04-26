import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://x.supabase.co');
vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon');
vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service');
vi.stubEnv('RESEND_API_KEY', 're_test');
vi.stubEnv('CRON_SECRET', 'cron');
vi.stubEnv('APP_URL', 'http://localhost:3000');
vi.stubEnv('ADMIN_NOTIFY_EMAIL', 'hi@schoolsout.net');

const sendMock = vi.fn().mockResolvedValue({ data: { id: 'mailid' }, error: null });
vi.mock('resend', () => ({
  Resend: class {
    emails = { send: sendMock };
  },
}));

const insertedRows: Array<Record<string, unknown>> = [];
const schoolByslug = new Map<string, { id: string; name: string; website: string | null }>();

vi.mock('@/lib/supabase/service', () => ({
  createServiceSupabase: () => ({
    from: (table: string) => {
      if (table === 'schools') {
        return {
          select: () => ({
            eq: (_col: string, val: string) => ({
              maybeSingle: async () => ({
                data: schoolByslug.get(val) ?? null,
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === 'school_calendar_submissions') {
        return {
          insert: (rows: Array<Record<string, unknown>>) => ({
            select: () => ({
              single: async () => {
                insertedRows.push(rows[0]);
                return { data: { id: 'sub-' + insertedRows.length, ...rows[0] }, error: null };
              },
            }),
          }),
        };
      }
      return {};
    },
  }),
}));

beforeEach(() => {
  sendMock.mockClear();
  insertedRows.length = 0;
  schoolByslug.clear();
});

async function callPost(slug: string, body: unknown, ip = '1.2.3.4') {
  const { POST } = await import(
    '@/app/api/schools/[slug]/calendar-submissions/route'
  );
  return POST(
    new Request(`http://localhost/api/schools/${slug}/calendar-submissions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': ip,
      },
      body: typeof body === 'string' ? body : JSON.stringify(body),
    }),
    { params: Promise.resolve({ slug }) },
  );
}

describe('POST /api/schools/[slug]/calendar-submissions', () => {
  it('creates a submission with domain_verified=true when emails match', async () => {
    schoolByslug.set('the-growing-place', {
      id: 'school-tgp',
      name: 'The Growing Place',
      website: 'https://www.thegrowingplace.school/',
    });
    const res = await callPost(
      'the-growing-place',
      {
        submitter_email: 'principal@thegrowingplace.school',
        submitter_role: 'principal',
        proposed_updates: 'Spring break is March 23-27, 2026.',
      },
      '10.0.0.1',
    );
    expect(res.status).toBe(201);
    const j = (await res.json()) as { id: string; domain_verified: boolean };
    expect(j.domain_verified).toBe(true);
    expect(insertedRows[0].domain_verified).toBe(true);
    expect(insertedRows[0].school_id).toBe('school-tgp');
    expect(insertedRows[0].submitter_role).toBe('principal');
    // Both submitter ack + admin notify get sent
    expect(sendMock).toHaveBeenCalledTimes(2);
  });

  it('creates a submission with domain_verified=false for parents', async () => {
    schoolByslug.set('the-growing-place', {
      id: 'school-tgp',
      name: 'The Growing Place',
      website: 'https://www.thegrowingplace.school/',
    });
    const res = await callPost(
      'the-growing-place',
      {
        submitter_email: 'mom@gmail.com',
        submitter_role: 'parent',
        proposed_updates: 'I have the PDF — happy to share.',
      },
      '10.0.0.2',
    );
    expect(res.status).toBe(201);
    const j = (await res.json()) as { domain_verified: boolean };
    expect(j.domain_verified).toBe(false);
  });

  it('returns 404 for unknown school slug', async () => {
    const res = await callPost(
      'no-such-school',
      {
        submitter_email: 'a@b.com',
        submitter_role: 'parent',
        proposed_updates: 'x',
      },
      '10.0.0.3',
    );
    expect(res.status).toBe(404);
  });

  it('returns 400 for missing email', async () => {
    schoolByslug.set('s1', { id: 'sch1', name: 'S', website: null });
    const res = await callPost(
      's1',
      { submitter_role: 'parent', proposed_updates: 'x' },
      '10.0.0.4',
    );
    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid role', async () => {
    schoolByslug.set('s1', { id: 'sch1', name: 'S', website: null });
    const res = await callPost(
      's1',
      {
        submitter_email: 'a@b.com',
        submitter_role: 'hacker',
        proposed_updates: 'x',
      },
      '10.0.0.5',
    );
    expect(res.status).toBe(400);
  });

  it('returns 400 for empty proposed_updates', async () => {
    schoolByslug.set('s1', { id: 'sch1', name: 'S', website: null });
    const res = await callPost(
      's1',
      {
        submitter_email: 'a@b.com',
        submitter_role: 'parent',
        proposed_updates: '',
      },
      '10.0.0.6',
    );
    expect(res.status).toBe(400);
  });

  it('rate-limits to 3 submissions per IP per hour (4th gets 429)', async () => {
    schoolByslug.set('s1', { id: 'sch1', name: 'S', website: null });
    const ip = '10.99.99.99';
    const body = {
      submitter_email: 'a@b.com',
      submitter_role: 'parent' as const,
      proposed_updates: 'something',
    };
    expect((await callPost('s1', body, ip)).status).toBe(201);
    expect((await callPost('s1', body, ip)).status).toBe(201);
    expect((await callPost('s1', body, ip)).status).toBe(201);
    expect((await callPost('s1', body, ip)).status).toBe(429);
    // Different IP — still allowed
    expect((await callPost('s1', body, '10.99.99.100')).status).toBe(201);
  });
});
