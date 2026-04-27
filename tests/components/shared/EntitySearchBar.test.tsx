import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { EntitySearchBar } from '@/components/shared/EntitySearchBar';

describe('EntitySearchBar', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders with the supplied placeholder + aria label', () => {
    render(
      <EntitySearchBar
        value=""
        onChange={() => {}}
        placeholder="Search by name"
        ariaLabel="Search items"
        clearLabel="Clear search"
      />,
    );
    const input = screen.getByPlaceholderText('Search by name');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('aria-label', 'Search items');
  });

  it('hydrates from the controlled value prop', () => {
    render(
      <EntitySearchBar
        value="frost"
        onChange={() => {}}
        placeholder="x"
        ariaLabel="x"
        clearLabel="x"
      />,
    );
    expect(screen.getByPlaceholderText('x')).toHaveValue('frost');
  });

  it('debounces onChange by ~300ms and only fires once for rapid typing', async () => {
    const onChange = vi.fn();
    render(
      <EntitySearchBar
        value=""
        onChange={onChange}
        placeholder="search"
        ariaLabel="search"
        clearLabel="clear"
      />,
    );
    const input = screen.getByPlaceholderText('search');
    fireEvent.change(input, { target: { value: 'f' } });
    fireEvent.change(input, { target: { value: 'fr' } });
    fireEvent.change(input, { target: { value: 'fro' } });
    expect(onChange).not.toHaveBeenCalled();
    await act(async () => {
      vi.advanceTimersByTime(350);
    });
    await waitFor(() => expect(onChange).toHaveBeenCalledTimes(1));
    expect(onChange).toHaveBeenCalledWith('fro');
  });

  it('clear button wipes the value and calls onChange immediately', async () => {
    const onChange = vi.fn();
    render(
      <EntitySearchBar
        value="frost"
        onChange={onChange}
        placeholder="search"
        ariaLabel="search"
        clearLabel="Clear search"
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /clear search/i }));
    await waitFor(() => expect(onChange).toHaveBeenCalledWith(''));
  });

  it('respects a custom debounceMs', async () => {
    const onChange = vi.fn();
    render(
      <EntitySearchBar
        value=""
        onChange={onChange}
        placeholder="x"
        ariaLabel="x"
        clearLabel="x"
        debounceMs={50}
      />,
    );
    fireEvent.change(screen.getByPlaceholderText('x'), { target: { value: 'a' } });
    await act(async () => {
      vi.advanceTimersByTime(80);
    });
    await waitFor(() => expect(onChange).toHaveBeenCalledWith('a'));
  });
});
