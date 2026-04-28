import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the auth + DB layers BEFORE importing the action so the module-
// scope imports inside actions.ts pick up our mocks.
vi.mock('@/lib/auth/requireAdmin', () => ({
  requireAdminPage: vi.fn(),
}));
vi.mock('@/lib/supabase/service', () => ({
  createServiceSupabase: vi.fn(),
}));
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

import { requireAdminPage } from '@/lib/auth/requireAdmin';
import { createServiceSupabase } from '@/lib/supabase/service';
import { updateCampSimpleFields } from '@/app/[locale]/admin/camps/[slug]/edit/actions';

const requireAdminMock = vi.mocked(requireAdminPage);
const createServiceMock = vi.mocked(createServiceSupabase);

type MockClient = {
  from: ReturnType<typeof vi.fn>;
};

function buildMockClient(opts: {
  current?: { featured_until: string | null } | null;
  readError?: { message: string } | null;
  updateError?: { message: string } | null;
}): { client: MockClient; updateSpy: ReturnType<typeof vi.fn> } {
  const updateSpy = vi.fn().mockReturnValue({
    eq: vi.fn().mockResolvedValue({ error: opts.updateError ?? null }),
  });

  const fromSpy = vi.fn((_table: string) => {
    return {
      select: () => ({
        eq: () => ({
          maybeSingle: () =>
            Promise.resolve({
              data: opts.current ?? null,
              error: opts.readError ?? null,
            }),
        }),
      }),
      update: updateSpy,
    };
  });

  return { client: { from: fromSpy } as MockClient, updateSpy };
}

const validInput = {
  slug: 'the-growing-place-summer-camp',
  tagline: 'Stomp, chomp, ROAR!',
  phone: '(305) 446-0846',
  email: 'mwilburn@firstcoralgables.org',
  registration_url: 'https://www.thegrowingplace.school/summer-camp',
  is_featured: false,
};

beforeEach(() => {
  requireAdminMock.mockReset();
  requireAdminMock.mockResolvedValue({
    user: { id: 'admin-id', email: 'admin@example.com' },
    role: 'admin',
  });
  createServiceMock.mockReset();
});

describe('updateCampSimpleFields', () => {
  it('updates the 5 fields when called with valid input', async () => {
    const { client, updateSpy } = buildMockClient({
      current: { featured_until: null },
    });
    createServiceMock.mockReturnValue(client as never);

    const result = await updateCampSimpleFields(validInput);

    expect(result).toEqual({ ok: true });
    expect(requireAdminMock).toHaveBeenCalledTimes(1);
    expect(updateSpy).toHaveBeenCalledTimes(1);
    const patch = updateSpy.mock.calls[0][0];
    expect(patch.tagline).toBe('Stomp, chomp, ROAR!');
    expect(patch.phone).toBe('(305) 446-0846');
    expect(patch.email).toBe('mwilburn@firstcoralgables.org');
    expect(patch.registration_url).toBe(
      'https://www.thegrowingplace.school/summer-camp',
    );
    expect(patch.is_featured).toBe(false);
    // is_featured stayed false → never set featured_until
    expect(patch.featured_until).toBeUndefined();
  });

  it('returns errors for invalid email', async () => {
    const { client } = buildMockClient({ current: { featured_until: null } });
    createServiceMock.mockReturnValue(client as never);

    const result = await updateCampSimpleFields({
      ...validInput,
      email: 'not-an-email',
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.email).toBeDefined();
    }
  });

  it('returns errors for non-http registration URL', async () => {
    const { client } = buildMockClient({ current: { featured_until: null } });
    createServiceMock.mockReturnValue(client as never);

    const result = await updateCampSimpleFields({
      ...validInput,
      registration_url: 'thegrowingplace.school',
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.registration_url).toBeDefined();
    }
  });

  it('returns errors when tagline exceeds 200 chars', async () => {
    const { client } = buildMockClient({ current: { featured_until: null } });
    createServiceMock.mockReturnValue(client as never);

    const result = await updateCampSimpleFields({
      ...validInput,
      tagline: 'x'.repeat(201),
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.tagline).toBeDefined();
    }
  });

  it('sets featured_until ~90 days out when is_featured flips ON without existing future date', async () => {
    const { client, updateSpy } = buildMockClient({
      current: { featured_until: null },
    });
    createServiceMock.mockReturnValue(client as never);

    const before = Date.now();
    await updateCampSimpleFields({ ...validInput, is_featured: true });
    const after = Date.now();

    const patch = updateSpy.mock.calls[0][0];
    expect(patch.featured_until).toBeDefined();
    const set = new Date(patch.featured_until).getTime();
    const expectedMin = before + 89 * 24 * 60 * 60 * 1000;
    const expectedMax = after + 91 * 24 * 60 * 60 * 1000;
    expect(set).toBeGreaterThanOrEqual(expectedMin);
    expect(set).toBeLessThanOrEqual(expectedMax);
  });

  it('preserves existing future featured_until when is_featured stays true (R5)', async () => {
    const future = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
    const { client, updateSpy } = buildMockClient({
      current: { featured_until: future },
    });
    createServiceMock.mockReturnValue(client as never);

    await updateCampSimpleFields({ ...validInput, is_featured: true });

    const patch = updateSpy.mock.calls[0][0];
    // Action did NOT include featured_until in the patch — leaving the
    // existing future date intact.
    expect(patch.featured_until).toBeUndefined();
  });

  it('refreshes featured_until when existing date is in the past', async () => {
    const past = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { client, updateSpy } = buildMockClient({
      current: { featured_until: past },
    });
    createServiceMock.mockReturnValue(client as never);

    await updateCampSimpleFields({ ...validInput, is_featured: true });

    const patch = updateSpy.mock.calls[0][0];
    expect(patch.featured_until).toBeDefined();
    expect(new Date(patch.featured_until).getTime()).toBeGreaterThan(Date.now());
  });

  it('returns _form error when the camp slug does not exist', async () => {
    const { client } = buildMockClient({ current: null });
    createServiceMock.mockReturnValue(client as never);

    const result = await updateCampSimpleFields(validInput);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors._form).toBeDefined();
    }
  });

  it('returns _form error when DB update fails', async () => {
    const { client } = buildMockClient({
      current: { featured_until: null },
      updateError: { message: 'connection lost' },
    });
    createServiceMock.mockReturnValue(client as never);

    const result = await updateCampSimpleFields(validInput);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors._form).toBe('connection lost');
    }
  });

  it('coerces empty strings to null before persisting', async () => {
    const { client, updateSpy } = buildMockClient({
      current: { featured_until: null },
    });
    createServiceMock.mockReturnValue(client as never);

    await updateCampSimpleFields({
      ...validInput,
      tagline: '   ',
      phone: '',
      email: '',
      registration_url: '',
    });

    const patch = updateSpy.mock.calls[0][0];
    expect(patch.tagline).toBeNull();
    expect(patch.phone).toBeNull();
    expect(patch.email).toBeNull();
    expect(patch.registration_url).toBeNull();
  });
});
