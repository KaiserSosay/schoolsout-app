import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import messages from '@/i18n/messages/en.json';
import { CampEditForm } from '@/components/admin/CampEditForm';

// Mock the server action — vi.mock is hoisted so the import in
// CampEditForm picks up the mock before the component renders.
vi.mock(
  '@/app/[locale]/admin/camps/[slug]/edit/actions',
  () => ({
    updateCampSimpleFields: vi.fn(),
  }),
);

import { updateCampSimpleFields } from '@/app/[locale]/admin/camps/[slug]/edit/actions';

const updateMock = vi.mocked(updateCampSimpleFields);

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

function wrap(camp = baseCamp) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <CampEditForm camp={camp} />
    </NextIntlClientProvider>,
  );
}

beforeEach(() => {
  updateMock.mockReset();
});

describe('CampEditForm — wired Quick edit form', () => {
  it('renders the mixed-mode banner above the wired form', () => {
    wrap();
    expect(screen.getByTestId('mixed-mode-banner')).toHaveTextContent(
      /Mixed-mode form/i,
    );
  });

  it('renders the Quick edit title and body', () => {
    wrap();
    expect(screen.getByText('Quick edit')).toBeInTheDocument();
    expect(
      screen.getByText(
        /Tagline, contact, registration link, and featured toggle\./i,
      ),
    ).toBeInTheDocument();
  });

  it('pre-fills the 5 wired fields with current camp values', () => {
    wrap();
    expect(
      (screen.getByTestId('quick-edit-tagline') as HTMLInputElement).value,
    ).toBe('');
    expect((screen.getByTestId('quick-edit-phone') as HTMLInputElement).value).toBe(
      '(305) 446-0846',
    );
    expect((screen.getByTestId('quick-edit-email') as HTMLInputElement).value).toBe(
      'mwilburn@firstcoralgables.org',
    );
    expect(
      (screen.getByTestId('quick-edit-registration-url') as HTMLInputElement)
        .value,
    ).toBe('https://www.thegrowingplace.school/summer-camp');
    expect(
      (screen.getByTestId('quick-edit-is-featured') as HTMLInputElement).checked,
    ).toBe(true);
  });

  it('respects the 200-char tagline maxLength', () => {
    wrap();
    const tagline = screen.getByTestId('quick-edit-tagline') as HTMLInputElement;
    expect(tagline.maxLength).toBe(200);
  });

  it('calls updateCampSimpleFields on submit with trimmed values', async () => {
    updateMock.mockResolvedValue({ ok: true });
    wrap();

    fireEvent.change(screen.getByTestId('quick-edit-tagline'), {
      target: { value: '  Stomp, chomp, and ROAR!  ' },
    });
    fireEvent.click(screen.getByTestId('quick-edit-submit'));

    await waitFor(() => expect(updateMock).toHaveBeenCalledTimes(1));
    expect(updateMock).toHaveBeenCalledWith({
      slug: 'the-growing-place-summer-camp',
      tagline: 'Stomp, chomp, and ROAR!',
      phone: '(305) 446-0846',
      email: 'mwilburn@firstcoralgables.org',
      registration_url: 'https://www.thegrowingplace.school/summer-camp',
      is_featured: true,
      logo_url: null,
      hero_url: null,
    });
  });

  it('shows the success indicator after a successful save', async () => {
    updateMock.mockResolvedValue({ ok: true });
    wrap();
    fireEvent.click(screen.getByTestId('quick-edit-submit'));
    await waitFor(() =>
      expect(screen.getByTestId('quick-edit-saved')).toBeInTheDocument(),
    );
  });

  it('renders inline error returned from the server action', async () => {
    updateMock.mockResolvedValue({
      ok: false,
      errors: { email: 'Invalid email format' },
    });
    wrap();
    fireEvent.click(screen.getByTestId('quick-edit-submit'));
    await waitFor(() =>
      expect(screen.getByText('Invalid email format')).toBeInTheDocument(),
    );
    expect(screen.queryByTestId('quick-edit-saved')).not.toBeInTheDocument();
  });

  it('renders form-level _form error from the server action', async () => {
    updateMock.mockResolvedValue({
      ok: false,
      errors: { _form: 'Camp not found' },
    });
    wrap();
    fireEvent.click(screen.getByTestId('quick-edit-submit'));
    await waitFor(() =>
      expect(screen.getByText('Camp not found')).toBeInTheDocument(),
    );
  });

  it('passes is_featured=false when the toggle is unchecked before submit', async () => {
    updateMock.mockResolvedValue({ ok: true });
    wrap();
    fireEvent.click(screen.getByTestId('quick-edit-is-featured'));
    fireEvent.click(screen.getByTestId('quick-edit-submit'));
    await waitFor(() => expect(updateMock).toHaveBeenCalledTimes(1));
    expect(updateMock.mock.calls[0][0].is_featured).toBe(false);
  });
});

