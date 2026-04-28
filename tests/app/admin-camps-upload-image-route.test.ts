import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextResponse } from 'next/server';

vi.mock('@/lib/auth/requireAdmin', () => ({
  requireAdminApi: vi.fn(),
}));
vi.mock('@/lib/supabase/service', () => ({
  createServiceSupabase: vi.fn(),
}));

import { requireAdminApi } from '@/lib/auth/requireAdmin';
import { createServiceSupabase } from '@/lib/supabase/service';
import { POST } from '@/app/api/admin/camps/[slug]/upload-image/route';

const requireAdminMock = vi.mocked(requireAdminApi);
const createServiceMock = vi.mocked(createServiceSupabase);

function buildStorageMock(opts: { uploadError?: { message: string } | null } = {}) {
  const upload = vi
    .fn()
    .mockResolvedValue({ data: { path: 'p' }, error: opts.uploadError ?? null });
  const getPublicUrl = vi.fn().mockReturnValue({
    data: {
      publicUrl:
        'https://supabase.example/storage/v1/object/public/camp-logos/x/123.png',
    },
  });
  const from = vi.fn().mockReturnValue({ upload, getPublicUrl });
  return {
    client: { storage: { from } },
    upload,
    getPublicUrl,
    from,
  };
}

function buildForm({
  bucket,
  file,
  fileName = 'logo.png',
  type = 'image/png',
  size,
}: {
  bucket?: string;
  file?: File | null;
  fileName?: string;
  type?: string;
  size?: number;
}) {
  const form = new FormData();
  if (bucket !== undefined) form.set('bucket', bucket);
  if (file === undefined) {
    const bytes = new Uint8Array(size ?? 256);
    form.set('image', new File([bytes], fileName, { type }));
  } else if (file) {
    form.set('image', file);
  }
  return form;
}

// jsdom's Request + multipart FormData round-trip hangs in vitest, so
// we hand the route a Request-shaped object that resolves formData()
// directly. The route only ever calls req.formData(); nothing else.
function makeRequest(form: FormData): Request {
  return {
    formData: () => Promise.resolve(form),
  } as unknown as Request;
}

const ctxFor = (slug: string) => ({ params: Promise.resolve({ slug }) });

beforeEach(() => {
  requireAdminMock.mockReset();
  requireAdminMock.mockResolvedValue({
    ok: true,
    user: { id: 'admin-id', email: 'admin@example.com' },
    role: 'admin',
  });
  createServiceMock.mockReset();
});

describe('POST /api/admin/camps/[slug]/upload-image', () => {
  it('rejects when admin gate fails', async () => {
    requireAdminMock.mockResolvedValueOnce({
      ok: false,
      response: NextResponse.json({ error: 'unauthorized' }, { status: 401 }),
    });
    const res = await POST(makeRequest(buildForm({ bucket: 'camp-logos' })), ctxFor('the-growing-place-summer-camp'));
    expect(res.status).toBe(401);
  });

  it('rejects an invalid slug', async () => {
    const { client } = buildStorageMock();
    createServiceMock.mockReturnValue(client as never);
    const res = await POST(
      makeRequest(buildForm({ bucket: 'camp-logos' })),
      ctxFor('Invalid Slug!'),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('invalid_slug');
  });

  it('rejects when bucket is missing or invalid', async () => {
    const { client } = buildStorageMock();
    createServiceMock.mockReturnValue(client as never);
    const res = await POST(
      makeRequest(buildForm({ bucket: 'wrong-bucket' })),
      ctxFor('frost-science-summer-camp'),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('invalid_bucket');
  });

  it('rejects when no image file is attached', async () => {
    const { client } = buildStorageMock();
    createServiceMock.mockReturnValue(client as never);
    const form = new FormData();
    form.set('bucket', 'camp-logos');
    const res = await POST(makeRequest(form), ctxFor('frost-science-summer-camp'));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('no_file');
  });

  it('rejects unsupported content-type', async () => {
    const { client } = buildStorageMock();
    createServiceMock.mockReturnValue(client as never);
    const res = await POST(
      makeRequest(
        buildForm({
          bucket: 'camp-logos',
          fileName: 'evil.exe',
          type: 'application/x-msdownload',
        }),
      ),
      ctxFor('frost-science-summer-camp'),
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('unsupported_type');
  });

  it('rejects oversized logo (> 512 KB)', async () => {
    const { client } = buildStorageMock();
    createServiceMock.mockReturnValue(client as never);
    const res = await POST(
      makeRequest(
        buildForm({ bucket: 'camp-logos', size: 600 * 1024 }),
      ),
      ctxFor('frost-science-summer-camp'),
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('too_large');
  });

  it('rejects oversized hero (> 2 MB)', async () => {
    const { client } = buildStorageMock();
    createServiceMock.mockReturnValue(client as never);
    const res = await POST(
      makeRequest(
        buildForm({ bucket: 'camp-heroes', size: 3 * 1024 * 1024 }),
      ),
      ctxFor('frost-science-summer-camp'),
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('too_large');
  });

  it('rejects SVG for hero (allowed for logo only)', async () => {
    const { client } = buildStorageMock();
    createServiceMock.mockReturnValue(client as never);
    const res = await POST(
      makeRequest(
        buildForm({
          bucket: 'camp-heroes',
          type: 'image/svg+xml',
          fileName: 'foo.svg',
        }),
      ),
      ctxFor('frost-science-summer-camp'),
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('unsupported_type');
  });

  it('uploads to camp-logos and returns publicUrl on success', async () => {
    const mocks = buildStorageMock();
    createServiceMock.mockReturnValue(mocks.client as never);
    const res = await POST(
      makeRequest(buildForm({ bucket: 'camp-logos' })),
      ctxFor('frost-science-summer-camp'),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.url).toContain('camp-logos');
    expect(body.path).toMatch(/^frost-science-summer-camp\/\d+\.png$/);
    expect(mocks.from).toHaveBeenCalledWith('camp-logos');
    expect(mocks.upload).toHaveBeenCalledTimes(1);
    const [storagePath, _bytes, opts] = mocks.upload.mock.calls[0];
    expect(storagePath).toMatch(/^frost-science-summer-camp\/\d+\.png$/);
    expect((opts as { contentType: string }).contentType).toBe('image/png');
  });

  it('returns 500 with detail when storage rejects the upload', async () => {
    const mocks = buildStorageMock({
      uploadError: { message: 'bucket policy denied' },
    });
    createServiceMock.mockReturnValue(mocks.client as never);
    const res = await POST(
      makeRequest(buildForm({ bucket: 'camp-logos' })),
      ctxFor('frost-science-summer-camp'),
    );
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('upload_failed');
    expect(body.detail).toBe('bucket policy denied');
  });
});
