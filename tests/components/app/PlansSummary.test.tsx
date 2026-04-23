import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PlansSummary, type PlanCard } from '@/components/app/PlansSummary';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => '/en/app',
}));

const makeCard = (over: Partial<PlanCard> = {}): PlanCard => ({
  plan_id: 'p1',
  closure: {
    id: 'c1',
    name: 'Memorial Day',
    start_date: '2030-05-27',
    emoji: '🇺🇸',
  },
  kid_name: 'Noah',
  plan_type: 'coverage',
  camp_names: ['Miami Children\'s Museum'],
  registration_deadline: null,
  registration_url: null,
  registered: false,
  ...over,
});

describe('PlansSummary', () => {
  it('renders null when no plans AND no upcoming closures', () => {
    const { container } = render(
      <PlansSummary cards={[]} locale="en" hasUpcomingClosures={false} />,
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders soft-prompt empty state when no plans but upcoming closures exist', () => {
    render(<PlansSummary cards={[]} locale="en" hasUpcomingClosures={true} />);
    expect(screen.getByText(/haven't planned any days/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Plan ahead/ }).getAttribute('href'))
      .toBe('/en/app/plan-ahead');
  });

  it('renders one card per (plan, kid)', () => {
    const cards: PlanCard[] = [
      makeCard({ plan_id: 'p1', kid_name: 'Noah' }),
      makeCard({ plan_id: 'p1', kid_name: 'Dakota' }),
    ];
    render(<PlansSummary cards={cards} locale="en" hasUpcomingClosures={true} />);
    expect(screen.getByText(/Noah · Memorial Day/)).toBeInTheDocument();
    expect(screen.getByText(/Dakota · Memorial Day/)).toBeInTheDocument();
  });

  it('shows registration deadline with urgency coloring when inside 7 days', () => {
    // Pick a near-future deadline so days-until lands in the amber bucket.
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 5);
    const iso = tomorrow.toISOString().slice(0, 10);
    render(
      <PlansSummary
        cards={[
          makeCard({
            registration_deadline: iso,
          }),
        ]}
        locale="en"
        hasUpcomingClosures={true}
      />,
    );
    const pill = screen.getByText(/Register by/);
    expect(pill.className).toMatch(/bg-amber-100|bg-red-100/);
  });

  it('hides Mark registered button once registered=true', () => {
    render(
      <PlansSummary
        cards={[makeCard({ registered: true })]}
        locale="en"
        hasUpcomingClosures={true}
      />,
    );
    expect(screen.queryByRole('button', { name: /Mark registered/ })).toBeNull();
    expect(screen.getByText('Registered')).toBeInTheDocument();
  });
});
