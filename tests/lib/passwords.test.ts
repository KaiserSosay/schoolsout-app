import { describe, it, expect } from 'vitest';
import { validatePassword, passwordStrength } from '@/lib/auth/passwords';

describe('validatePassword', () => {
  it('accepts an 8+ character non-common password', () => {
    expect(validatePassword('miamicoralgables')).toEqual({ ok: true });
  });

  it('rejects passwords shorter than 8 characters', () => {
    expect(validatePassword('shortie')).toEqual({
      ok: false,
      reason: 'too_short',
    });
  });

  it('rejects exactly 7 characters as too short', () => {
    expect(validatePassword('1234567')).toEqual({
      ok: false,
      reason: 'too_short',
    });
  });

  it('accepts exactly 8 characters when not in the common list', () => {
    expect(validatePassword('schoolso')).toEqual({ ok: true });
  });

  it('rejects "password" even though it is 8 characters', () => {
    expect(validatePassword('password')).toEqual({
      ok: false,
      reason: 'too_common',
    });
  });

  it('rejects "12345678" (the most-common 8-char number sequence)', () => {
    expect(validatePassword('12345678')).toEqual({
      ok: false,
      reason: 'too_common',
    });
  });

  it('matches common passwords case-insensitively', () => {
    expect(validatePassword('Password').ok).toBe(false);
    expect(validatePassword('PASSWORD').ok).toBe(false);
    expect(validatePassword('PaSsWoRd').ok).toBe(false);
  });
});

describe('passwordStrength', () => {
  it('returns weak for under 8 characters', () => {
    expect(passwordStrength('short')).toBe('weak');
  });

  it('returns weak for 8 chars with one character class', () => {
    expect(passwordStrength('aaaaaaaa')).toBe('weak');
  });

  it('returns medium for 8 chars with two character classes', () => {
    expect(passwordStrength('aaaaAAAA')).toBe('medium');
  });

  it('returns strong for 16+ characters regardless of class count', () => {
    expect(passwordStrength('aaaaaaaaaaaaaaaa')).toBe('strong');
  });

  it('returns strong for 12+ characters with two character classes', () => {
    expect(passwordStrength('coralgablesA')).toBe('strong');
  });
});
