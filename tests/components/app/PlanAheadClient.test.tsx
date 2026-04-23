import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PlanAheadClient, type PlanAheadClosure } from '@/components/app/PlanAheadClient';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => '/en/app/plan-ahead',
}));

// jsdom localStorage stub + so-kids name preload.
beforeEach(() => {
  const store = new Map<string, string>();
  store.set('so-kids', JSON.stringify([{ name: 'Noah' }, { name: 'Dakota' }]));
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: {
      get length() {
        return store.size;
      },
      clear: () => store.clear(),
      getItem: (k: string) => store.get(k) ?? null,
      key: (i: number) => Array.from(store.keys())[i] ?? null,
      removeItem: (k: string) => {
        store.delete(k);
      },
      setItem: (k: string, v: string) => {
        store.set(k, String(v));
      },
    } as Storage,
  });
});

const closures: PlanAheadClosure[] = [
  {
    id: 'c-memorial',
    school_id: 's1',
    school_name: 'The Growing Place',
    name: 'Memorial Day',
    start_date: '2030-05-27',
    end_date: '2030-05-27',
    emoji: '🇺🇸',
  },
  {
    id: 'c-summer',
    school_id: 's1',
    school_name: 'The Growing Place',
    name: 'Summer Break',
    start_date: '2030-06-10',
    end_date: '2030-08-20',
    emoji: '☀️',
  },
];

const kids = [
  { id: 'k0', age_range: '7-9', ordinal: 0, school_id: 's1', fallback_name: 'Kid 1' },
  { id: 'k1', age_range: '4-6', ordinal: 1, school_id: 's1', fallback_name: 'Kid 2' },
];

describe('PlanAheadClient', () => {
  it('renders headline counter with closure count', async () => {
    await act(async () => {
      render(<PlanAheadClient locale="en" closures={closures} kids={kids} plans={[]} />);
    });
    expect(screen.getByText(/2 upcoming closures/)).toBeInTheDocument();
  });

  it('renders a chip per kid per closure, all unplanned', async () => {
    await act(async () => {
      render(<PlanAheadClient locale="en" closures={closures} kids={kids} plans={[]} />);
    });
    const chips = screen.getAllByText(/plan\?/);
    // 2 kids × 2 closures = 4 unplanned chips
    expect(chips).toHaveLength(4);
  });

  it('flips chip to planned when a plan with that kid_name exists', async () => {
    await act(async () => {
      render(
        <PlanAheadClient
          locale="en"
          closures={closures}
          kids={kids}
          plans={[
            {
              plan_id: 'p1',
              closure_id: 'c-memorial',
              kid_names: ['Noah'],
              registered: false,
            },
          ]}
        />,
      );
    });
    // Noah is kid ordinal 0; localStorage maps so the display_name is "Noah"
    expect(screen.getByText('Noah · planned')).toBeInTheDocument();
  });

  it('shows registered state + count in header', async () => {
    await act(async () => {
      render(
        <PlanAheadClient
          locale="en"
          closures={closures}
          kids={kids}
          plans={[
            {
              plan_id: 'p1',
              closure_id: 'c-memorial',
              kid_names: ['Noah'],
              registered: true,
            },
          ]}
        />,
      );
    });
    expect(screen.getByText('Noah ✓ registered')).toBeInTheDocument();
    expect(screen.getByText(/1 registered/)).toBeInTheDocument();
  });

  it('empty-state copy when no closures', async () => {
    await act(async () => {
      render(<PlanAheadClient locale="en" closures={[]} kids={kids} plans={[]} />);
    });
    expect(screen.getByText(/No upcoming closures yet/)).toBeInTheDocument();
  });
});
