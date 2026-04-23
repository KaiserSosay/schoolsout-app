import { describe, it, expect } from 'vitest';
import { obfuscateEmail } from '@/lib/email/obfuscate';

describe('obfuscateEmail', () => {
  it('masks the typical case: first char + stars, domain intact', () => {
    expect(obfuscateEmail('rkscarlett@gmail.com')).toBe('r***@gmail.com');
  });

  it('single-char local part still returns first char + stars + domain', () => {
    expect(obfuscateEmail('a@example.com')).toBe('a***@example.com');
  });

  it('empty string returns empty string unchanged', () => {
    expect(obfuscateEmail('')).toBe('');
  });

  it('string with no @ sign returns the input unchanged', () => {
    expect(obfuscateEmail('not-an-email')).toBe('not-an-email');
  });
});
