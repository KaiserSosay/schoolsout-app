import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OnboardingForm, type School } from '@/components/app/OnboardingForm';
import messages from '@/i18n/messages/en.json';

// DECISION: next/navigation relies on the App Router runtime which is absent
// in jsdom. Stub the hooks we use.
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => '/en/app/onboarding',
}));

const schools: School[] = [
  { id: '00000000-0000-0000-0000-000000000001', name: 'The Growing Place' },
  { id: '00000000-0000-0000-0000-000000000002', name: 'Coral Gables Preparatory Academy' },
  { id: '00000000-0000-0000-0000-000000000003', name: 'Miami-Dade County Public Schools' },
  { id: '00000000-0000-0000-0000-000000000099', name: 'Some Other School' },
];

// DECISION: jsdom 29 doesn't ship a full localStorage — stub it so the form
// can persist kid name/grade without tripping a TypeError.
let store: Map<string, string>;
beforeEach(() => {
  store = new Map<string, string>();
  const storageStub: Storage = {
    get length() {
      return store.size;
    },
    clear: () => store.clear(),
    getItem: (k) => (store.has(k) ? store.get(k)! : null),
    key: (i) => Array.from(store.keys())[i] ?? null,
    removeItem: (k) => {
      store.delete(k);
    },
    setItem: (k, v) => {
      store.set(k, String(v));
    },
  };
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: storageStub,
  });
  global.fetch = vi
    .fn()
    .mockResolvedValue({ ok: true, json: async () => ({ ok: true }) }) as any;
});

function wrap() {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <OnboardingForm schools={schools} locale="en" initialName={null} />
    </NextIntlClientProvider>,
  );
}

describe('OnboardingForm', () => {
  it('renders the requested number of kid sections when the count pill is tapped', () => {
    wrap();
    // Starts with 1 kid legend
    expect(screen.getAllByText(/^Kid \d+$/i)).toHaveLength(1);

    fireEvent.click(screen.getByRole('button', { name: '3', pressed: false }));
    expect(screen.getAllByText(/^Kid \d+$/i)).toHaveLength(3);

    fireEvent.click(screen.getByRole('button', { name: '2', pressed: false }));
    expect(screen.getAllByText(/^Kid \d+$/i)).toHaveLength(2);
  });

  it('submit POSTs /api/me and /api/kid-profiles with age_range derived from grade', async () => {
    wrap();

    // Parent name
    fireEvent.change(screen.getByPlaceholderText(/Maria/i), {
      target: { value: 'Rasheid' },
    });

    // Grade → age bucket (PreK/K/1/2 → 4-6)
    fireEvent.change(screen.getByTestId('kid-grade-1'), {
      target: { value: 'K' },
    });

    // Pick the first suggested school pill
    fireEvent.click(screen.getByRole('button', { name: /The Growing Place/ }));

    // Step 1 → step 2 (address, optional).
    fireEvent.click(screen.getByRole('button', { name: /^Next/i }));
    // Skip address step.
    fireEvent.click(screen.getByRole('button', { name: /^Skip$/i }));

    await waitFor(() => {
      const calls = (global.fetch as unknown as { mock: { calls: [string, RequestInit][] } }).mock
        .calls;
      const paths = calls.map((c) => c[0]);
      expect(paths).toContain('/api/me');
      expect(paths).toContain('/api/kid-profiles');
    });

    const calls = (global.fetch as unknown as { mock: { calls: [string, RequestInit][] } }).mock
      .calls;
    const kidCall = calls.find((c) => c[0] === '/api/kid-profiles')!;
    const body = JSON.parse(kidCall[1].body as string);
    expect(body).toEqual({
      profiles: [
        {
          school_id: '00000000-0000-0000-0000-000000000001',
          age_range: '4-6',
          ordinal: 1,
          // Migration 038 added optional birth_month + birth_year. The
          // onboarding form sends nulls when the parent didn't pick a
          // birthday — the API accepts and the soft-prompt banner on
          // /app/family asks for it on the next visit.
          birth_month: null,
          birth_year: null,
        },
      ],
    });

    const meCall = calls.find((c) => c[0] === '/api/me')!;
    expect(JSON.parse(meCall[1].body as string)).toEqual({ display_name: 'Rasheid' });
  });

  it('keeps the submit button disabled until parent name + each school is chosen', () => {
    wrap();
    // "Next →" on step 1 takes the place of what used to be "Finish setup".
    const submit = screen.getByRole('button', { name: /^Next/i });
    expect(submit).toBeDisabled();

    fireEvent.change(screen.getByPlaceholderText(/Maria/i), {
      target: { value: 'Rasheid' },
    });
    expect(submit).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: /The Growing Place/ }));
    expect(submit).toBeEnabled();
  });

  it('going from 2 → 4 → 2 preserves kid 1+2 school selections, and submits only visible kids', async () => {
    wrap();

    // Parent name
    fireEvent.change(screen.getByPlaceholderText(/Maria/i), {
      target: { value: 'Rasheid' },
    });

    // Go to 2 kids.
    fireEvent.click(screen.getByRole('button', { name: '2', pressed: false }));

    // Kid 1: Growing Place (suggested), Kid 2: Coral Gables Prep (suggested).
    const growingPlaceButtons = screen.getAllByRole('button', {
      name: /The Growing Place/,
    });
    fireEvent.click(growingPlaceButtons[0]!);
    const coralButtons = screen.getAllByRole('button', {
      name: /Coral Gables Preparatory Academy/,
    });
    fireEvent.click(coralButtons[1]!);

    // Bump to 4.
    fireEvent.click(screen.getByRole('button', { name: '4', pressed: false }));
    expect(screen.getAllByText(/^Kid \d+$/i)).toHaveLength(4);

    // Verify kid 1 + kid 2 selections still pressed.
    const stillGrowing = screen.getAllByRole('button', {
      name: /The Growing Place/,
    });
    expect(stillGrowing[0]!.getAttribute('aria-pressed')).toBe('true');
    const stillCoral = screen.getAllByRole('button', {
      name: /Coral Gables Preparatory Academy/,
    });
    expect(stillCoral[1]!.getAttribute('aria-pressed')).toBe('true');

    // Back to 2.
    fireEvent.click(screen.getByRole('button', { name: '2', pressed: false }));
    expect(screen.getAllByText(/^Kid \d+$/i)).toHaveLength(2);

    // Advance to step 2 then skip the optional address step.
    fireEvent.click(screen.getByRole('button', { name: /^Next/i }));
    fireEvent.click(screen.getByRole('button', { name: /^Skip$/i }));

    await waitFor(() => {
      const calls = (global.fetch as unknown as { mock: { calls: [string, RequestInit][] } }).mock
        .calls;
      const paths = calls.map((c) => c[0]);
      expect(paths).toContain('/api/kid-profiles');
    });

    const calls = (global.fetch as unknown as { mock: { calls: [string, RequestInit][] } }).mock
      .calls;
    const kidCall = calls.find((c) => c[0] === '/api/kid-profiles')!;
    const body = JSON.parse(kidCall[1].body as string);
    expect(body.profiles).toHaveLength(2);
    expect(body.profiles[0].school_id).toBe('00000000-0000-0000-0000-000000000001');
    expect(body.profiles[1].school_id).toBe('00000000-0000-0000-0000-000000000002');
  });
});
