import { describe, it, expect } from 'vitest';
import { computeReminderWindow } from '@/app/api/cron/send-reminders/dates';

describe('computeReminderWindow', () => {
  it('returns three ISO dates for 3, 7, 14 days out', () => {
    const today = new Date('2026-04-21T12:00:00Z');
    const { d3, d7, d14 } = computeReminderWindow(today);
    expect(d3).toBe('2026-04-24');
    expect(d7).toBe('2026-04-28');
    expect(d14).toBe('2026-05-05');
  });
});
