import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  SchoolAutocomplete,
  SCHOOL_PENDING_PREFIX,
} from '@/components/app/SchoolAutocomplete';
import type { School } from '@/components/app/KidForm';
import messages from '@/i18n/messages/en.json';

const schools: School[] = [
  { id: 's-tgp', name: 'The Growing Place' },
  { id: 's-cgpa', name: 'Coral Gables Preparatory Academy' },
  { id: 's-mdcps', name: 'Miami-Dade County Public Schools' },
  { id: 's-key', name: 'Key Biscayne K-8 Center' },
];

function wrap(props: Partial<Parameters<typeof SchoolAutocomplete>[0]> = {}) {
  const onSelect = props.onSelect ?? vi.fn();
  const utils = render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <SchoolAutocomplete
        schools={schools}
        value={props.value ?? null}
        onSelect={onSelect}
        onRequestSubmitted={props.onRequestSubmitted}
      />
    </NextIntlClientProvider>,
  );
  return { ...utils, onSelect };
}

describe('SchoolAutocomplete', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('filters schools after the debounce window and selects on click', async () => {
    const { onSelect } = wrap();
    const input = screen.getByTestId('school-autocomplete-input');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'cor' } });
    const option = await screen.findByText(
      'Coral Gables Preparatory Academy',
      {},
      { timeout: 1000 },
    );
    fireEvent.mouseDown(option);
    expect(onSelect).toHaveBeenLastCalledWith('s-cgpa');
  });

  it('shows the "+ Add" row when query has no school match and submits a request', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, id: 'req-123' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const { onSelect } = wrap();
    const input = screen.getByTestId('school-autocomplete-input');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'Davis Academy' } });
    const addRow = await screen.findByTestId(
      'school-autocomplete-add',
      {},
      { timeout: 1000 },
    );
    expect(addRow.textContent).toContain('Davis Academy');
    fireEvent.mouseDown(addRow);
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe('/api/school-requests');
    expect(JSON.parse(init.body)).toEqual({ requested_name: 'Davis Academy' });
    await waitFor(() => {
      const calls = onSelect.mock.calls;
      const last = calls[calls.length - 1]?.[0];
      expect(typeof last).toBe('string');
      expect((last as string).startsWith(SCHOOL_PENDING_PREFIX)).toBe(true);
    });
  });

  it('arrow-down + enter selects the first suggestion', async () => {
    const { onSelect } = wrap();
    const input = screen.getByTestId('school-autocomplete-input');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'mia' } });
    // Wait for debounced match list to render at least once.
    await screen.findByText(
      'Miami-Dade County Public Schools',
      {},
      { timeout: 1000 },
    );
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onSelect).toHaveBeenLastCalledWith('s-mdcps');
  });

  it('does not show the "+ Add" row when query matches an existing school exactly', async () => {
    wrap();
    const input = screen.getByTestId('school-autocomplete-input');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'The Growing Place' } });
    await screen.findByText('The Growing Place', {}, { timeout: 1000 });
    expect(screen.queryByTestId('school-autocomplete-add')).toBeNull();
  });
});
