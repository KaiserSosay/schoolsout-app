import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CampEditForm } from '@/components/admin/CampEditForm';

// Phase B prep: scaffold-form tests. The component itself is a flat
// list of placeholder inputs with NO working submit; these tests lock
// in the contract that:
//
//   1. Every editable column from migration 054's schema is rendered
//      somewhere in the form.
//   2. The submit button is disabled.
//   3. The form's onSubmit calls preventDefault even if the disabled
//      attribute is removed by a stray morning patch.
//   4. The slug field is read-only (R4 immutability invariant).

const baseCamp = {
  id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
  slug: 'the-growing-place-summer-camp',
  name: 'The Growing Place Summer Camp 2026',
  description: 'Stomp, chomp, and ROAR…',
  tagline: null,
  phone: '(305) 446-0846',
  email: 'mwilburn@firstcoralgables.org',
  website_url: 'https://www.thegrowingplace.school',
  registration_url: 'https://www.thegrowingplace.school/summer-camp',
  address: '536 Coral Way, Coral Gables, FL 33134',
  neighborhood: 'Coral Gables',
  city: 'Coral Gables',
  ages_min: 3,
  ages_max: 10,
  price_tier: '$$' as const,
  categories: ['arts', 'stem', 'general', 'religious', 'preschool'],
  verified: true,
  is_featured: true,
  is_launch_partner: true,
  featured_until: '2026-07-26T00:00:00Z',
  launch_partner_until: '2026-07-26T00:00:00Z',
  logo_url: null,
  hero_url: null,
  sessions: [],
  pricing_tiers: [],
  fees: [],
  enrollment_window: null,
  activities: [],
  what_to_bring: [],
  lunch_policy: null,
  extended_care_policy: null,
};

describe('CampEditForm scaffold', () => {
  it('renders the scaffold-mode banner', () => {
    render(<CampEditForm camp={baseCamp} />);
    expect(screen.getByTestId('scaffold-banner')).toHaveTextContent(
      /Scaffold mode — fields not yet wired/i,
    );
  });

  it('pre-fills the name field with the current camp name', () => {
    render(<CampEditForm camp={baseCamp} />);
    const input = screen.getByDisplayValue(
      'The Growing Place Summer Camp 2026',
    ) as HTMLInputElement;
    expect(input).toBeInTheDocument();
    expect(input.tagName).toBe('INPUT');
  });

  it('pre-fills phone, email, website_url, registration_url, address', () => {
    render(<CampEditForm camp={baseCamp} />);
    expect(screen.getByDisplayValue('(305) 446-0846')).toBeInTheDocument();
    expect(
      screen.getByDisplayValue('mwilburn@firstcoralgables.org'),
    ).toBeInTheDocument();
    expect(
      screen.getByDisplayValue('https://www.thegrowingplace.school'),
    ).toBeInTheDocument();
    expect(
      screen.getByDisplayValue(
        'https://www.thegrowingplace.school/summer-camp',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByDisplayValue('536 Coral Way, Coral Gables, FL 33134'),
    ).toBeInTheDocument();
  });

  it('pre-fills ages_min, ages_max, price_tier', () => {
    render(<CampEditForm camp={baseCamp} />);
    expect(screen.getByDisplayValue('3')).toBeInTheDocument();
    expect(screen.getByDisplayValue('10')).toBeInTheDocument();
    // price_tier is a select; assert its value.
    const selects = screen.getAllByRole('combobox') as HTMLSelectElement[];
    const priceSelect = selects.find((s) => s.value === '$$');
    expect(priceSelect).toBeDefined();
  });

  it('pre-fills categories as comma-separated text', () => {
    render(<CampEditForm camp={baseCamp} />);
    expect(
      screen.getByDisplayValue('arts, stem, general, religious, preschool'),
    ).toBeInTheDocument();
  });

  it('pre-fills the verified / featured / launch-partner checkboxes', () => {
    render(<CampEditForm camp={baseCamp} />);
    const verified = screen.getByLabelText('verified') as HTMLInputElement;
    const featured = screen.getByLabelText('is_featured') as HTMLInputElement;
    const lp = screen.getByLabelText('is_launch_partner') as HTMLInputElement;
    expect(verified.checked).toBe(true);
    expect(featured.checked).toBe(true);
    expect(lp.checked).toBe(true);
  });

  it('renders the slug field as read-only (R4 immutability)', () => {
    render(<CampEditForm camp={baseCamp} />);
    const slug = screen.getByDisplayValue(
      'the-growing-place-summer-camp',
    ) as HTMLInputElement;
    expect(slug.readOnly).toBe(true);
    expect(slug.disabled).toBe(true);
  });

  it('disables the submit button', () => {
    render(<CampEditForm camp={baseCamp} />);
    const submit = screen.getByTestId('camp-edit-submit') as HTMLButtonElement;
    expect(submit.disabled).toBe(true);
    expect(submit).toHaveAttribute('title', 'Form not yet wired');
  });

  it('preventDefaults submit even if the disabled attribute is bypassed', () => {
    render(<CampEditForm camp={baseCamp} />);
    const form = screen.getByTestId('camp-edit-form') as HTMLFormElement;
    // Fire a submit event directly; assert no navigation/default occurs by
    // checking the event was prevented.
    const evt = new Event('submit', { cancelable: true, bubbles: true });
    fireEvent(form, evt);
    expect(evt.defaultPrevented).toBe(true);
  });

  it('renders all 4 JSON-editor placeholders (sessions, pricing_tiers, fees, enrollment_window)', () => {
    render(<CampEditForm camp={baseCamp} />);
    const placeholders = screen.getAllByPlaceholderText(
      /JSON editor coming in morning/i,
    );
    expect(placeholders.length).toBe(4);
    for (const p of placeholders) {
      expect(p).toBeDisabled();
    }
  });

  it('renders array-field placeholders for activities + what_to_bring', () => {
    render(<CampEditForm camp={baseCamp} />);
    const placeholders = screen.getAllByPlaceholderText(
      /comma-separated for now/i,
    );
    expect(placeholders.length).toBe(2);
  });

  it('renders Phase B image-upload placeholders for logo + hero', () => {
    render(<CampEditForm camp={baseCamp} />);
    const uploadButtons = screen.getAllByText('Upload');
    expect(uploadButtons.length).toBe(2);
    for (const b of uploadButtons) {
      expect(b).toBeDisabled();
    }
  });

  it('renders lunch_policy + extended_care_policy as live (not placeholder) textareas', () => {
    // These are plain text — no JSON editor needed; the morning's wiring
    // can take them straight from the controlled state. Confirm both
    // labels exist + a textarea sits below each (live, not disabled).
    const { container } = render(<CampEditForm camp={baseCamp} />);
    expect(screen.getByText(/^Lunch policy$/i)).toBeInTheDocument();
    expect(screen.getByText(/^Extended care policy$/i)).toBeInTheDocument();
    // Textarea count: description (1) + 4 JSON placeholders + lunch + extended
    // care = 7. The 4 placeholders are disabled; the others are live.
    const textareas = container.querySelectorAll('textarea');
    expect(textareas.length).toBe(7);
    const live = Array.from(textareas).filter((t) => !t.disabled);
    expect(live.length).toBe(3); // description + lunch + extended-care
  });
});
