import { render, screen, fireEvent } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { describe, it, expect, vi } from 'vitest';
import {
  KidForm,
  GRADES,
  gradeToAge,
  blankKid,
  type KidState,
  type School,
} from '@/components/app/KidForm';
import messages from '@/i18n/messages/en.json';

const schools: School[] = [
  { id: '00000000-0000-0000-0000-000000000001', name: 'The Growing Place' },
  { id: '00000000-0000-0000-0000-000000000002', name: 'Coral Gables Preparatory Academy' },
  { id: '00000000-0000-0000-0000-000000000003', name: 'Miami-Dade County Public Schools' },
];
const suggestedIds = schools.map((s) => s.id);

function wrap(kid: KidState, onChange: (p: Partial<KidState>) => void) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <KidForm
        kid={kid}
        ordinal={1}
        schools={schools}
        suggestedIds={suggestedIds}
        onChange={onChange}
      />
    </NextIntlClientProvider>,
  );
}

describe('KidForm', () => {
  it('renders every grade option (PreK through 12)', () => {
    const onChange = vi.fn();
    wrap(blankKid(), onChange);
    const select = screen.getByTestId('kid-grade-1') as HTMLSelectElement;
    const optionLabels = Array.from(select.options)
      .map((o) => o.value)
      .filter((v) => v !== '');
    expect(optionLabels).toEqual([...GRADES]);
  });

  it('invokes onChange with the selected grade string when changed', () => {
    const onChange = vi.fn();
    wrap(blankKid(), onChange);
    const select = screen.getByTestId('kid-grade-1');
    fireEvent.change(select, { target: { value: '6' } });
    expect(onChange).toHaveBeenCalledWith({ grade: '6' });
  });

  it('maps grades to the correct age_range bucket', () => {
    expect(gradeToAge('PreK')).toBe('4-6');
    expect(gradeToAge('K')).toBe('4-6');
    expect(gradeToAge('1')).toBe('4-6');
    expect(gradeToAge('2')).toBe('4-6');
    expect(gradeToAge('3')).toBe('7-9');
    expect(gradeToAge('5')).toBe('7-9');
    expect(gradeToAge('6')).toBe('10-12');
    expect(gradeToAge('8')).toBe('10-12');
    expect(gradeToAge('9')).toBe('13+');
    expect(gradeToAge('12')).toBe('13+');
  });
});
