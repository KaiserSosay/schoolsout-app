import { describe, expect, it } from 'vitest';
import robots from '@/app/robots';

describe('robots.txt', () => {
  it('disallows /app/, /admin/, /api/admin/, /api/ for all user agents', () => {
    const r = robots();
    const rule = Array.isArray(r.rules) ? r.rules[0] : r.rules;
    expect(rule?.userAgent).toBe('*');
    const disallow = Array.isArray(rule?.disallow) ? rule?.disallow : [rule?.disallow ?? ''];
    expect(disallow).toEqual(
      expect.arrayContaining(['/app/', '/admin/', '/api/admin/', '/api/']),
    );
  });

  it('points sitemap at the canonical host', () => {
    const r = robots();
    expect(r.sitemap).toBe('https://schoolsout.net/sitemap.xml');
    expect(r.host).toBe('https://schoolsout.net');
  });
});
