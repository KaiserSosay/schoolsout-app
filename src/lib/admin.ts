import { env } from '@/lib/env';

// DECISION: Admin gating driven by an env var allowlist rather than a DB role
// column. Keeps the "who can approve closures" decision inside deploy-time
// config (you have to add the email to Vercel env to grant), which matches our
// single-admin reality during MVP. When we grow past 2-3 admins we'll migrate
// to a `users.role = 'admin'` check.
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const allowed = (env.ADMIN_EMAILS || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return allowed.includes(email.toLowerCase());
}
