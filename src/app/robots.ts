import type { MetadataRoute } from 'next';

// Phase 2.7.1: explicit AI-engine allowlist. Google-Extended, GPTBot,
// ClaudeBot, and PerplexityBot each need their own rule — they only
// obey entries keyed on their exact user-agent, not the '*' catch-all.
// The disallow set still matches the original: block the signed-in app,
// admin, and every API route. Public directory pages stay crawlable.
export default function robots(): MetadataRoute.Robots {
  const disallow = ['/app/', '/admin/', '/api/admin/', '/api/'];
  const rule = { allow: '/', disallow };
  return {
    rules: [
      { userAgent: '*', ...rule },
      { userAgent: 'GPTBot', ...rule },
      { userAgent: 'ClaudeBot', ...rule },
      { userAgent: 'PerplexityBot', ...rule },
      { userAgent: 'Google-Extended', ...rule },
    ],
    sitemap: 'https://schoolsout.net/sitemap.xml',
    host: 'https://schoolsout.net',
  };
}
