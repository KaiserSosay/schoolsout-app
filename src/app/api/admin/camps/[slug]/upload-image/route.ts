import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdminApi } from '@/lib/auth/requireAdmin';
import { createServiceSupabase } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

// Phase B Step 5 — admin uploads a camp logo or hero image.
//
// Why a Route Handler instead of the Server Action shape the prompt
// described: Next.js Server Actions default to a 1 MB body limit
// (`experimental.serverActions.bodySizeLimit`), and hero images are
// allowed up to 2 MB per migration 055. Route handlers don't have that
// limit, and the existing `/api/admin/calendars/upload` already uses
// this pattern (multipart/form-data + requireAdminApi + service-role
// supabase) so we stay consistent.
//
// Request shape:
//   POST /api/admin/camps/{slug}/upload-image
//   form-data:
//     bucket: 'camp-logos' | 'camp-heroes'
//     image:  <File>
//
// Response: 200 { ok: true, url } on success.
//          4xx/5xx { error } on failure.

const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;

const LIMITS: Record<
  'camp-logos' | 'camp-heroes',
  { bytes: number; mimes: ReadonlyArray<string> }
> = {
  'camp-logos': {
    bytes: 512 * 1024,
    mimes: ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'],
  },
  'camp-heroes': {
    bytes: 2 * 1024 * 1024,
    mimes: ['image/png', 'image/jpeg', 'image/webp'],
  },
};

const bucketSchema = z.enum(['camp-logos', 'camp-heroes']);

function extFromMime(mime: string): string {
  switch (mime) {
    case 'image/png':
      return 'png';
    case 'image/jpeg':
      return 'jpg';
    case 'image/webp':
      return 'webp';
    case 'image/svg+xml':
      return 'svg';
    default:
      return 'bin';
  }
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ slug: string }> },
) {
  const gate = await requireAdminApi();
  if (!gate.ok) return gate.response;

  const { slug } = await ctx.params;
  if (!slug || !SLUG_RE.test(slug)) {
    return NextResponse.json({ error: 'invalid_slug' }, { status: 400 });
  }

  const form = await req.formData().catch(() => null);
  if (!form) {
    return NextResponse.json({ error: 'expected_multipart' }, { status: 400 });
  }

  const bucketParsed = bucketSchema.safeParse(form.get('bucket'));
  if (!bucketParsed.success) {
    return NextResponse.json({ error: 'invalid_bucket' }, { status: 400 });
  }
  const bucket = bucketParsed.data;
  const limits = LIMITS[bucket];

  const file = form.get('image');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'no_file' }, { status: 400 });
  }
  if (!limits.mimes.includes(file.type)) {
    return NextResponse.json({ error: 'unsupported_type' }, { status: 400 });
  }
  if (file.size > limits.bytes) {
    return NextResponse.json({ error: 'too_large' }, { status: 400 });
  }

  // Path includes a timestamp so re-uploads bust client-side caches and
  // we don't have to think about Storage object replacement semantics.
  const ext = extFromMime(file.type);
  const storagePath = `${slug}/${Date.now()}.${ext}`;

  const db = createServiceSupabase();
  const bytes = new Uint8Array(await file.arrayBuffer());
  const { error: upErr } = await db.storage
    .from(bucket)
    .upload(storagePath, bytes, {
      contentType: file.type,
      upsert: false,
    });

  if (upErr) {
    console.error('[admin/camps/upload-image] upload failed', {
      bucket,
      slug,
      message: upErr.message,
    });
    return NextResponse.json(
      { error: 'upload_failed', detail: upErr.message },
      { status: 500 },
    );
  }

  const {
    data: { publicUrl },
  } = db.storage.from(bucket).getPublicUrl(storagePath);

  return NextResponse.json({ ok: true, url: publicUrl, path: storagePath });
}
