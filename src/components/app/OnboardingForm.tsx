'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

// DECISION: COPPA-aligned. Kid NAME and exact GRADE are kept in localStorage
// only; the server only sees {school_id, age_range, ordinal}. The form maps
// grade input ("K", "3", "9") to one of the four server-side age buckets.
export type School = { id: string; name: string };

type KidState = {
  name: string;         // localStorage only
  grade: string;        // localStorage only
  school_id: string | null;
  school_other: boolean;
};

const AGE_BY_GRADE: Array<{ match: RegExp; age: '4-6' | '7-9' | '10-12' | '13+' }> = [
  // PreK / K / 1 / 2 → 4-6
  { match: /^(prek|pre-?k|k|0|1|2)$/i, age: '4-6' },
  // 3 / 4 / 5 → 7-9
  { match: /^(3|4|5)$/i, age: '7-9' },
  // 6 / 7 / 8 → 10-12
  { match: /^(6|7|8)$/i, age: '10-12' },
];

function gradeToAge(grade: string): '4-6' | '7-9' | '10-12' | '13+' {
  const g = grade.trim();
  for (const r of AGE_BY_GRADE) if (r.match.test(g)) return r.age;
  const n = Number(g);
  if (Number.isFinite(n) && n >= 9) return '13+';
  // DECISION: safe default is 7-9 (the most common family age band in our
  // target audience) — user can change by entering a recognised grade.
  return '7-9';
}

const KIDS_LS_KEY = 'so-kids';

function saveKidsLocal(kids: KidState[]) {
  try {
    const strip = kids.map((k) => ({ name: k.name, grade: k.grade }));
    localStorage.setItem(KIDS_LS_KEY, JSON.stringify(strip));
  } catch {
    /* ignore quota / sandbox errors */
  }
}

