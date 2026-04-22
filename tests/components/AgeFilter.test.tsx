import { render, screen, fireEvent } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { describe, it, expect, vi } from 'vitest';
import { AgeFilter, type AgeRange } from '@/components/home/AgeFilter';
import messages from '@/i18n/messages/en.json';

function wrap(value: AgeRange = 'all', onChange = vi.fn()) {
  const utils = render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <AgeFilter value={value} onChange={onChange} mode="kids" />
    </NextIntlClientProvider>,
  );
  return { ...utils, onChange };
}

describe('AgeFilter', () => {
  it('shows both age bubbles', () => {
    wrap();
    expect(screen.getByRole('button', { name: /Ages 4–6/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Ages 7–9/ })).toBeInTheDocument();
  });

  it('marks neither bubble pressed when value is "all"', () => {
    wrap('all');
    expect(screen.getByRole('button', { name: /Ages 4–6/ })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    expect(screen.getByRole('button', { name: /Ages 7–9/ })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('calls onChange with the selected range when an age bubble is tapped', () => {
    const { onChange } = wrap('all');
    fireEvent.click(screen.getByRole('button', { name: /Ages 4–6/ }));
    expect(onChange).toHaveBeenCalledWith('4-6');
  });

  it('tapping an already-active bubble resets to "all"', () => {
    const { onChange } = wrap('4-6');
    fireEvent.click(screen.getByRole('button', { name: /Ages 4–6/ }));
    expect(onChange).toHaveBeenCalledWith('all');
  });
});
