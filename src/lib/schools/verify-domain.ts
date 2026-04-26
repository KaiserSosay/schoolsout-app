// Domain-match helper for the school-calendar submission form. When a
// parent / staff member submits a proposed calendar update, the API
// flags `domain_verified=true` if their email's domain matches the
// school's website domain. Admin sees the flag and fast-tracks those
// submissions for review.
//
// Strict equality — subdomain mismatch ("email.school.org" vs
// "school.org") returns false. The brief calls this out explicitly:
// catch-all email or relay subdomains shouldn't auto-verify, since
// they're trivially spoofable.

export function extractDomain(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return null;
  }
}

export function extractEmailDomain(email: string): string | null {
  const match = email.match(/@(.+)$/);
  return match ? match[1].toLowerCase() : null;
}

export function isDomainVerified(
  schoolWebsite: string | null,
  submitterEmail: string,
): boolean {
  const schoolDomain = extractDomain(schoolWebsite);
  const emailDomain = extractEmailDomain(submitterEmail);
  if (!schoolDomain || !emailDomain) return false;
  return schoolDomain === emailDomain;
}
