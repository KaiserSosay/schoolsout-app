import { render, screen, fireEvent } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { describe, it, expect, vi } from 'vitest';
import { ModeToggle } from '@/components/home/ModeToggle';
import messages from '@/i18n/messages/en.json';

function wrap(mode: 'kids' | 'parents' = 'kids', onChange = vi.fn()) {
  const utils = render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <ModeToggle mode={mode} onChange={onChange} />
    </NextIntlClientProvider>,
  );
  return { ...utils, onChange };
}

describe('ModeToggle', () => {
  it('renders both mode buttons', () => {
    wrap();
    expect(screen.getByRole('tab', { name: 'Kids' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Parents' })).toBeInTheDocument();
  });

  it('marks the active mode with aria-selected', () => {
    wrap('parents');
    expect(screen.getByRole('tab', { name: 'Parents' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByRole('tab', { name: 'Kids' })).toHaveAttribute(
      'aria-selected',
      'false',
    );
  });

  it('calls onChange with the new mode when clicked', () => {
    const { onChange } = wrap('kids');
    fireEvent.click(screen.getByRole('tab', { name: 'Parents' }));
    expect(onChange).toHaveBeenCalledWith('parents');
  });
});
