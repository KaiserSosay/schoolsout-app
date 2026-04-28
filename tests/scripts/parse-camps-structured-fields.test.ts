import { describe, it, expect } from 'vitest';
import { extractFirstSentence, extractTagline } from '../../scripts/parse-camps-structured-fields';

// Step 0 — Phase B parser bug fixes. Camp Black Bear's tagline was
// being truncated at "A.D." because the prior regex split on any
// period+space+capital. Switched to an abbreviation-aware splitter.

describe('extractFirstSentence', () => {
  it('keeps "A.D." abbreviation in tagline', () => {
    const input =
      'Nature-based summer day camp at A.D. Barnes Park Nature Center where campers perform scientific experiments.';
    expect(extractFirstSentence(input)).toBe(
      'Nature-based summer day camp at A.D. Barnes Park Nature Center where campers perform scientific experiments.',
    );
  });

  it('keeps "St." abbreviation', () => {
    const input = 'Camp located at St. Brendan High School in Miami. Open to ages 6-12.';
    expect(extractFirstSentence(input)).toBe('Camp located at St. Brendan High School in Miami.');
  });

  it('still splits on real sentence boundaries', () => {
    const input = 'First sentence here. Second sentence here.';
    expect(extractFirstSentence(input)).toBe('First sentence here.');
  });

  it('handles multi-period acronyms (U.S., A.M., P.M.)', () => {
    expect(extractFirstSentence('Open from 9 A.M. to 5 P.M. daily.')).toBe(
      'Open from 9 A.M. to 5 P.M. daily.',
    );
    expect(extractFirstSentence('U.S. Open style tournament. Tournament on Friday.')).toBe(
      'U.S. Open style tournament.',
    );
  });

  it('trims trailing whitespace', () => {
    expect(extractFirstSentence('Sentence here.   ')).toBe('Sentence here.');
  });

  it('returns whole text when no period found', () => {
    expect(extractFirstSentence('No periods at all here')).toBe('No periods at all here');
  });
});

describe('extractTagline (integration with extractFirstSentence)', () => {
  it('produces a Camp Black Bear tagline that does NOT truncate at A.D.', () => {
    const description =
      'Nature-based summer day camp at A.D. Barnes Park Nature Center where campers perform scientific experiments, go on environmental field trips, enjoy pool days, and engage in outdoor physical activities.';
    const tagline = extractTagline(
      description,
      'Camp Black Bear at A.D. Barnes Park Nature Center',
    );
    // The pre-fix bug returned exactly "Nature-based summer day camp at A.D." —
    // pin against any tagline that ends at A.D. before "Barnes".
    expect(tagline).not.toBe('Nature-based summer day camp at A.D.');
    expect(tagline).toContain('A.D. Barnes Park');
  });

  it('returns the full first sentence when within the 20-180 length window', () => {
    const description = 'Camp located at St. Brendan High School in Miami. Open to ages 6-12.';
    expect(extractTagline(description, 'Saint Brendan Camp')).toBe(
      'Camp located at St. Brendan High School in Miami.',
    );
  });

  it('returns null for null/empty descriptions', () => {
    expect(extractTagline(null, 'Anything')).toBeNull();
    expect(extractTagline('', 'Anything')).toBeNull();
    expect(extractTagline('   ', 'Anything')).toBeNull();
  });
});
