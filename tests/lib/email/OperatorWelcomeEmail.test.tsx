import { render } from '@react-email/render';
import { describe, it, expect } from 'vitest';
import {
  OperatorWelcomeEmail,
  operatorWelcomeSubject,
} from '@/lib/email/OperatorWelcomeEmail';

describe('OperatorWelcomeEmail', () => {
  const magicLinkUrl =
    'https://schoolsout.net/en/auth/sign-in?next=%2Fen%2Foperator%2Fcool-camp';
  // Pick a date with no ambiguous Intl rendering across locales.
  const expiresAtIso = '2026-05-09T00:00:00.000Z';

  it('renders the English operator template with camp name + CTA + dashboard URL', async () => {
    const html = await render(
      OperatorWelcomeEmail({
        locale: 'en',
        campName: 'Cool Summer Camp',
        magicLinkUrl,
        expiresAtIso,
      }),
    );
    expect(html).toMatch(/Cool Summer Camp is live/);
    expect(html).toMatch(/Open my dashboard/);
    expect(html).toContain(magicLinkUrl);
    // Bullet list mentions the editable areas
    expect(html).toMatch(/Hours, before\/after-care/);
    expect(html).toMatch(/Photos/);
    expect(html).toMatch(/holiday/i);
    // Expiry text mentions the formatted date
    expect(html).toMatch(/expires/i);
  });

  it('renders the Spanish operator template with localized copy', async () => {
    const html = await render(
      OperatorWelcomeEmail({
        locale: 'es',
        campName: 'Campamento Genial',
        magicLinkUrl,
        expiresAtIso,
      }),
    );
    expect(html).toMatch(/Campamento Genial está en vivo/);
    expect(html).toMatch(/Abrir mi panel/);
    expect(html).toMatch(/Sin presión/);
  });

  it('formats subjects per locale', () => {
    expect(operatorWelcomeSubject('en', 'Cool Camp')).toMatch(
      /Cool Camp is live on School(&#x27;|')?s Out!/,
    );
    expect(operatorWelcomeSubject('es', 'Campamento Genial')).toMatch(
      /Campamento Genial está en/,
    );
  });
});