describe('CampEditForm — image upload fields (logo + hero)', () => {
  it('renders both logo and hero sections', () => {
    wrap();
    expect(screen.getByTestId('quick-edit-logo-section')).toBeInTheDocument();
    expect(screen.getByTestId('quick-edit-hero-section')).toBeInTheDocument();
  });

  it('logo URL input updates state and shows preview', () => {
    wrap();
    const url = 'https://example.com/logo.png';
    fireEvent.change(screen.getByTestId('quick-edit-logo-url'), {
      target: { value: url },
    });
    const preview = screen.getByTestId(
      'quick-edit-logo-preview',
    ) as HTMLImageElement;
    expect(preview.src).toBe(url);
  });

  it('hero URL input updates state and shows preview', () => {
    wrap();
    const url = 'https://example.com/hero.jpg';
    fireEvent.change(screen.getByTestId('quick-edit-hero-url'), {
      target: { value: url },
    });
    const preview = screen.getByTestId(
      'quick-edit-hero-preview',
    ) as HTMLImageElement;
    expect(preview.src).toBe(url);
  });

  it('Remove button clears the URL without triggering save', () => {
    wrap();
    fireEvent.change(screen.getByTestId('quick-edit-logo-url'), {
      target: { value: 'https://example.com/logo.png' },
    });
    fireEvent.click(screen.getByTestId('quick-edit-logo-remove'));
    expect(
      (screen.getByTestId('quick-edit-logo-url') as HTMLInputElement).value,
    ).toBe('');
    expect(screen.queryByTestId('quick-edit-logo-preview')).toBeNull();
    expect(updateMock).not.toHaveBeenCalled();
  });

  it('submits the typed-in logo + hero URLs to the action', async () => {
    updateMock.mockResolvedValue({ ok: true });
    wrap();
    fireEvent.change(screen.getByTestId('quick-edit-logo-url'), {
      target: { value: 'https://example.com/logo.png' },
    });
    fireEvent.change(screen.getByTestId('quick-edit-hero-url'), {
      target: { value: 'https://example.com/hero.jpg' },
    });
    fireEvent.click(screen.getByTestId('quick-edit-submit'));
    await waitFor(() => expect(updateMock).toHaveBeenCalledTimes(1));
    const call = updateMock.mock.calls[0][0];
    expect(call.logo_url).toBe('https://example.com/logo.png');
    expect(call.hero_url).toBe('https://example.com/hero.jpg');
  });

  it('renders the server-side logo_url validation error when returned', async () => {
    updateMock.mockResolvedValue({
      ok: false,
      errors: { logo_url: 'Logo URL must start with http:// or https://' },
    });
    wrap();
    fireEvent.click(screen.getByTestId('quick-edit-submit'));
    await waitFor(() =>
      expect(
        screen.getByText('Logo URL must start with http:// or https://'),
      ).toBeInTheDocument(),
    );
  });

  it('blocks oversized logo uploads client-side before fetch', async () => {
    const fetchSpy = vi
      .spyOn(global, 'fetch')
      .mockResolvedValue(new Response(null, { status: 200 }));
    wrap();
    const big = new File([new Uint8Array(700 * 1024)], 'big.png', {
      type: 'image/png',
    });
    const input = screen.getByTestId(
      'quick-edit-logo-file-input',
    ) as HTMLInputElement;
    Object.defineProperty(input, 'files', { value: [big], configurable: true });
    fireEvent.change(input);
    await waitFor(() =>
      expect(screen.getByTestId('quick-edit-logo-upload-error')).toHaveTextContent(
        /512 KB or smaller/i,
      ),
    );
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it('writes the returned URL into state after a successful upload', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          ok: true,
          url: 'https://supabase.example/storage/v1/object/public/camp-logos/the-growing-place-summer-camp/123.png',
        }),
        { status: 200 },
      ),
    );
    wrap();
    const tinyPng = new File([new Uint8Array(100)], 'logo.png', {
      type: 'image/png',
    });
    const input = screen.getByTestId(
      'quick-edit-logo-file-input',
    ) as HTMLInputElement;
    Object.defineProperty(input, 'files', {
      value: [tinyPng],
      configurable: true,
    });
    fireEvent.change(input);
    await waitFor(() =>
      expect(
        (screen.getByTestId('quick-edit-logo-url') as HTMLInputElement).value,
      ).toContain('camp-logos/the-growing-place-summer-camp/'),
    );
    fetchSpy.mockRestore();
  });

  it('renders a localized error when the upload route returns a known error code', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ error: 'too_large' }), { status: 400 }),
    );
    wrap();
    const tinyPng = new File([new Uint8Array(100)], 'logo.png', {
      type: 'image/png',
    });
    const input = screen.getByTestId(
      'quick-edit-logo-file-input',
    ) as HTMLInputElement;
    Object.defineProperty(input, 'files', {
      value: [tinyPng],
      configurable: true,
    });
    fireEvent.change(input);
    await waitFor(() =>
      expect(screen.getByTestId('quick-edit-logo-upload-error')).toHaveTextContent(
        /too large/i,
      ),
    );
    fetchSpy.mockRestore();
  });
});

