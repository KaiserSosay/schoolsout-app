import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { describe, it, expect } from 'vitest';
import { StatsGrid } from '@/components/app/StatsGrid';
import { daysUntil } from '@/lib/countdown';
import messages from '@/i18n/messages/en.json';

function wrap(ui: React.ReactNode) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {ui}
    </NextIntlClientProvider>,
  );
}

describe('StatsGrid', () => {
  it('renders four stat cells with labels + values', () => {
    const closures = [
      {
        id: 'c1',
        school_id: 's1',
        name: 'Spring Break',
        start_date: '2099-04-01',
        end_date: '2099-04-05',
        emoji: '🌸',
      },
      {
        id: 'c2',
        school_id: 's1',
        name: 'Summer Break',
        start_date: '2099-06-01',
        end_date: '2099-08-15',
        emoji: '☀️',
      },
    ];
    wrap(<StatsGrid kidCount={2} closures={closures} savesCount={5} locale="en" />);

    const grid = screen.getByTestId('stats-grid');
    expect(grid).toBeInTheDocument();

    const kidsCell = grid.querySelector('[data-stat="kids"]')!;
    const nextCell = grid.querySelector('[data-stat="nextBreakIn"]')!;
    const closuresCell = grid.querySelector('[data-stat="closures"]')!;
    const savedCell = grid.querySelector('[data-stat="saved"]')!;

    expect(kidsCell.textContent).toContain('2');
    expect(closuresCell.textContent).toContain('2');
    expect(savedCell.textContent).toContain('5');

    const expectedDays = Math.max(0, daysUntil('2099-04-01'));
    expect(nextCell.textContent).toContain(`${expectedDays}d`);
  });

  it('shows an em dash for nextBreakIn when there are no closures', () => {
    wrap(<StatsGrid kidCount={1} closures={[]} savesCount={0} locale="en" />);
    const grid = screen.getByTestId('stats-grid');
    const nextCell = grid.querySelector('[data-stat="nextBreakIn"]')!;
    expect(nextCell.textContent).toContain('—');
  });
});
