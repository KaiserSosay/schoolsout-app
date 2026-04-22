'use client';

import { useTranslations } from 'next-intl';
import { isSchoolVerified, type SchoolStatus } from '@/lib/school-status';

type SchoolLite = {
  id: string;
  name: string;
  calendar_status: SchoolStatus;
};

// DECISION: Parent-mode-only disclosure. Kid mode hides it because kids should
// only see closures the parent already knows are real. We list up to the first
// two unverified schools; beyond that we compact to a count to avoid a giant
// banner (`School A, School B, and 3 others`).
export function VerifyingCalendarsCard({
  schools,
  locale,
}: {
  schools: SchoolLite[];
  locale: string;
}) {
  const t = useTranslations('app.dashboard.verifying');
  const pending = schools.filter((s) => !isSchoolVerified(s.calendar_status));
  if (pending.length === 0) return null;

  const listFormat = new Intl.ListFormat(locale, { style: 'long', type: 'conjunction' });
  const formatted = listFormat.format(pending.map((s) => s.name));

  return (
    <section
      role="status"
      aria-live="polite"
      className="flex items-start gap-3 rounded-2xl border border-cream-border bg-cream px-4 py-3"
    >
      <span aria-hidden className="text-2xl">
        🔍
      </span>
      <p className="text-sm leading-relaxed text-ink">
        {pending.length === 1
          ? t('singleSchool', { name: pending[0]!.name })
          : t('multipleSchools', { names: formatted })}
      </p>
    </section>
  );
}
