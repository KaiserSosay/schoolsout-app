import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { LanguageToggleMobile } from '@/components/LanguageToggleMobile';

describe('LanguageToggleMobile', () => {
  it('opens the menu when the globe button is clicked', () => {
    render(<LanguageToggleMobile currentLocale="en" />);
    // Menu hidden initially.
    expect(screen.queryByRole('menu')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /Change language/i }));
    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(screen.getByText('English')).toBeInTheDocument();
    expect(screen.getByText('Español')).toBeInTheDocument();
  });

  it('closes the menu when clicking outside', () => {
    render(
      <div>
        <LanguageToggleMobile currentLocale="en" />
        <div data-testid="outside">outside</div>
      </div>,
    );
    fireEvent.click(screen.getByRole('button', { name: /Change language/i }));
    expect(screen.getByRole('menu')).toBeInTheDocument();

    // Simulate a document-level click outside the component.
    fireEvent.click(screen.getByTestId('outside'));
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('marks the active locale with aria-current=page', () => {
    render(<LanguageToggleMobile currentLocale="es" />);
    fireEvent.click(screen.getByRole('button', { name: /Change language/i }));
    const es = screen.getByRole('menuitem', { name: /Español/i });
    expect(es.getAttribute('aria-current')).toBe('page');
    const en = screen.getByRole('menuitem', { name: /English/i });
    expect(en.getAttribute('aria-current')).toBeNull();
  });
});
