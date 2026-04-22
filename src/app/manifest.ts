import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "School's Out!",
    short_name: "School's Out!",
    description: 'Every Miami school closure + camp, in one free app.',
    start_url: '/',
    display: 'standalone',
    theme_color: '#1a0b2e',
    background_color: '#FBF8F1',
    icons: [
      { src: '/icon', sizes: '192x192', type: 'image/png' },
      { src: '/apple-icon', sizes: '180x180', type: 'image/png' },
    ],
  };
}
