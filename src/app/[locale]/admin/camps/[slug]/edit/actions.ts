'use server';

import { revalidatePath } from 'next/cache';
import { createServiceSupabase } from '@/lib/supabase/service';
import { requireAdminPage } from '@/lib/auth/requireAdmin';

// Phase B Step 2 — server action for the FIVE wired fields in
// /admin/camps/[slug]/edit. Everything else on that form is still
// scaffold-mode and submits through other paths.
//
// Why a separate action instead of extending /api/admin/camps/[slug]/edit:
// the existing route patches a long list of legacy fields. Wiring a
// surgical action here keeps validation tight (R5: don't let unrelated
// fields ride along) and makes the morning's vertical slice obvious.

const TAGLINE_MAX = 200;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_RE = /^https?:\/\//;
const FEATURED_DEFAULT_DAYS = 90;

export type UpdateCampSimpleFieldsInput = {
  slug: string;
  tagline: string | null;
  phone: string | null;
  email: string | null;
  registration_url: string | null;
  is_featured: boolean;
  logo_url: string | null;
  hero_url: string | null;
};

export type UpdateCampSimpleFieldsResult =
  | { ok: true }
  | { ok: false; errors: Record<string, string> };

export async function updateCampSimpleFields(
  input: UpdateCampSimpleFieldsInput,
): Promise<UpdateCampSimpleFieldsResult> {
  // requireAdminPage redirects on failure; if it returns we're admin.
  await requireAdminPage();

  const errors: Record<string, string> = {};

  const tagline = input.tagline?.trim() || null;
  const phone = input.phone?.trim() || null;
  const email = input.email?.trim() || null;
  const registrationUrl = input.registration_url?.trim() || null;
  const logoUrl = input.logo_url?.trim() || null;
  const heroUrl = input.hero_url?.trim() || null;

  if (tagline && tagline.length > TAGLINE_MAX) {
    errors.tagline = `Tagline must be ${TAGLINE_MAX} characters or fewer`;
  }
  if (email && !EMAIL_RE.test(email)) {
    errors.email = 'Invalid email format';
  }
  if (registrationUrl && !URL_RE.test(registrationUrl)) {
    errors.registration_url =
      'Registration URL must start with http:// or https://';
  }
  if (logoUrl && !URL_RE.test(logoUrl)) {
    errors.logo_url = 'Logo URL must start with http:// or https://';
  }
  if (heroUrl && !URL_RE.test(heroUrl)) {
    errors.hero_url = 'Hero URL must start with http:// or https://';
  }
  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  const db = createServiceSupabase();

  // R5-style read: check current featured_until so we don't overwrite an
  // intentional future date when the toggle stays on.
  const { data: current, error: readErr } = await db
    .from('camps')
    .select('featured_until')
    .eq('slug', input.slug)
    .maybeSingle();

  if (readErr || !current) {
    return {
      ok: false,
      errors: { _form: readErr?.message ?? 'Camp not found' },
    };
  }

  const updates: Record<string, unknown> = {
    tagline,
    phone,
    email,
    registration_url: registrationUrl,
    is_featured: input.is_featured,
    logo_url: logoUrl,
    hero_url: heroUrl,
  };

  if (input.is_featured) {
    const now = Date.now();
    const currentUntilMs = current.featured_until
      ? new Date(current.featured_until).getTime()
      : 0;
    if (!currentUntilMs || currentUntilMs < now) {
      updates.featured_until = new Date(
        now + FEATURED_DEFAULT_DAYS * 24 * 60 * 60 * 1000,
      ).toISOString();
    }
  }

  const { error } = await db
    .from('camps')
    .update(updates)
    .eq('slug', input.slug);

  if (error) {
    return { ok: false, errors: { _form: error.message } };
  }

  revalidatePath(`/[locale]/camps/${input.slug}`, 'page');
  revalidatePath(`/[locale]/app/camps/${input.slug}`, 'page');
  revalidatePath(`/[locale]/admin/camps/${input.slug}/edit`, 'page');

  return { ok: true };
}
