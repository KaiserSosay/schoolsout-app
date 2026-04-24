import { describe, expect, it } from 'vitest';
import { hashIp, isBotUserAgent } from '@/lib/analytics';

describe('hashIp', () => {
  it('returns null for nullish input', () => {
    expect(hashIp(null)).toBeNull();
    expect(hashIp(undefined)).toBeNull();
    expect(hashIp('')).toBeNull();
  });

  it('produces the same hash for the same IP on the same day', () => {
    const d = new Date('2026-04-23T12:00:00Z');
    expect(hashIp('192.0.2.1', d)).toBe(hashIp('192.0.2.1', d));
  });

  it('produces different hashes for the same IP on different days', () => {
    const d1 = new Date('2026-04-23T12:00:00Z');
    const d2 = new Date('2026-04-24T12:00:00Z');
    expect(hashIp('192.0.2.1', d1)).not.toBe(hashIp('192.0.2.1', d2));
  });

  it('never returns the raw IP', () => {
    const hashed = hashIp('10.0.0.5', new Date('2026-04-23'));
    expect(hashed).not.toContain('10.0.0.5');
    expect(hashed).toMatch(/^[a-f0-9]{32}$/);
  });
});

describe('isBotUserAgent', () => {
  it('flags obviously missing UA as bot', () => {
    expect(isBotUserAgent(null)).toBe(true);
    expect(isBotUserAgent('')).toBe(true);
  });

  it('flags known crawler UAs', () => {
    for (const ua of [
      'Googlebot/2.1',
      'bingbot/2.0',
      'Mozilla/5.0 (compatible; ClaudeBot/1.0)',
      'ChatGPT-User',
      'PerplexityBot/1.0',
      'GPTBot/1.0',
      'facebookexternalhit/1.1',
    ]) {
      expect(isBotUserAgent(ua), ua).toBe(true);
    }
  });

  it('does not flag normal browsers', () => {
    for (const ua of [
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) AppleWebKit/605.1.15',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0',
    ]) {
      expect(isBotUserAgent(ua), ua).toBe(false);
    }
  });
});
