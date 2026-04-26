import { describe, it, expect } from 'vitest';
// looksLikeClosure is the function the iCal sync uses (via parseIcsString).
// After v4 (this commit), its body is the allowlist-based isClosureEvent.
// The test file uses the new exported alias for clarity.
import { isClosureEvent } from '../../scripts/parse-school-calendars';

// Allowlist filter — the v4 posture for iCal closure detection. Three
// iterations of negative-keyword filters kept letting non-closure events
// through (graduations, ceremonies, summer programs, extracurriculars).
// Switching to a positive allowlist eliminated the regression class.
//
// False negatives are admin-fixable. False positives destroy trust.

describe('isClosureEvent — allowlist passes real closures', () => {
  it('"Labor Day - No School"', () =>
    expect(isClosureEvent('Labor Day - No School')).toBe(true));
  it('"Thanksgiving Break"', () =>
    expect(isClosureEvent('Thanksgiving Break')).toBe(true));
  it('"Spring Break"', () =>
    expect(isClosureEvent('Spring Break')).toBe(true));
  it('"Easter Monday"', () =>
    expect(isClosureEvent('Easter Monday')).toBe(true));
  it('"Yom Kippur"', () => expect(isClosureEvent('Yom Kippur')).toBe(true));
  it('"First Day of School"', () =>
    expect(isClosureEvent('First Day of School')).toBe(true));
  it('"Teacher Workday"', () =>
    expect(isClosureEvent('Teacher Workday')).toBe(true));
  it('"Memorial Day - No School"', () =>
    expect(isClosureEvent('Memorial Day - No School')).toBe(true));
  it('"Christmas Break"', () =>
    expect(isClosureEvent('Christmas Break')).toBe(true));
  it('"Professional Development Day"', () =>
    expect(isClosureEvent('Professional Development Day')).toBe(true));
});

describe('isClosureEvent — Palmer Trinity regression suite', () => {
  // Every one of these slipped through the previous filter passes and
  // landed on the public Palmer Trinity page as "verified closures."
  // Pin them as false here so a future filter drift can't reintroduce.
  it('rejects "Graduation"', () =>
    expect(isClosureEvent('Graduation')).toBe(false));
  it('rejects "Aquatic Center Groundbreaking"', () =>
    expect(isClosureEvent('Aquatic Center Groundbreaking')).toBe(false));
  it('rejects "Breakthrough Miami Summer Program"', () =>
    expect(isClosureEvent('Breakthrough Miami Summer Program')).toBe(false));
  it('rejects "Breakthrough Summer (tentative)"', () =>
    expect(isClosureEvent('Breakthrough Summer (tentative)')).toBe(false));
  it('rejects "Cheerleading (Half Day)"', () =>
    expect(isClosureEvent('Cheerleading (Half Day)')).toBe(false));
  it('rejects "Stories in Clay (Half Day)"', () =>
    expect(isClosureEvent('Stories in Clay (Half Day)')).toBe(false));
  it('rejects "Cheerleading"', () =>
    expect(isClosureEvent('Cheerleading')).toBe(false));
});

describe('isClosureEvent — soft-deny rejects events that mention closure words but are not closures', () => {
  it('rejects "Holiday Concert" (concert beats holiday)', () =>
    expect(isClosureEvent('Holiday Concert')).toBe(false));
  it('rejects "Easter Celebration"', () =>
    expect(isClosureEvent('Easter Celebration')).toBe(false));
  it('rejects "Holy Thursday Mass"', () =>
    expect(isClosureEvent('Holy Thursday Mass')).toBe(false));
  it('rejects "Veterans Day Observance"', () =>
    expect(isClosureEvent('Veterans Day Observance')).toBe(false));

  // v4.1 (2026-04-26 evening) — Palmer Trinity rendered "Veterans Day
  // Program and Breakfast" as a closure. School-day events that name a
  // holiday but happen DURING school.
  it('rejects "Veterans Day Program and Breakfast"', () =>
    expect(isClosureEvent('Veterans Day Program and Breakfast')).toBe(false));
  it('rejects "Holiday Fair"', () =>
    expect(isClosureEvent('Holiday Fair')).toBe(false));
  it('rejects "Memorial Day Ceremony"', () =>
    expect(isClosureEvent('Memorial Day Ceremony')).toBe(false));
  it('rejects "Thanksgiving Luncheon"', () =>
    expect(isClosureEvent('Thanksgiving Luncheon')).toBe(false));
  it('rejects "MLK Assembly"', () =>
    expect(isClosureEvent('MLK Assembly')).toBe(false));
  it('rejects "Veterans Day Parade"', () =>
    expect(isClosureEvent('Veterans Day Parade')).toBe(false));
  it('rejects "Holiday Workshop"', () =>
    expect(isClosureEvent('Holiday Workshop')).toBe(false));
});

describe('isClosureEvent — unusual but legitimate closure patterns', () => {
  it('passes "School Closed - Hurricane Day"', () =>
    expect(isClosureEvent('School Closed - Hurricane Day')).toBe(true));
  it('passes "No School - Snow Day"', () =>
    expect(isClosureEvent('No School - Snow Day')).toBe(true));
  it('passes "Half Day - Thanksgiving Eve"', () =>
    expect(isClosureEvent('Half Day - Thanksgiving Eve')).toBe(true));
});

describe('isClosureEvent — bare extracurriculars (no allowlist match at all)', () => {
  it('rejects "PTA Meeting"', () =>
    expect(isClosureEvent('PTA Meeting')).toBe(false));
  it('rejects "Open House"', () =>
    expect(isClosureEvent('Open House')).toBe(false));
  it('rejects "Drama Rehearsal"', () =>
    expect(isClosureEvent('Drama Rehearsal')).toBe(false));
  it('rejects "Varsity Football vs. Pinecrest"', () =>
    expect(isClosureEvent('Varsity Football vs. Pinecrest')).toBe(false));
  it('rejects "AP Exam: Calculus"', () =>
    expect(isClosureEvent('AP Exam: Calculus')).toBe(false));
});
