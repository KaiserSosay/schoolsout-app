import { render } from '@react-email/render';
import { describe, it, expect } from 'vitest';
import { WelcomeEmail } from '@/lib/email/WelcomeEmail';

describe('WelcomeEmail', () => {
  // React Email escapes `&` to `&amp;` in href attributes; use a URL with no
  // ampersand so literal `.toContain(...)` assertions still match.
  const magicLinkUrl = 'https://schoolsout.net/auth/callback?token_hash=abc';
  const unsubscribeUrl = 'https://schoolsout.net/api/reminders/unsubscribe?sub=sub-1';

  it('renders the English welcome template with CTA, magic link, and unsubscribe', async () => {
    const html = await render(WelcomeEmail({ locale: 'en', magicLinkUrl, unsubscribeUrl }));
    expect(html).toMatch(/Hey there/);
    expect(html).toMatch(/officially on the list/);
    expect(html).toMatch(/Sign me in/);
    expect(html).toContain(magicLinkUrl);
    expect(html).toMatch(/Noah/);
    expect(html).toMatch(/If you(&#x27;|')ve got an idea/);
    expect(html).toContain(unsubscribeUrl);
    // Contact mailto link
    expect(html).toMatch(/mailto:hi@schoolsout\.net/);
  });

  it('renders the Spanish welcome template with Spanish CTA, magic link, and unsubscribe', async () => {
    const html = await render(WelcomeEmail({ locale: 'es', magicLinkUrl, unsubscribeUrl }));
    expect(html).toMatch(/Hola/);
    expect(html).toMatch(/oficialmente en la lista/);
    expect(html).toMatch(/Iniciar sesión/);
    expect(html).toContain(magicLinkUrl);
    expect(html).toMatch(/Cancelar suscripción/);
    expect(html).toContain(unsubscribeUrl);
  });

  it('still renders without an unsubscribe URL (dev/local path)', async () => {
    const html = await render(WelcomeEmail({ locale: 'en', magicLinkUrl }));
    expect(html).toMatch(/Sign me in/);
    expect(html).not.toContain('/api/reminders/unsubscribe');
  });
});
