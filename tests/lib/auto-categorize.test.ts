import { describe, it, expect } from 'vitest';
import { isReligious, isAcademic } from '@/lib/camps/auto-categorize';

describe('auto-categorize — isReligious (Stage 2 false-positive lockout)', () => {
  it('rejects camps merely LOCATED at a church (Cross Bridge Church case)', () => {
    expect(
      isReligious(
        'Weekly aquatic-focused summer camp at Cross Bridge Church in Key Biscayne with swimming and water-based activities.',
      ),
    ).toBe(false);
  });

  it('rejects culturally-affiliated camps without programming content (JCC case)', () => {
    expect(
      isReligious(
        'Jewish community center summer camp — general + cultural programming.',
      ),
    ).toBe(false);
  });

  it('rejects Jewish day camp described as "outdoor and active" (Posnack JCC case)', () => {
    expect(
      isReligious(
        'Adventure summer camp at David Posnack JCC for rising 1st through 9th graders with hands-on outdoor and active programming.',
      ),
    ).toBe(false);
  });

  it('accepts a camp with BOTH affiliation AND programming-content', () => {
    expect(
      isReligious(
        'Jewish day camp on the South Campus of Yeshiva Toras Chaim Toras Emes with Torah study, Hebrew school, and religious instruction.',
      ),
    ).toBe(true);
  });

  it('accepts Catholic school with explicit Mass + Catechism', () => {
    expect(
      isReligious(
        'Catholic summer day camp with daily Mass and weekly Catechism class.',
      ),
    ).toBe(true);
  });

  it('rejects yeshiva affiliation alone without programming language', () => {
    // The plan calls this out: yeshiva is affiliation; needs programming
    // word. Operator would either add "Torah study" to the description OR
    // human-tag the camp manually.
    expect(
      isReligious('Summer day camp at Yeshiva Toras Chaim Toras Emes.'),
    ).toBe(false);
  });

  it('returns false on null / empty description', () => {
    expect(isReligious(null)).toBe(false);
    expect(isReligious(undefined)).toBe(false);
    expect(isReligious('')).toBe(false);
  });

  it('case-insensitive on both signals', () => {
    expect(
      isReligious('CHRISTIAN summer camp with daily BIBLE STUDY for kids.'),
    ).toBe(true);
  });
});

describe('auto-categorize — isAcademic (Stage 2 false-positive lockout)', () => {
  it('rejects preschool-age Montessori (3 Alexander Montessori cases)', () => {
    expect(
      isAcademic({
        description: 'Preschool-age Montessori summer program.',
        ages_min: 2,
      }),
    ).toBe(false);
    expect(
      isAcademic({
        description: 'Toddler- and preschool-age Montessori summer program.',
        ages_min: 2,
      }),
    ).toBe(false);
    expect(
      isAcademic({
        description: 'Preschool Montessori summer program on Red Road.',
        ages_min: 3,
      }),
    ).toBe(false);
  });

  it('rejects coconut-grove-montessori (ages 2 — pedagogy, not academic)', () => {
    expect(
      isAcademic({
        description:
          'Montessori-rooted summer camp with science camp programming and a dedicated Toddler Science Camp.',
        ages_min: 2,
      }),
    ).toBe(false);
  });

  it('rejects STEM camp where academic would be redundant (city-of-aventura case)', () => {
    expect(
      isAcademic({
        description:
          'Summer STEM camp exploring science, technology, engineering, and math with stimulating projects and weekly field trips.',
        ages_min: 6,
      }),
    ).toBe(false);
  });

  it('accepts age-appropriate camp with explicit academic-enrichment phrase', () => {
    expect(
      isAcademic({
        description:
          'Summer academic enrichment program for rising 4th–8th graders. Reading, writing, and math enrichment.',
        ages_min: 9,
      }),
    ).toBe(true);
  });

  it('accepts SAT-prep camp', () => {
    expect(
      isAcademic({
        description: 'Intensive SAT prep summer program for rising juniors.',
        ages_min: 15,
      }),
    ).toBe(true);
  });

  it('accepts tutoring program', () => {
    expect(
      isAcademic({
        description: 'After-school tutoring with credentialed teachers.',
        ages_min: 8,
      }),
    ).toBe(true);
  });

  it('rejects when ages_min is missing entirely (defensive — no age signal, no academic tag)', () => {
    expect(
      isAcademic({
        description: 'Academic enrichment program.',
        ages_min: null,
      }),
    ).toBe(false);
    expect(
      isAcademic({ description: 'Academic enrichment program.' }),
    ).toBe(false);
  });

  it('rejects null / empty description', () => {
    expect(isAcademic({ description: null, ages_min: 10 })).toBe(false);
    expect(isAcademic({ description: '', ages_min: 10 })).toBe(false);
  });

  it('case-insensitive on phrase match', () => {
    expect(
      isAcademic({
        description: 'OFFERING TUTORING for grades 3-8.',
        ages_min: 8,
      }),
    ).toBe(true);
  });
});
