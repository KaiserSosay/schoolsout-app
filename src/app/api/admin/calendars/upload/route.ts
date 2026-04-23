import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdminApi } from '@/lib/auth/requireAdmin';
import { createServiceSupabase } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

// Accepts a multipart/form-data upload with a PDF + school_id. Saves to
// the `school-calendars` bucket at `{school_id}/{yyyy}-{yyyy}.pdf`, records
// the URL on schools.calendar_pdf_url, and returns a stub parse result.
//
// TODO(parse-calendar): wire this up to a Claude-based PDF parser that
// returns a list of {name, start_date, end_date} rows for admin review.
// For now we just return { ok: true, parsed: [] } + log — admin still
// adds rows manually via the existing closures/create endpoint.
const querySchema = z.object({
  school_id: z.string().uuid(),
  school_year: z
    .string()
    .regex(/^\d{4}-\d{4}$/, 'school_year must be YYYY-YYYY'),
});

export async function POST(req: Request) {
  const gate = await requireAdminApi();
  if (!gate.ok) return gate.response;

  const form = await req.formData().catch(() => null);
  if (!form) {
    return NextResponse.json({ error: 'expected_multipart' }, { status: 400 });
  }

  const parsed = querySchema.safeParse({
    school_id: form.get('school_id'),
    school_year: form.get('school_year'),
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'invalid_fields', detail: parsed.error.issues },
      { status: 400 },
    );
  }

  const file = form.get('pdf');
  if (!(file instanceof File) || file.type !== 'application/pdf') {
    return NextResponse.json({ error: 'not_a_pdf' }, { status: 400 });
  }
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: 'file_too_large' }, { status: 400 });
  }

  const db = createServiceSupabase();
  const path = `${parsed.data.school_id}/${parsed.data.school_year}.pdf`;
  const bytes = new Uint8Array(await file.arrayBuffer());

  const { error: upErr } = await db.storage
    .from('school-calendars')
    .upload(path, bytes, {
      contentType: 'application/pdf',
      upsert: true,
    });
  if (upErr) {
    return NextResponse.json(
      { error: 'upload_failed', detail: upErr.message },
      { status: 500 },
    );
  }

  // Store a reference to the PDF on the school row. We store the storage
  // path (not a public URL — the bucket is private) so admin UIs can sign
  // a URL on demand.
  await db
    .from('schools')
    .update({ calendar_pdf_url: path })
    .eq('id', parsed.data.school_id);

  console.warn(
    '[admin/calendars/upload] PDF stored; parse-calendar not yet wired',
    { school_id: parsed.data.school_id, school_year: parsed.data.school_year },
  );

  return NextResponse.json({
    ok: true,
    path,
    parsed: [],
    note: 'PDF saved. Parse-calendar pipeline is a TODO — add closures manually via admin for now.',
  });
}
