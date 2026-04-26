'use client';

import { useLocale, useTranslations } from 'next-intl';
import { SchoolAutocomplete } from './SchoolAutocomplete';

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
  // Phase 3.5+ hybrid kid model (migration 038). Server-side. Optional
  // here because returning parents who saved kids before this shipped
  // have nothing to fill in until the soft-prompt banner asks.
  birth_month?: number | null;
  birth_year?: number | null;
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
  return {
    name: '',
    grade: '',
    school_id: null,
    school_other: false,
    birth_month: null,
    birth_year: null,
  };
}

// Years presented in the birth-year dropdown. Mirrors the migration-038
// CHECK constraint (2005..2025). Returned newest-first so parents picking
// for a 7-year-old don't have to scroll.
export function birthYearOptions(): number[] {
  const years: number[] = [];
  for (let y = 2025; y >= 2005; y -= 1) years.push(y);
  return years;
}

// Month-name lookup for the birth-month dropdown. Locale-aware: the
// caller passes `locale` and gets the right copy. Indexed 1-12 to match
// the schema; index 0 is the placeholder.
export function birthMonthLabels(locale: string): string[] {
  const intl = locale === 'es' ? 'es-US' : 'en-US';
  const labels = ['—'];
  for (let m = 1; m <= 12; m += 1) {
    labels.push(
      new Date(2024, m - 1, 1).toLocaleDateString(intl, { month: 'long' }),
    );
  }
  return labels;
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
  const tBirth = useTranslations('app.kids.birthDate');
  const locale = useLocale();
  const monthLabels = birthMonthLabels(locale);
  const yearOptions = birthYearOptions();

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

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <label className="block">
          <span className="text-xs font-bold text-muted">
            {tBirth('monthLabel')}
          </span>
          <select
            value={kid.birth_month ?? ''}
            onChange={(e) =>
              onChange({
                birth_month: e.target.value ? parseInt(e.target.value, 10) : null,
              })
            }
            className="mt-1 w-full rounded-xl border border-cream-border bg-cream px-3 py-2 text-sm text-ink focus:border-brand-purple focus:outline-none"
            data-testid={`kid-birth-month-${ordinal}`}
          >
            <option value="">{tBirth('monthPlaceholder')}</option>
            {monthLabels.slice(1).map((label, i) => (
              <option key={label} value={i + 1}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-xs font-bold text-muted">
            {tBirth('yearLabel')}
          </span>
          <select
            value={kid.birth_year ?? ''}
            onChange={(e) =>
              onChange({
                birth_year: e.target.value ? parseInt(e.target.value, 10) : null,
              })
            }
            className="mt-1 w-full rounded-xl border border-cream-border bg-cream px-3 py-2 text-sm text-ink focus:border-brand-purple focus:outline-none"
            data-testid={`kid-birth-year-${ordinal}`}
          >
            <option value="">{tBirth('yearPlaceholder')}</option>
            {yearOptions.map((y) => (
              <option key={y} value={y}>
                {y}
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
          <div className="mt-3">
            <SchoolAutocomplete
              schools={schools}
              value={kid.school_id}
              onSelect={(id) => onChange({ school_id: id })}
              testIdSuffix={`-${ordinal}`}
            />
          </div>
        ) : null}
      </div>
    </fieldset>
  );
}
