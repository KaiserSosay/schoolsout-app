// Phase 5.0 Calendar View — closure-type derivation + visual styling.
//
// The DB column closures.closure_type lands in migration 063 but the
// UI must work BEFORE that migration is applied (schema-defensive
// principle). When closure_type is missing or null, we derive it
// client-side from the closure name using the same patterns as the
// migration backfill — keeping the two in sync is intentional.

export type ClosureType =
  | 'federal_holiday'
  | 'long_break'
  | 'teacher_workday'
  | 'religious'
  | 'early_dismissal'
  | 'weather'
  | 'other';

const FEDERAL_HOLIDAY_PATTERNS: RegExp[] = [
  /memorial day/i,
  /labor day/i,
  /columbus day/i,
  /indigenous peoples/i,
  /veterans day/i,
  /thanksgiving day/i,
  /^thanksgiving$/i,
  /new year('s)? day/i,
  /martin luther king/i,
  /^mlk\b/i,
  /presidents'? day/i,
  /juneteenth/i,
  /independence day/i,
  /fourth of july/i,
  /july 4/i,
];

const LONG_BREAK_PATTERNS: RegExp[] = [
  /winter break/i,
  /winter recess/i,
  /christmas break/i,
  /spring break/i,
  /spring recess/i,
  /summer break/i,
  /summer vacation/i,
  /fall break/i,
  /thanksgiving break/i,
  /thanksgiving recess/i,
];

const TEACHER_WORKDAY_PATTERNS: RegExp[] = [
  /teacher planning/i,
  /teacher workday/i,
  /teacher work day/i,
  /professional development/i,
  /staff development/i,
  /\bpd day\b/i,
  /\binservice\b/i,
  /\bin-service\b/i,
];

const RELIGIOUS_PATTERNS: RegExp[] = [
  /good friday/i,
  /yom kippur/i,
  /rosh hashanah/i,
  /passover/i,
  /easter/i,
  /\beid\b/i,
];

const EARLY_DISMISSAL_PATTERNS: RegExp[] = [
  /early dismissal/i,
  /early release/i,
  /half day/i,
  /half-day/i,
];

export function deriveClosureType(
  name: string,
  stored?: string | null,
): ClosureType {
  if (stored && isClosureType(stored)) return stored;
  const n = (name ?? '').trim();
  if (!n) return 'other';
  if (FEDERAL_HOLIDAY_PATTERNS.some((r) => r.test(n))) return 'federal_holiday';
  if (LONG_BREAK_PATTERNS.some((r) => r.test(n))) return 'long_break';
  if (TEACHER_WORKDAY_PATTERNS.some((r) => r.test(n))) return 'teacher_workday';
  if (RELIGIOUS_PATTERNS.some((r) => r.test(n))) return 'religious';
  if (EARLY_DISMISSAL_PATTERNS.some((r) => r.test(n))) return 'early_dismissal';
  return 'other';
}

function isClosureType(value: string): value is ClosureType {
  return (
    value === 'federal_holiday' ||
    value === 'long_break' ||
    value === 'teacher_workday' ||
    value === 'religious' ||
    value === 'early_dismissal' ||
    value === 'weather' ||
    value === 'other'
  );
}

// Visual treatment per closure_type. Returns class names that combine
// to style the day cell. Color choice is brand-token only (cream / ink
// / gold / brand-purple variants). Accessibility: every type also has
// a label + emoji so color is never the only signal.
export type ClosureTypeStyle = {
  cellBg: string;
  cellText: string;
  ring: string;
  label: string;
};

export function styleForClosureType(t: ClosureType): ClosureTypeStyle {
  switch (t) {
    case 'federal_holiday':
      return {
        cellBg: 'bg-brand-purple',
        cellText: 'text-white',
        ring: 'ring-brand-purple/30',
        label: 'federal holiday',
      };
    case 'long_break':
      return {
        cellBg: 'bg-gold/70',
        cellText: 'text-ink',
        ring: 'ring-gold/40',
        label: 'long break',
      };
    case 'teacher_workday':
      return {
        cellBg: 'bg-sky-100',
        cellText: 'text-ink',
        ring: 'ring-sky-300/50',
        label: 'teacher workday',
      };
    case 'religious':
      return {
        cellBg: 'bg-purple-soft',
        cellText: 'text-ink',
        ring: 'ring-brand-purple/20',
        label: 'religious observance',
      };
    case 'early_dismissal':
      return {
        cellBg: 'bg-amber-100',
        cellText: 'text-ink',
        ring: 'ring-amber-300/50',
        label: 'early dismissal',
      };
    case 'weather':
      return {
        cellBg: 'bg-red-100',
        cellText: 'text-ink',
        ring: 'ring-red-300/50',
        label: 'weather closure',
      };
    case 'other':
    default:
      return {
        cellBg: 'bg-cream',
        cellText: 'text-ink',
        ring: 'ring-cream-border',
        label: 'school closed',
      };
  }
}
