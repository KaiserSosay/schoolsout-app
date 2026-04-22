// DECISION: Centralize school-name → short-code mapping so FamilyCalendarStrip,
// CalendarSections, and any future surface stay in sync. Keys match the exact
// names seeded by Subagent A. Anything missing falls back to the first 3
// alphanumeric characters of the name.
export const SCHOOL_CODES: Record<string, string> = {
  'The Growing Place': 'TGP',
  'Coral Gables Preparatory Academy': 'CGP',
  'Miami-Dade County Public Schools': 'MDCPS',
  'Gulliver Preparatory School': 'GULL',
  'Ransom Everglades School': 'RE',
  'Palmer Trinity School': 'PAL',
  'Belen Jesuit Preparatory School': 'BEL',
  'Riviera Schools': 'RIV',
  'Westminster Christian School': 'WEST',
  'Miami Catholic Schools (diocesan)': 'CATH',
};

export function schoolCode(name: string | null | undefined): string {
  if (!name) return '---';
  return (
    SCHOOL_CODES[name] ??
    name.replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase()
  );
}
