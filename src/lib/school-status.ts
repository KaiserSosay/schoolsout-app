// Honest calendar status badge helpers.
// DECISION: Only `verified_multi_year` and `verified_current` count as "green."
// Everything else gets an emoji + pending/unknown/error intent so the UI can
// show the user we haven't fabricated data.

export type SchoolStatus =
  | 'verified_multi_year'
  | 'verified_current'
  | 'ai_draft'
  | 'needs_research'
  | 'unavailable';

export function statusBadge(status: SchoolStatus): {
  emoji: string;
  intent: 'positive' | 'pending' | 'unknown' | 'error';
} {
  switch (status) {
    case 'verified_multi_year':
      return { emoji: '✅', intent: 'positive' };
    case 'verified_current':
      return { emoji: '✅', intent: 'positive' };
    case 'ai_draft':
      return { emoji: '⏳', intent: 'pending' };
    case 'needs_research':
      return { emoji: '🔍', intent: 'unknown' };
    case 'unavailable':
      return { emoji: '⚠️', intent: 'error' };
  }
}

export function statusTranslationKey(status: SchoolStatus): string {
  switch (status) {
    case 'verified_multi_year':
      return 'verifiedMultiYear';
    case 'verified_current':
      return 'verifiedCurrent';
    case 'ai_draft':
      return 'aiDraft';
    case 'needs_research':
      return 'needsResearch';
    case 'unavailable':
      return 'unavailable';
  }
}

export function isSchoolVerified(status: SchoolStatus): boolean {
  return status === 'verified_multi_year' || status === 'verified_current';
}
