// DECISION: Pattern matches the existing `maskEmail` helper inside
// src/components/home/HeroSignupForm.tsx — promoted to a shared lib so the
// server route (for logging/telemetry) and every client surface can agree on
// one canonical rendering. Keep the HeroSignupForm local helper intact for
// now; Goal 1 rewires it to call this shared helper so there's a single
// source of truth.

export function obfuscateEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return email;
  // Show first char only, mask rest, keep domain.
  // "rkscarlett@gmail.com" -> "r***@gmail.com"
  const first = local.charAt(0);
  return `${first}***@${domain}`;
}
