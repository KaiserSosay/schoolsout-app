import { render } from '@react-email/render';
import { describe, it, expect } from 'vitest';
import { ReminderEmail } from '@/lib/email/ReminderEmail';

describe('ReminderEmail', () => {
  it('renders English content with closure name and days_before', async () => {
    const html = await render(ReminderEmail({
      locale: 'en',
      closureName: 'Spring Break',
      startDate: '2026-04-28',
      endDate: '2026-05-02',
      emoji: '🌸',
      daysBefore: 7,
      unsubscribeUrl: 'https://schoolsout.net/api/reminders/unsubscribe?sub=x&sig=y',
    }));
    expect(html).toMatch(/Spring Break/);
    expect(html).toMatch(/in 7 days/);
    expect(html).toMatch(/[Uu]nsubscribe/);
  });

  it('renders Spanish content when locale=es', async () => {
    const html = await render(ReminderEmail({
      locale: 'es',
      closureName: 'Vacaciones de Primavera',
      startDate: '2026-04-28',
      endDate: '2026-05-02',
      emoji: '🌸',
      daysBefore: 7,
      unsubscribeUrl: 'https://schoolsout.net/api/reminders/unsubscribe?sub=x&sig=y',
    }));
    expect(html).toMatch(/Vacaciones/);
    expect(html).toMatch(/en 7 días/);
  });
});
