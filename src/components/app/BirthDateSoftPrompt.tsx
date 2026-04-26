'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { birthMonthLabels, birthYearOptions } from './KidForm';

// Returning parents who saved kids before migration 038 shipped have
// no birth_month / birth_year on file. This banner sits at the top of
// the Family page and asks them, one kid at a time, to fill in month +
// year. Persistent — re-renders on every Family visit until either
// every kid has data or the parent dismisses it. Dismissal stores a
// timestamp in localStorage and re-prompts after 30 days, same TTL as
// the new-device-kid-name banner.

const DISMISSED_KEY = 'so-birthdate-prompt-dismissed-at';
const DISMISS_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export type SoftPromptKid = {
  id: string;
  ordinal: number;
  birth_month?: number | null;
  birth_year?: number | null;
};

export function BirthDateSoftPrompt({
  kids,
  // Optional kid name lookup keyed by ordinal — names live in
  // localStorage per COPPA design, so the FamilyClient already reads
  // them and passes them down here.
  nameByOrdinal,
}: {
  kids: SoftPromptKid[];
  nameByOrdinal?: Record<number, string>;
}) {
  const t = useTranslations('app.kids.birthDate');
  const locale = useLocale();

  const monthLabels = useMemo(() => birthMonthLabels(locale), [locale]);
  const yearOptions = useMemo(() => birthYearOptions(), []);

  const [hidden, setHidden] = useState(true); // hidden until effect decides
  const [pendingMonth, setPendingMonth] = useState<number | null>(null);
  const [pendingYear, setPendingYear] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedKidIds, setSavedKidIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DISMISSED_KEY);
      if (raw) {
        const ts = parseInt(raw, 10);
        if (Number.isFinite(ts) && Date.now() - ts < DISMISS_TTL_MS) {
          return; // dismissed recently — stay hidden
        }
      }
      setHidden(false);
    } catch {
      setHidden(false);
    }
  }, []);

  const missing = kids.filter(
    (k) =>
      !savedKidIds.has(k.id) &&
      (k.birth_month == null || k.birth_year == null),
  );
  const target = missing[0];

  if (hidden || !target) return null;

  function dismiss() {
    try {
      localStorage.setItem(DISMISSED_KEY, String(Date.now()));
    } catch {
      /* private mode — fine */
    }
    setHidden(true);
  }

  async function save() {
    if (!target || !pendingMonth || !pendingYear) {
      setError('pick-both');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/kid-profiles/birth-date', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kid_id: target.id,
          birth_month: pendingMonth,
          birth_year: pendingYear,
        }),
      });
      if (!res.ok) {
        setError('save-failed');
        return;
      }
      setSavedKidIds((prev) => new Set(prev).add(target.id));
      setPendingMonth(null);
      setPendingYear(null);
    } catch {
      setError('save-failed');
    } finally {
      setSaving(false);
    }
  }

  const kidName = nameByOrdinal?.[target.ordinal] ?? `Kid ${target.ordinal}`;

  return (
    <aside
      data-testid="birth-date-soft-prompt"
      className="rounded-3xl border-2 border-brand-purple bg-purple-soft p-5 text-ink"
    >
      <p className="text-sm font-black md:text-base">
        👶 {t('softPromptHeadline', { kidName })}
      </p>
      <p className="mt-2 text-sm text-ink/85">
        {t('softPromptBody', { kidName })}
      </p>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <select
          value={pendingMonth ?? ''}
          onChange={(e) =>
            setPendingMonth(e.target.value ? parseInt(e.target.value, 10) : null)
          }
          className="rounded-xl border border-cream-border bg-white px-3 py-2 text-sm text-ink focus:border-brand-purple focus:outline-none"
          data-testid="birth-prompt-month"
        >
          <option value="">{t('monthPlaceholder')}</option>
          {monthLabels.slice(1).map((label, i) => (
            <option key={label} value={i + 1}>
              {label}
            </option>
          ))}
        </select>
        <select
          value={pendingYear ?? ''}
          onChange={(e) =>
            setPendingYear(e.target.value ? parseInt(e.target.value, 10) : null)
          }
          className="rounded-xl border border-cream-border bg-white px-3 py-2 text-sm text-ink focus:border-brand-purple focus:outline-none"
          data-testid="birth-prompt-year"
        >
          <option value="">{t('yearPlaceholder')}</option>
          {yearOptions.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={save}
          disabled={saving || !pendingMonth || !pendingYear}
          className="inline-flex min-h-11 items-center justify-center rounded-full bg-ink px-5 py-2 text-sm font-black text-cream hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-60"
        >
          {saving ? '…' : t('softPromptSubmit')}
        </button>
        <button
          type="button"
          onClick={dismiss}
          className="inline-flex min-h-11 items-center justify-center rounded-full border border-cream-border bg-white px-5 py-2 text-sm font-bold text-ink hover:bg-cream"
        >
          {t('softPromptSkip')}
        </button>
      </div>
      {error ? (
        <p className="mt-2 text-xs font-semibold text-red-700" role="alert">
          {error === 'pick-both'
            ? `${t('monthPlaceholder')} + ${t('yearPlaceholder')}`
            : t('softPromptSubmit')}
        </p>
      ) : null}
    </aside>
  );
}
