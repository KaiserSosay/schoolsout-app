// DECISION: Centralize the 4 welcome/welcome-back subject lines so the
// subscribe route and any future dry-run script agree on one source of truth.
// Goal 2 of the Phase 1.5 warmth pass.

export function welcomeSubject(isReturning: boolean, locale: 'en' | 'es'): string {
  if (isReturning) {
    return locale === 'es' ? '¡Qué bueno verte! 👋' : 'Welcome back 👋';
  }
  return locale === 'es'
    ? "¡Ya estás dentro! Bienvenido a School's Out! 🎉"
    : "You're in. Welcome to School's Out! 🎉";
}
