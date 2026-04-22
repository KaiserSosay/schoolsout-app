'use client';

import { useTranslations } from 'next-intl';

// DECISION: Shared presentation for one kid's fields (name / grade / school).
// Lives as a dumb controlled component — the parent owns the kids[] array and
// passes {kid, ordinal, schools, onChange, onDelete?}. Used by both the
// onboarding form and the settings page so we have ONE source of truth for
// how "a kid" looks on screen.

export type School = { id: string; name: string };

export type KidState = {
  name: string; // localStorage only
  grade: string; // localStorage only — one of GRADES or ''
  school_id: string | null;
  school_other: boolean;
};

// DECISION: Fixed ordered list of grade options + the grade→age_range map.
// Exporting the helpers so settings/onboarding (and tests) share them.
export const GRADES = [
  'PreK',
  'K',
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '10',
  '11',
  '12',
] as const;
export type Grade = (typeof GRADES)[number];

export type AgeRange = '4-6' | '7-9' | '10-12' | '13+';

export function gradeToAge(grade: string): AgeRange {
  switch (grade) {
    case 'PreK':
    case 'K':
    case '1':
    case '2':
      return '4-6';
    case '3':
    case '4':
    case '5':
      return '7-9';
    case '6':
    case '7':
    case '8':
      return '10-12';
    case '9':
    case '10':
    case '11':
    case '12':
      return '13+';
    default:
      // DECISION: unknown grades default to 7–9 (the largest band for our
      // target audience). The form gates submit on grade being chosen so this
      // fallback should never actually hit — it exists only so the type is
      // total and legacy kid rows with freeform strings still resolve.
      return '7-9';
  }
}

export function blankKid(): KidState {
  return { name: '', grade: '', school_id: null, school_other: false };
}

export function KidForm({
  kid,
  ordinal,
  schools,
  suggestedIds,
  onChange,
  onDelete,
}: {
  kid: KidState;
  ordinal: number;
  schools: School[];
  suggestedIds: string[];
  onChange: (patch: Partial<KidState>) => void;
  onDelete?: () => void;
}) {
  const t = useTranslations('app.onboarding');

  const suggestedSchools = suggestedIds
    .map((id) => schools.find((s) => s.id === id))
    .filter((s): s is School => Boolean(s));

  return (
    <fieldset
      className="rounded-3xl border border-cream-border bg-white p-5"
      data-testid={`kid-form-${ordinal}`}
    >
      <div className="flex items-center justify-between gap-3">
        <legend className="text-[11px] font-black uppercase tracking-wider text-brand-purple">
          Kid {ordinal}
        </legend>
        {onDelete ? (
          <button
            type="button"
            onClick={onDelete}
            className="text-xs font-bold text-muted hover:text-red-600"
          >
            ✕
          </button>
        ) : null}
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <label className="block">
          <span className="text-xs font-bold text-muted">{t('labels.name')}</span>
          <input
            type="text"
            value={kid.name}
            onChange={(e) => onChange({ name: e.target.value })}
            placeholder={t('placeholders.kidName')}
            className="mt-1 w-full rounded-xl border border-cream-border bg-cream px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-brand-purple focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="text-xs font-bold text-muted">{t('labels.grade')}</span>
          <select
            value={kid.grade}
            onChange={(e) => onChange({ grade: e.target.value })}
            className="mt-1 w-full rounded-xl border border-cream-border bg-cream px-3 py-2 text-sm text-ink focus:border-brand-purple focus:outline-none"
            data-testid={`kid-grade-${ordinal}`}
          >
            <option value="">{t('placeholders.grade')}</option>
            {GRADES.map((g) => (
              <option key={g} value={g}>
                {t(`grades.${g}` as const)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-4">
        <span className="text-xs font-bold text-muted">{t('labels.school')}</span>
        <div className="mt-2 flex flex-wrap gap-2">
          {suggestedSchools.map((s) => {
            const active = !kid.school_other && kid.school_id === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => onChange({ school_id: s.id, school_other: false })}
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
            onClick={() => onChange({ school_other: true, school_id: null })}
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
            onChange={(e) => onChange({ school_id: e.target.value || null })}
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
  );
}
