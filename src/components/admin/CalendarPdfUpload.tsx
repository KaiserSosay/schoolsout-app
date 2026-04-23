'use client';

import { useRef, useState } from 'react';

// Inline PDF upload for a single school. Sits above the list of draft/
// verified closures in the Calendar Reviews tab so admin can drop in a
// PDF as soon as it lands in email.
export function CalendarPdfUpload({
  schoolId,
}: {
  schoolId: string;
}) {
  const [schoolYear, setSchoolYear] = useState(defaultSchoolYear());
  const [status, setStatus] = useState<
    | { kind: 'idle' }
    | { kind: 'uploading' }
    | { kind: 'ok'; path: string }
    | { kind: 'err'; message: string }
  >({ kind: 'idle' });
  const fileRef = useRef<HTMLInputElement | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setStatus({ kind: 'err', message: 'Pick a PDF first.' });
      return;
    }
    setStatus({ kind: 'uploading' });
    const form = new FormData();
    form.append('school_id', schoolId);
    form.append('school_year', schoolYear);
    form.append('pdf', file);

    const res = await fetch('/api/admin/calendars/upload', {
      method: 'POST',
      body: form,
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setStatus({
        kind: 'err',
        message: j.error === 'not_a_pdf' ? 'File must be a PDF.' : 'Upload failed.',
      });
      return;
    }
    const j = await res.json();
    setStatus({ kind: 'ok', path: j.path });
  };

  return (
    <form
      onSubmit={submit}
      className="flex flex-wrap items-center gap-2 rounded-2xl border border-dashed border-cream-border bg-cream/50 p-3 text-xs"
    >
      <span className="font-bold text-ink">📄 Upload calendar PDF</span>
      <input
        value={schoolYear}
        onChange={(e) => setSchoolYear(e.target.value)}
        className="w-28 rounded-full border border-cream-border bg-white px-2 py-1 font-mono text-[11px] text-ink focus:border-brand-purple focus:outline-none"
        placeholder="2025-2026"
      />
      <input ref={fileRef} type="file" accept="application/pdf" className="text-[11px]" />
      <button
        type="submit"
        disabled={status.kind === 'uploading'}
        className="min-h-9 rounded-full bg-brand-purple px-3 py-1.5 text-[11px] font-black text-white hover:brightness-110 disabled:opacity-60"
      >
        {status.kind === 'uploading' ? 'Uploading…' : 'Upload'}
      </button>
      {status.kind === 'ok' ? (
        <span className="font-semibold text-emerald-700">
          ✓ Stored at {status.path}. Add closures manually via the draft list below.
        </span>
      ) : null}
      {status.kind === 'err' ? (
        <span className="font-semibold text-red-600">{status.message}</span>
      ) : null}
    </form>
  );
}

function defaultSchoolYear(): string {
  const now = new Date();
  const y = now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1;
  return `${y}-${y + 1}`;
}
