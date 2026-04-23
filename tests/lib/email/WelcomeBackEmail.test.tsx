import { render } from '@react-email/render';
import { describe, it, expect } from 'vitest';
import { WelcomeBackEmail } from '@/lib/email/WelcomeBackEmail';

describe('WelcomeBackEmail', () => {
  // React Email escapes `&` to `&amp;` in href attributes; use a URL with no
  // ampersand so literal `.toContain(...)` assertions still match.
  const magicLinkUrl = 'https://schoolsout.net/auth/callback?token_hash=xyz';
  const unsubscribeUrl = 'https://schoolsout.net/api/reminders/unsubscribe?sub=sub-2';

  it('renders the English welcome-back template with CTA, magic link, and unsubscribe', async () => {
    const html = await render(WelcomeBackEmail({ locale: 'en', magicLinkUrl, unsubscribeUrl }));
    expect(html).toMatch(/Hey again/);
    expect(html).toMatch(/Knew it was you/);
    expect(html).toMatch(/Sign me in/);
    expect(html).toContain(magicLinkUrl);
    expect(html).toMatch(/kept your spot warm/);
    expect(html).toMatch(/Noah/);
    expect(html).toContain(unsubscribeUrl);
    expect(html).toMatch(/mailto:hi@schoolsout\.net/);
  });

  it('renders the Spanish welcome-back template with Spanish CTA, magic link, and unsubscribe', async () => {
    const html = await render(WelcomeBackEmail({ locale: 'es', magicLinkUrl, unsubscribeUrl }));
    expect(html).toMatch(/Hola de nuevo/);
    expect(html).toMatch(/Sabía que eras tú/);
    expect(html).toMatch(/Iniciar sesión/);
    expect(html).toContain(magicLinkUrl);
    expect(html).toMatch(/Cancelar suscripción/);
    expect(html).toContain(unsubscribeUrl);
  });

  it('still renders without an unsubscribe URL (dev/local path)', async () => {
    const html = await render(WelcomeBackEmail({ locale: 'en', magicLinkUrl }));
    expect(html).toMatch(/Sign me in/);
    expect(html).not.toContain('/api/reminders/unsubscribe');
  });
});