export function OnboardingForm({
  schools,
  locale,
  initialName,
}: {
  schools: School[];
  locale: string;
  initialName: string | null;
}) {
  const t = useTranslations('app.onboarding');
  const router = useRouter();

  const [parentName, setParentName] = useState(initialName ?? '');
  const [kidCount, setKidCount] = useState(1);
  const [kids, setKids] = useState<KidState[]>(() => [blankKid()]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // DECISION: First three schools (the seeded "founding" set) surface as
  // suggested pills. The "Other" button reveals a full dropdown populated
  // from the schools prop.
  const suggestedIds = useMemo(
    () => [
      '00000000-0000-0000-0000-000000000001', // The Growing Place
      '00000000-0000-0000-0000-000000000002', // Coral Gables Preparatory Academy
      '00000000-0000-0000-0000-000000000003', // Miami-Dade County Public Schools
    ],
    [],
  );
  const suggestedSchools = suggestedIds
    .map((id) => schools.find((s) => s.id === id))
    .filter((s): s is School => Boolean(s));

  function blankKid(): KidState {
    return { name: '', grade: '', school_id: null, school_other: false };
  }

  const setKidCountAndResize = (next: number) => {
    setKidCount(next);
    setKids((prev) => {
      const out = [...prev];
      while (out.length < next) out.push(blankKid());
      out.length = next;
      return out;
    });
  };

  const updateKid = (idx: number, patch: Partial<KidState>) => {
    setKids((prev) => {
      const out = [...prev];
      out[idx] = { ...out[idx]!, ...patch };
      return out;
    });
  };

  const canSubmit =
    parentName.trim().length > 0 &&
    kids.slice(0, kidCount).every((k) => Boolean(k.school_id));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || saving) return;
    setSaving(true);
    setError(null);
    try {
      saveKidsLocal(kids.slice(0, kidCount));

      const profiles = kids.slice(0, kidCount).map((k, i) => ({
        school_id: k.school_id!,
        age_range: gradeToAge(k.grade),
        ordinal: i + 1,
      }));

      const [mePatch, kidPost] = await Promise.all([
        fetch('/api/me', {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ display_name: parentName.trim() }),
        }),
        fetch('/api/kid-profiles', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ profiles }),
        }),
      ]);

      if (!mePatch.ok || !kidPost.ok) {
        setError(t('error'));
        setSaving(false);
        return;
      }

      router.push(`/${locale}/app`);
      router.refresh();
    } catch {
      setError(t('error'));
      setSaving(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <section>
        <label className="block text-xs font-black uppercase tracking-wider text-muted">
          {t('labels.name')}
        </label>
        <input
          type="text"
          value={parentName}
          onChange={(e) => setParentName(e.target.value)}
          placeholder={t('placeholders.name')}
          className="mt-2 w-full rounded-2xl border border-cream-border bg-white px-4 py-3 text-base text-ink placeholder:text-muted focus:border-brand-purple focus:outline-none"
          required
        />
      </section>

      <section>
        <label className="block text-xs font-black uppercase tracking-wider text-muted">
          {t('labels.kidCount')}
        </label>
        <div className="mt-2 flex gap-2">
          {[1, 2, 3, 4, 5].map((n) => {
            const active = n === kidCount;
            return (
              <button
                key={n}
                type="button"
                aria-pressed={active}
                onClick={() => setKidCountAndResize(n)}
                className={
                  'h-10 w-10 rounded-full text-sm font-black transition-colors ' +
                  (active
                    ? 'bg-brand-purple text-white'
                    : 'bg-white border border-cream-border text-ink hover:border-brand-purple/40')
                }
              >
                {n}
              </button>
            );
          })}
        </div>
      </section>

      <div className="space-y-5">
        {kids.slice(0, kidCount).map((kid, idx) => (
          <fieldset
            key={idx}
            className="rounded-3xl border border-cream-border bg-white p-5"
          >
            <legend className="text-[11px] font-black uppercase tracking-wider text-brand-purple">
              Kid {idx + 1}
            </legend>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <label className="block">
                <span className="text-xs font-bold text-muted">
                  {t('labels.name')}
                </span>
                <input
                  type="text"
                  value={kid.name}
                  onChange={(e) => updateKid(idx, { name: e.target.value })}
                  placeholder={t('placeholders.kidName')}
                  className="mt-1 w-full rounded-xl border border-cream-border bg-cream px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-brand-purple focus:outline-none"
                />
              </label>
              <label className="block">
                <span className="text-xs font-bold text-muted">
                  {t('labels.grade')}
                </span>
                <input
                  type="text"
                  value={kid.grade}
                  onChange={(e) => updateKid(idx, { grade: e.target.value })}
                  placeholder={t('placeholders.grade')}
                  className="mt-1 w-full rounded-xl border border-cream-border bg-cream px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-brand-purple focus:outline-none"
                />
              </label>
            </div>

            <div className="mt-4">
              <span className="text-xs font-bold text-muted">
                {t('labels.school')}
              </span>
              <div className="mt-2 flex flex-wrap gap-2">
                {suggestedSchools.map((s) => {
                  const active = !kid.school_other && kid.school_id === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() =>
                        updateKid(idx, { school_id: s.id, school_other: false })
                      }
                      aria-pressed={active}
                      className={
                        'rounded-full px-3 py-1.5 text-xs font-bold transition-colors ' +
                        (active
                          ? 'bg-ink text-white'
                          : 'border border-cream-border bg-white text-ink hover:border-brand-purple/40')
                      }
                    >
                      {s.name}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() =>
                    updateKid(idx, { school_other: true, school_id: null })
                  }
                  aria-pressed={kid.school_other}
                  className={
                    'rounded-full px-3 py-1.5 text-xs font-bold transition-colors ' +
                    (kid.school_other
                      ? 'bg-ink text-white'
                      : 'border border-cream-border bg-white text-ink hover:border-brand-purple/40')
                  }
                >
                  {t('schools.other')}
                </button>
              </div>
              {kid.school_other ? (
                <select
                  value={kid.school_id ?? ''}
                  onChange={(e) => updateKid(idx, { school_id: e.target.value || null })}
                  className="mt-3 w-full rounded-xl border border-cream-border bg-cream px-3 py-2 text-sm text-ink focus:border-brand-purple focus:outline-none"
                >
                  <option value="">—</option>
                  {schools.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              ) : null}
            </div>
          </fieldset>
        ))}
      </div>

      {error ? (
        <p role="alert" className="text-sm font-bold text-red-600">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={!canSubmit || saving}
        className="w-full rounded-full bg-ink px-6 py-4 text-base font-black text-cream transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {saving ? t('saving') : t('submit')}
      </button>
    </form>
  );
}
