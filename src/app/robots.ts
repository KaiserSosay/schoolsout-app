import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/app/', '/admin/', '/api/admin/', '/api/'],
      },
    ],
    sitemap: 'https://schoolsout.net/sitemap.xml',
    host: 'https://schoolsout.net',
  };
}
