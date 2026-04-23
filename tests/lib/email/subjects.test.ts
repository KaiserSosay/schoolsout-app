import { describe, it, expect } from 'vitest';
import { welcomeSubject } from '@/lib/email/subjects';

describe('welcomeSubject', () => {
  it('returns English new-user subject when isReturning=false, locale=en', () => {
    expect(welcomeSubject(false, 'en')).toBe("You're in. Welcome to School's Out! 🎉");
  });

  it('returns Spanish new-user subject when isReturning=false, locale=es', () => {
    expect(welcomeSubject(false, 'es')).toBe("¡Ya estás dentro! Bienvenido a School's Out! 🎉");
  });

  it('returns English welcome-back subject when isReturning=true, locale=en', () => {
    expect(welcomeSubject(true, 'en')).toBe('Welcome back 👋');
  });

  it('returns Spanish welcome-back subject when isReturning=true, locale=es', () => {
    expect(welcomeSubject(true, 'es')).toBe('¡Qué bueno verte! 👋');
  });
});
