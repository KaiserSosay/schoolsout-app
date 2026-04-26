// Password policy: length + a small common-passwords blocklist.
// Deliberately NOT enforcing complexity classes (uppercase / numbers /
// special chars) — research consistently finds length matters far more
// than character diversity, and complexity rules push parents toward
// "Password1!" patterns that are barely better than "password".

const MIN_LENGTH = 8;

// Top common passwords — enough to block the worst lazy choices without
// turning into NIST-style overreach. Source: leaked-password lists 2023+.
const COMMON_PASSWORDS = new Set([
  'password',
  'password1',
  'password123',
  '12345678',
  '123456789',
  '1234567890',
  'qwerty123',
  'qwertyuiop',
  'iloveyou',
  'welcome1',
  'admin123',
  'letmein1',
  'monkey123',
  '1q2w3e4r',
  'asdfghjkl',
  'football',
  'baseball',
  'sunshine',
  'princess',
  'starwars',
  'superman',
  'batman123',
  'whatever',
  'trustno1',
  'abc12345',
]);

export type PasswordValidation =
  | { ok: true }
  | { ok: false; reason: 'too_short' | 'too_common' };

export function validatePassword(password: string): PasswordValidation {
  if (password.length < MIN_LENGTH) return { ok: false, reason: 'too_short' };
  if (COMMON_PASSWORDS.has(password.toLowerCase())) {
    return { ok: false, reason: 'too_common' };
  }
  return { ok: true };
}

// Tiny strength heuristic for the UI strength meter. Intentionally
// simple — zxcvbn would be 700KB of bundle for a UX nicety. Returns
// 'weak' | 'medium' | 'strong' based on length and character variety.
export function passwordStrength(
  password: string,
): 'weak' | 'medium' | 'strong' {
  if (password.length < MIN_LENGTH) return 'weak';
  let classes = 0;
  if (/[a-z]/.test(password)) classes++;
  if (/[A-Z]/.test(password)) classes++;
  if (/\d/.test(password)) classes++;
  if (/[^A-Za-z0-9]/.test(password)) classes++;
  if (password.length >= 16) return 'strong';
  if (password.length >= 12 && classes >= 2) return 'strong';
  if (classes >= 2) return 'medium';
  return 'weak';
}
