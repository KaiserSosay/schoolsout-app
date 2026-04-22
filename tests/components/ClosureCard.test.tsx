import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { describe, it, expect } from 'vitest';
import { ClosureCard } from '@/components/ClosureCard';

const messages = {
  home: { countdown: { today: 'Today', tomorrow: 'Tomorrow', days: 'in {days} days' } },
  closure: { badge: { threeDayWeekend: '3-Day Weekend', longBreak: 'Long Break', summer: 'Summer' } },
};

function wrap(closure: Parameters<typeof ClosureCard>[0]['closure']) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <ClosureCard closure={closure} today={new Date('2026-04-21T12:00:00Z')} />
    </NextIntlClientProvider>
  );
}

describe('ClosureCard', () => {
  it('renders name, emoji, and date range', () => {
    wrap({ id: '1', name: 'Spring Break', start_date: '2026-04-28', end_date: '2026-05-02', emoji: '🌸' });
    expect(screen.getByText('Spring Break')).toBeInTheDocument();
    expect(screen.getByText('🌸')).toBeInTheDocument();
    expect(screen.getByText(/in 7 days/i)).toBeInTheDocument();
  });

  it('shows long-break badge for 5+ days', () => {
    wrap({ id: '1', name: 'Spring Break', start_date: '2026-04-28', end_date: '2026-05-02', emoji: '🌸' });
    expect(screen.getByText(/Long Break/i)).toBeInTheDocument();
  });
});