describe('CampEditForm — scaffold form (still placeholder)', () => {
  it('renders the scaffold-mode banner', () => {
    wrap();
    expect(screen.getByTestId('scaffold-banner')).toHaveTextContent(
      /Scaffold mode/i,
    );
  });

  it('pre-fills the name field with the current camp name', () => {
    wrap();
    const input = screen.getByDisplayValue(
      'The Growing Place Summer Camp 2026',
    ) as HTMLInputElement;
    expect(input).toBeInTheDocument();
    expect(input.tagName).toBe('INPUT');
  });

  it('pre-fills website_url + address (still scaffold)', () => {
    wrap();
    expect(
      screen.getByDisplayValue('https://www.thegrowingplace.school'),
    ).toBeInTheDocument();
    expect(
      screen.getByDisplayValue('536 Coral Way, Coral Gables, FL 33134'),
    ).toBeInTheDocument();
  });

  it('pre-fills ages_min, ages_max, price_tier', () => {
    wrap();
    expect(screen.getByDisplayValue('3')).toBeInTheDocument();
    expect(screen.getByDisplayValue('10')).toBeInTheDocument();
    const selects = screen.getAllByRole('combobox') as HTMLSelectElement[];
    const priceSelect = selects.find((s) => s.value === '$$');
    expect(priceSelect).toBeDefined();
  });

  it('pre-fills categories as comma-separated text', () => {
    wrap();
    expect(
      screen.getByDisplayValue('arts, stem, general, religious, preschool'),
    ).toBeInTheDocument();
  });

  it('pre-fills the verified + launch-partner checkboxes (is_featured moved to wired form)', () => {
    wrap();
    const verified = screen.getByLabelText('verified') as HTMLInputElement;
    const lp = screen.getByLabelText('is_launch_partner') as HTMLInputElement;
    expect(verified.checked).toBe(true);
    expect(lp.checked).toBe(true);
  });

  it('renders the slug field as read-only (R4 immutability)', () => {
    wrap();
    const slug = screen.getByDisplayValue(
      'the-growing-place-summer-camp',
    ) as HTMLInputElement;
    expect(slug.readOnly).toBe(true);
    expect(slug.disabled).toBe(true);
  });

  it('disables the scaffold submit button', () => {
    wrap();
    const submit = screen.getByTestId('camp-edit-submit') as HTMLButtonElement;
    expect(submit.disabled).toBe(true);
    expect(submit).toHaveAttribute('title', 'Form not yet wired');
  });

  it('preventDefaults scaffold submit even if the disabled attribute is bypassed', () => {
    wrap();
    const form = screen.getByTestId('camp-edit-form') as HTMLFormElement;
    const evt = new Event('submit', { cancelable: true, bubbles: true });
    fireEvent(form, evt);
    expect(evt.defaultPrevented).toBe(true);
  });

  it('renders all 4 JSON-editor placeholders (sessions, pricing_tiers, fees, enrollment_window)', () => {
    wrap();
    const placeholders = screen.getAllByPlaceholderText(
      /JSON editor coming in morning/i,
    );
    expect(placeholders.length).toBe(4);
    for (const p of placeholders) {
      expect(p).toBeDisabled();
    }
  });

  it('renders array-field placeholders for activities + what_to_bring', () => {
    wrap();
    const placeholders = screen.getAllByPlaceholderText(
      /comma-separated for now/i,
    );
    expect(placeholders.length).toBe(2);
  });

  it('no longer renders the disabled "Upload" scaffold buttons (image fields are now wired in Quick Edit)', () => {
    wrap();
    expect(screen.queryByText('Upload')).toBeNull();
  });

  it('renders lunch_policy + extended_care_policy as live (not placeholder) textareas', () => {
    const { container } = wrap();
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
