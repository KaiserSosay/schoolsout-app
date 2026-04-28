// Helpers for resolving camp logo + hero image URLs from Supabase
// Storage. Phase B image-upload UX writes files into one of two
// public-read buckets (set up by migration 055):
//   - camp-logos  — square logos, ~256x256
//   - camp-heroes — 16:9 cover images, ~1200x675
//
// File names follow the camp slug. Multiple extensions are checked in
// preference order (webp first for size, then png/jpeg, svg only for
// logos) so an admin can upload whichever format they have.
//
// These helpers do NOT read the database — they construct the public
// URL deterministically from the slug + bucket name. The caller decides
// how to surface "no image yet" (e.g., fall back to the camp's logo_url
// column on `camps`, or render an emoji placeholder).
//
// Phase B note: once we wire actual upload, prefer reading
// camps.logo_url / camps.hero_url directly (those columns added in
// migration 054). These string-based helpers are a fallback for a
// camp whose row has no image URL stamped yet but whose file already
// landed in the bucket — useful during a bulk-import pass.

import { env } from '@/lib/env';

const LOGO_EXTS = ['webp', 'png', 'jpg', 'jpeg', 'svg'] as const;
const HERO_EXTS = ['webp', 'png', 'jpg', 'jpeg'] as const;

export type CampImageBucket = 'camp-logos' | 'camp-heroes';

// Build the public URL for an object in a given bucket. Mirrors what
// supabase.storage.from(bucket).getPublicUrl(path) returns, but doesn't
// require a client instance.
export function buildPublicUrl(bucket: CampImageBucket, fileName: string): string {
  const base = env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/$/, '');
  return `${base}/storage/v1/object/public/${bucket}/${fileName}`;
}

// Default-extension URL — first preference (webp). Rasheid's morning
// upload UI defaults to webp, so this is the most likely existing
// filename. For a thorough lookup that probes all extensions, do a
// HEAD request per ext (deferred — Phase B will track the actual
// extension in camps.logo_url instead).
export function getCampLogoUrl(slug: string): string | null {
  if (!slug) return null;
  return buildPublicUrl('camp-logos', `${slug}.${LOGO_EXTS[0]}`);
}

export function getCampHeroUrl(slug: string): string | null {
  if (!slug) return null;
  return buildPublicUrl('camp-heroes', `${slug}.${HERO_EXTS[0]}`);
}

// Lists every plausible URL for a given slug — useful when the caller
// wants to probe with HEAD requests during a bulk-import pass. Order
// is preference (webp first).
export function getCampLogoCandidates(slug: string): string[] {
  if (!slug) return [];
  return LOGO_EXTS.map((ext) => buildPublicUrl('camp-logos', `${slug}.${ext}`));
}

export function getCampHeroCandidates(slug: string): string[] {
  if (!slug) return [];
  return HERO_EXTS.map((ext) => buildPublicUrl('camp-heroes', `${slug}.${ext}`));
}
