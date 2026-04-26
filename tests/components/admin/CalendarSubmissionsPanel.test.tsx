import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  CalendarSubmissionsPanel,
  type AdminCalendarSubmission,
} from '@/components/admin/CalendarSubmissionsPanel';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => '/en/admin',
}));

function makeRow(
  partial: Partial<AdminCalendarSubmission> & { id: string },
): AdminCalendarSubmission {
  return {
    school_id: 'sch-1',
    submitter_email: 'mom@example.com',
    submitter_name: null,
    submitter_role: 'parent',
    proposed_updates: 'Spring break is March 23-27, 2026.',
    notes: null,
    domain_verified: false,
    status: 'pending',
    reviewed_by: null,
    reviewed_at: null,
    review_notes: null,
    created_at: new Date().toISOString(),
    school: { slug: 'the-growing-place', name: 'The Growing Place' },
    ...partial,
  };
}

beforeEach(() => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      ok: true,
      submission: { id: 'sub-1', status: 'approved' },
    }),
  }) as unknown as typeof fetch;
});

describe('CalendarSubmissionsPanel', () => {
  it('renders the empty state when there are no submissions', () => {
    render(<CalendarSubmissionsPanel locale="en" initialSubmissions={[]} />);
    expect(
      screen.getByTestId('calendar-submissions-empty'),
    ).toBeInTheDocument();
  });

  it('renders rows in the order they were passed (server already sorted)', () => {
    const rows = [
      makeRow({ id: 'sub-A', domain_verified: true, submitter_email: 'a@s.org' }),
      makeRow({ id: 'sub-B', submitter_email: 'b@s.org' }),
    ];
    render(
      <CalendarSubmissionsPanel locale="en" initialSubmissions={rows} />,
    );
    const list = screen.getByTestId('calendar-submissions-panel');
    const items = list.querySelectorAll('li');
    expect(items[0].getAttribute('data-testid')).toBe('submission-row-sub-A');
    expect(items[1].getAttribute('data-testid')).toBe('submission-row-sub-B');
  });

  it('shows the domain-verified pill when the row is verified', () => {
    const rows = [makeRow({ id: 'sub-1', domain_verified: true })];
    render(
      <CalendarSubmissionsPanel locale="en" initialSubmissions={rows} />,
    );
    expect(screen.getByTestId('domain-verified-pill')).toBeInTheDocument();
  });

  it('hides the domain-verified pill when the row is not verified', () => {
    const rows = [makeRow({ id: 'sub-1', domain_verified: false })];
    render(
      <CalendarSubmissionsPanel locale="en" initialSubmissions={rows} />,
    );
    expect(screen.queryByTestId('domain-verified-pill')).toBeNull();
  });

  it('expands proposed_updates on toggle click', () => {
    const rows = [
      makeRow({
        id: 'sub-1',
        proposed_updates: 'No school March 23-27.',
      }),
    ];
    render(
      <CalendarSubmissionsPanel locale="en" initialSubmissions={rows} />,
    );
    expect(screen.queryByTestId('proposed-updates-sub-1')).toBeNull();
    fireEvent.click(screen.getByTestId('toggle-updates-sub-1'));
    expect(screen.getByTestId('proposed-updates-sub-1')).toHaveTextContent(
      'No school March 23-27.',
    );
  });

  it('PATCHes the API and updates row state on Mark approved', async () => {
    const rows = [makeRow({ id: 'sub-1', status: 'pending' })];
    render(
      <CalendarSubmissionsPanel locale="en" initialSubmissions={rows} />,
    );
    fireEvent.click(screen.getByRole('button', { name: /mark approved/i }));
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/admin/calendar-submissions/sub-1',
        expect.objectContaining({ method: 'PATCH' }),
      );
    });
    const call = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const body = JSON.parse((call[1] as RequestInit).body as string);
    expect(body.status).toBe('approved');
  });

  it('renders a "View school" link when school slug is set', () => {
    const rows = [makeRow({ id: 'sub-1' })];
    render(
      <CalendarSubmissionsPanel locale="en" initialSubmissions={rows} />,
    );
    const link = screen.getByRole('link', { name: /view school/i });
    expect(link.getAttribute('href')).toBe('/en/schools/the-growing-place');
  });
});
