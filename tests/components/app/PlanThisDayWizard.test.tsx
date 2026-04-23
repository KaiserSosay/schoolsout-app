import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PlanThisDayWizard, type WizardKid } from '@/components/app/PlanThisDayWizard';
import messages from '@/i18n/messages/en.json';

// jsdom doesn't implement HTMLDialogElement show/close. Shim them.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const DialogProto: any = (globalThis as any).HTMLDialogElement?.prototype ?? null;
if (DialogProto) {
  if (typeof DialogProto.showModal !== 'function') {
    DialogProto.showModal = function showModal() { this.setAttribute('open', ''); };
  }
  if (typeof DialogProto.close !== 'function') {
    DialogProto.close = function close() { this.removeAttribute('open'); };
  }
}

function wrap(ui: React.ReactNode) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {ui}
    </NextIntlClientProvider>,
  );
}

const CLOSURE = {
  id: '00000000-0000-0000-0000-000000000001',
  name: 'Memorial Day',
  start_date: '2026-05-25',
  school_id: 'sch-1',
};

const KIDS: WizardKid[] = [
  { ordinal: 1, name: 'Noah', age_range: '7-9', school_id: 'sch-1' },
  { ordinal: 2, name: 'Mia', age_range: '4-6', school_id: 'sch-other' },
];

describe('PlanThisDayWizard', () => {
  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ camps: [], activities: [] }),
    }) as unknown as typeof fetch;
  });

  it('renders screen 1 with kid rows when opened', () => {
    wrap(
      <PlanThisDayWizard
        locale="en"
        open
        onClose={() => {}}
        closure={CLOSURE}
        kids={KIDS}
      />,
    );
    expect(screen.getByText('Noah')).toBeInTheDocument();
    expect(screen.getByText('Mia')).toBeInTheDocument();
  });

  it('auto-checks kids whose school matches the closure', () => {
    wrap(
      <PlanThisDayWizard
        locale="en"
        open
        onClose={() => {}}
        closure={CLOSURE}
        kids={KIDS}
      />,
    );
    // Noah matches sch-1 → checked; Mia does not → unchecked
    const noahCheckbox = screen.getByLabelText('Noah') as HTMLInputElement;
    const miaCheckbox = screen.getByLabelText('Mia') as HTMLInputElement;
    expect(noahCheckbox.checked).toBe(true);
    expect(miaCheckbox.checked).toBe(false);
  });

  it('disables Next until at least one kid is selected', () => {
    // Pass kids with NO school match so auto-check leaves 0 selected.
    wrap(
      <PlanThisDayWizard
        locale="en"
        open
        onClose={() => {}}
        closure={{ ...CLOSURE, school_id: 'nobody-matches' }}
        kids={[
          { ordinal: 1, name: 'A', age_range: '7-9', school_id: 'x' },
          { ordinal: 2, name: 'B', age_range: '7-9', school_id: 'y' },
        ]}
      />,
    );
    const next = screen.getByRole('button', { name: /Next/ }) as HTMLButtonElement;
    expect(next.disabled).toBe(true);

    fireEvent.click(screen.getByLabelText('A'));
    expect(next.disabled).toBe(false);
  });

  it('advances from screen 1 → 2 → 3 on Next clicks', async () => {
    wrap(
      <PlanThisDayWizard
        locale="en"
        open
        onClose={() => {}}
        closure={CLOSURE}
        kids={KIDS}
      />,
    );
    // Screen 1 → Screen 2
    fireEvent.click(screen.getByRole('button', { name: /Next/ }));
    expect(await screen.findByText('Full-day coverage')).toBeInTheDocument();

    // Pick a plan type
    fireEvent.click(screen.getByLabelText(/Full-day coverage/i).closest('label')!.querySelector('input')!);
    // Screen 2 → Screen 3
    fireEvent.click(screen.getByRole('button', { name: /Next/ }));
    await waitFor(() => {
      expect(screen.getByText('Camps')).toBeInTheDocument();
    });
  });

  it('updates planType state on screen 2 radio click', async () => {
    wrap(
      <PlanThisDayWizard
        locale="en"
        open
        onClose={() => {}}
        closure={CLOSURE}
        kids={KIDS}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /Next/ }));
    const radio = screen.getByLabelText(/Activities together/i).closest('label')!.querySelector('input')! as HTMLInputElement;
    fireEvent.click(radio);
    expect(radio.checked).toBe(true);
  });

  it('fetches camps + activities on screen 3 load', async () => {
    wrap(
      <PlanThisDayWizard
        locale="en"
        open
        onClose={() => {}}
        closure={CLOSURE}
        kids={KIDS}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /Next/ }));
    fireEvent.click(screen.getByLabelText(/A mix/i).closest('label')!.querySelector('input')!);
    fireEvent.click(screen.getByRole('button', { name: /Next/ }));

    await waitFor(() => {
      const mockFetch = global.fetch as unknown as { mock: { calls: [string, RequestInit?][] } };
      const urls = mockFetch.mock.calls.map((c) => c[0]);
      expect(urls.some((u) => u.includes('/api/camps?closure_id='))).toBe(true);
      expect(urls.some((u) => u.includes('/api/family-activities?closure_id='))).toBe(true);
    });
  });

  it('does nothing fancy when opened with an existing plan (jumps to screen 3)', async () => {
    wrap(
      <PlanThisDayWizard
        locale="en"
        open
        onClose={() => {}}
        closure={CLOSURE}
        kids={KIDS}
        initialPlan={{ id: 'p1', plan_type: 'coverage' }}
      />,
    );
    // Screen 3 heading visible, screen 1 kid rows not rendered.
    await act(async () => {});
    expect(screen.getByText('Camps')).toBeInTheDocument();
    expect(screen.queryByText('Noah')).not.toBeInTheDocument();
  });
});
