// Factual one-liners for common US school closures. Shown in the closure-detail
// "Why is school closed?" section. Neutral, brief, verifiable.
// If a closure name doesn't match a key here, we render nothing (per
// UX_PRINCIPLES.md #2 — better silent than wrong).

const reasons: Record<string, string> = {
  'memorial day':
    'Federal holiday honoring U.S. military members who died in service. Observed on the last Monday of May since 1971.',
  'summer break':
    'Summer vacation — most Miami schools are out roughly mid-June through mid-August.',
  'labor day':
    'Federal holiday honoring the U.S. labor movement. Observed on the first Monday of September.',
  'columbus day':
    'Federal holiday observed on the second Monday of October. Some schools instead observe Indigenous Peoples’ Day.',
  'indigenous peoples day':
    'Observed on the second Monday of October as an alternative to Columbus Day.',
  'veterans day':
    'Federal holiday honoring U.S. military veterans. Observed November 11.',
  'thanksgiving break':
    'Federal holiday of gratitude, celebrated on the fourth Thursday of November.',
  'thanksgiving':
    'Federal holiday of gratitude, celebrated on the fourth Thursday of November.',
  'winter break':
    'Extended winter vacation covering Christmas, Hanukkah, and New Year’s.',
  'christmas break':
    'Christmas holiday period, typically late December into early January.',
  'new year':
    'New Year’s Day — federal holiday observed January 1.',
  'martin luther king day':
    'Federal holiday honoring the birthday of civil rights leader Dr. Martin Luther King Jr.',
  'mlk day':
    'Federal holiday honoring the birthday of civil rights leader Dr. Martin Luther King Jr.',
  'presidents day':
    'Federal holiday honoring former U.S. presidents. Observed on the third Monday of February.',
  'spring break':
    'Extended spring vacation, typically one week in late March or early April.',
  'teacher workday':
    'School closed for staff professional development. Faculty are working; students have the day off.',
  'teacher planning day':
    'See teacher workday — school closed for staff professional development.',
  'teacher work day':
    'See teacher workday.',
  'good friday':
    'The Friday before Easter Sunday. Observed as a day off by many schools in Miami-Dade.',
  'juneteenth':
    'Federal holiday observed June 19, commemorating the end of slavery in the United States.',
  'independence day':
    'U.S. Independence Day — federal holiday on July 4.',
  'fourth of july':
    'U.S. Independence Day — federal holiday on July 4.',
  'parent teacher conferences':
    'School closed so teachers can meet with families. Half-days are common.',
};

export function reasonFor(closureName: string): string | null {
  const key = closureName.toLowerCase().trim();
  if (reasons[key]) return reasons[key];
  // Try without "break"/"day" suffix for partial matches ("Winter" etc).
  const stripped = key.replace(/\s+(break|day|holiday)$/i, '').trim();
  return reasons[stripped] ?? null;
}
