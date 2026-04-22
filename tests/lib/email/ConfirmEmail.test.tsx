import { render } from '@react-email/render';
import { describe, it, expect } from 'vitest';
import { ConfirmEmail } from '@/lib/email/ConfirmEmail';

describe('ConfirmEmail', () => {
  // DECISION: confirmUrl with no `&` in the query string so we can assert it
  // appears verbatim in rendered HTML. React Email escapes `&` to `&amp;` in
  // href attributes, so a URL containing `&` would fail a literal substring
  // match. Real Supabase action_links are a single opaque token URL anyway.
  const confirmUrl =
    'https://example.supabase.co/auth/v1/verify?token=abc123xyz';

  it('renders English heading, body, CTA, and embeds confirmUrl', async () => {
    const html = await render(ConfirmEmail({ locale: 'en', confirmUrl }));
    // React Email escapes apostrophes to &#x27; — match either form
    expect(html).toMatch(/Confirm your School(&#x27;|')s Out/);
    expect(html).toMatch(/One more step/);
    expect(html).toMatch(/Confirm my email/);
    expect(html).toContain(confirmUrl);
    expect(html).toMatch(/expires in 1 hour/);
  });

  it('renders Spanish heading, body, CTA, and embeds confirmUrl', async () => {
    const html = await render(ConfirmEmail({ locale: 'es', confirmUrl }));
    expect(html).toMatch(/Confirma tu suscripción/);
    expect(html).toMatch(/Un paso más/);
    expect(html).toMatch(/Confirmar mi correo/);
    expect(html).toContain(confirmUrl);
    expect(html).toMatch(/expira en 1 hora/);
  });
});
