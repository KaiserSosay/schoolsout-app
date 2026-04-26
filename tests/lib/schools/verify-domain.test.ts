import { describe, it, expect } from 'vitest';
import {
  extractDomain,
  extractEmailDomain,
  isDomainVerified,
} from '@/lib/schools/verify-domain';

describe('extractDomain', () => {
  it('strips www. prefix and lowercases', () => {
    expect(extractDomain('https://www.School.ORG/calendar')).toBe('school.org');
  });

  it('handles plain hostname without www', () => {
    expect(extractDomain('https://school.org/path')).toBe('school.org');
  });

  it('returns null for malformed URLs', () => {
    expect(extractDomain('not-a-url')).toBeNull();
    expect(extractDomain('')).toBeNull();
  });

  it('returns null for null/undefined', () => {
    expect(extractDomain(null)).toBeNull();
    expect(extractDomain(undefined)).toBeNull();
  });
});

describe('extractEmailDomain', () => {
  it('returns the domain part lowercased', () => {
    expect(extractEmailDomain('Principal@School.ORG')).toBe('school.org');
  });

  it('returns null when no @ in the string', () => {
    expect(extractEmailDomain('not-an-email')).toBeNull();
  });
});

describe('isDomainVerified', () => {
  it('matches principal@school.org with https://www.school.org', () => {
    expect(
      isDomainVerified('https://www.school.org/calendar', 'principal@school.org'),
    ).toBe(true);
  });

  it('rejects parent@gmail.com vs school website', () => {
    expect(
      isDomainVerified('https://www.school.org/', 'parent@gmail.com'),
    ).toBe(false);
  });

  it('rejects email subdomain mismatch (email.school.org !== school.org)', () => {
    expect(
      isDomainVerified('https://www.school.org/', 'principal@email.school.org'),
    ).toBe(false);
  });

  it('rejects when website is null', () => {
    expect(isDomainVerified(null, 'principal@school.org')).toBe(false);
  });

  it('rejects when website URL is malformed', () => {
    expect(isDomainVerified('not-a-url', 'principal@school.org')).toBe(false);
  });

  it('is case-insensitive', () => {
    expect(
      isDomainVerified('https://School.ORG/', 'PRINCIPAL@school.org'),
    ).toBe(true);
  });

  it('rejects empty email', () => {
    expect(isDomainVerified('https://www.school.org/', '')).toBe(false);
  });
});
