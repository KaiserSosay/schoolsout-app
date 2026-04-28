import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/confetti', () => ({ celebrate: vi.fn() }));
import { celebrate } from '@/lib/confetti';

import { ListYourCampForm } from '@/components/ListYourCampForm';
import messages from '@/i18n/messages/en.json';
import esMessages from '@/i18n/messages/es.json';

beforeEach(() => {
  global.fetch = vi
    .fn()
    .mockResolvedValue({ ok: true, json: async () => ({ ok: true }) }) as typeof fetch;
});

function wrap() {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <ListYourCampForm />
    </NextIntlClientProvider>,
  );
}

function wrapEs() {
  return render(
    <NextIntlClientProvider locale="es" messages={esMessages}>
      <ListYourCampForm />
    </NextIntlClientProvider>,
  );
}

describe('ListYourCampForm — quality accordion', () => {
  it('renders the accordion in collapsed state by default', () => {
    wrap();
    const acc = screen.getByTestId('quality-accordion') as HTMLDetailsElement;
    expect(acc).toBeInTheDocument();
    expect(acc.open).toBe(false);
  });

  it('reveals sessions, social, scholarships, accommodations, testimonials on expand', () => {
    wrap();
    const acc = screen.getByTestId('quality-accordion') as HTMLDetailsElement;
    acc.open = true;
    expect(screen.getByTestId('session-row-0')).toBeInTheDocument();
    expect(screen.getByLabelText('Instagram')).toBeInTheDocument();
    expect(screen.getByLabelText('Facebook URL')).toBeInTheDocument();
    expect(screen.getByLabelText('TikTok')).toBeInTheDocument();
    expect(
      screen.getByLabelText('Need-based scholarships available'),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText(/Special accommodations/),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText('Reviews or testimonials'),
    ).toBeInTheDocument();
    expect(screen.getByTestId('photos-deferred')).toBeInTheDocument();
  });

  it('adds and removes session rows up to MAX_SESSIONS', () => {
    wrap();
    const acc = screen.getByTestId('quality-accordion') as HTMLDetailsElement;
    acc.open = true;
    const addBtn = screen.getByTestId('add-session');
    fireEvent.click(addBtn);
    fireEvent.click(addBtn);
    expect(screen.getByTestId('session-row-0')).toBeInTheDocument();
    expect(screen.getByTestId('session-row-1')).toBeInTheDocument();
    expect(screen.getByTestId('session-row-2')).toBeInTheDocument();
    // remove the second row
    const removeBtn = screen.getByLabelText('Remove session 2');
    fireEvent.click(removeBtn);
    expect(screen.queryByTestId('session-row-2')).toBeNull();
  });

  it('submits a payload that includes social handles, testimonials, and a populated session', async () => {
    wrap();
    fireEvent.change(screen.getByLabelText('Your email'), {
      target: { value: 'op@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/Business name/), {
      target: { value: 'Sunshine Camp Co.' },
    });
    fireEvent.change(screen.getByLabelText(/Camp \/ program name/), {
      target: { value: 'Summer Adventure' },
    });

    const acc = screen.getByTestId('quality-accordion') as HTMLDetailsElement;
    acc.open = true;

    fireEvent.change(screen.getByLabelText('Instagram'), {
      target: { value: '@sunshinecamp' },
    });
    fireEvent.change(screen.getByLabelText('Reviews or testimonials'), {
      target: { value: 'Best summer ever — Parent of camper' },
    });
    fireEvent.change(screen.getByLabelText('Session name'), {
      target: { value: 'Summer Week 1' },
    });
    fireEvent.change(screen.getByLabelText('Start date'), {
      target: { value: '2026-06-08' },
    });
    fireEvent.change(screen.getByLabelText('End date'), {
      target: { value: '2026-06-12' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Send application/ }));

    await waitFor(() => {
      const fn = global.fetch as unknown as { mock: { calls: unknown[][] } };
      expect(fn.mock.calls.length).toBe(1);
    });
    const fetchMock = global.fetch as unknown as {
      mock: { calls: [string, { body: string }][] };
    };
    const [, init] = fetchMock.mock.calls[0];
    const payload = JSON.parse(init.body);
    expect(payload.instagram_handle).toBe('@sunshinecamp');
    expect(payload.testimonials).toBe('Best summer ever — Parent of camper');
    expect(payload.sessions).toEqual([
      {
        name: 'Summer Week 1',
        start_date: '2026-06-08',
        end_date: '2026-06-12',
        age_min: null,
        age_max: null,
        capacity: null,
      },
    ]);
  });

  it('does not block submit when URL inputs hold a bare-domain value (HTML5 validation regression)', async () => {
    wrap();
    fireEvent.change(screen.getByLabelText('Your email'), {
      target: { value: 'op@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/Business name/), {
      target: { value: 'Sunshine Camp Co.' },
    });
    fireEvent.change(screen.getByLabelText(/Camp \/ program name/), {
      target: { value: 'Summer Adventure' },
    });
    // Operator types domain without a protocol — the bug was that the
    // browser blocked submit here, so the fetch never fired.
    fireEvent.change(screen.getByLabelText(/^Website$/), {
      target: { value: 'mycamp.com' },
    });
    fireEvent.change(screen.getByLabelText(/Direct registration URL/), {
      target: { value: 'mycamp.com/signup' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Send application/ }));

    await waitFor(() => {
      const fn = global.fetch as unknown as { mock: { calls: unknown[][] } };
      expect(fn.mock.calls.length).toBe(1);
    });
    const fetchMock = global.fetch as unknown as {
      mock: { calls: [string, { body: string }][] };
    };
    const payload = JSON.parse(fetchMock.mock.calls[0][1].body);
    // normalizeUrl prepends https:// so the server's strict zod .url()
    // accepts the value.
    expect(payload.website).toBe('https://mycamp.com');
    expect(payload.registration_url).toBe('https://mycamp.com/signup');
  });

  it('preserves http:// and https:// URLs without double-prefixing', async () => {
    wrap();
    fireEvent.change(screen.getByLabelText('Your email'), {
      target: { value: 'op@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/Business name/), {
      target: { value: 'X' },
    });
    fireEvent.change(screen.getByLabelText(/Camp \/ program name/), {
      target: { value: 'Y' },
    });
    fireEvent.change(screen.getByLabelText(/^Website$/), {
      target: { value: 'https://example.com' },
    });
    fireEvent.change(screen.getByLabelText(/Direct registration URL/), {
      target: { value: 'http://example.com/r' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Send application/ }));

    await waitFor(() => {
      const fn = global.fetch as unknown as { mock: { calls: unknown[][] } };
      expect(fn.mock.calls.length).toBe(1);
    });
    const fetchMock = global.fetch as unknown as {
      mock: { calls: [string, { body: string }][] };
    };
    const payload = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(payload.website).toBe('https://example.com');
    expect(payload.registration_url).toBe('http://example.com/r');
  });

  it('fires celebrate() when the submission succeeds', async () => {
    vi.mocked(celebrate).mockClear();
    wrap();
    fireEvent.change(screen.getByLabelText('Your email'), {
      target: { value: 'op@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/Business name/), {
      target: { value: 'Sunshine Camp Co.' },
    });
    fireEvent.change(screen.getByLabelText(/Camp \/ program name/), {
      target: { value: 'Summer Adventure' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Send application/ }));
    await waitFor(() => expect(celebrate).toHaveBeenCalled());
  });

  // ES locale coverage — Mom's wife is sending the link to a Spanish-
  // speaking taekwondo instructor, so /es/list-your-camp must be a
  // first-class native form (Spanish labels, Spanish success / error,
  // and Spanish operator content saved character-for-character).
  describe('ES locale', () => {
    it('renders core field labels and section headings in Spanish', () => {
      wrapEs();
      expect(screen.getByLabelText(/Cuéntanos sobre tu programa/)).toBeInTheDocument();
      expect(screen.getByLabelText('Nombre del negocio')).toBeInTheDocument();
      expect(screen.getByLabelText('Campamento / programa')).toBeInTheDocument();
      expect(screen.getByText('Sobre el campamento')).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /Enviar solicitud/ }),
      ).toBeInTheDocument();
    });

    it('shows the Spanish success card after a 201 submission', async () => {
      wrapEs();
      fireEvent.change(screen.getByLabelText('Tu correo'), {
        target: { value: 'op@example.com' },
      });
      fireEvent.change(screen.getByLabelText('Nombre del negocio'), {
        target: { value: 'Taekwondo Miami' },
      });
      fireEvent.change(screen.getByLabelText('Campamento / programa'), {
        target: { value: 'Campamento de verano' },
      });
      fireEvent.click(screen.getByRole('button', { name: /Enviar solicitud/ }));
      await waitFor(() =>
        expect(screen.getByText('¡Lo recibimos!')).toBeInTheDocument(),
      );
    });

    it('shows the Spanish error message when the server returns 500', async () => {
      global.fetch = vi
        .fn()
        .mockResolvedValue({ ok: false, json: async () => ({ ok: false }) }) as typeof fetch;
      wrapEs();
      fireEvent.change(screen.getByLabelText('Tu correo'), {
        target: { value: 'op@example.com' },
      });
      fireEvent.change(screen.getByLabelText('Nombre del negocio'), {
        target: { value: 'X' },
      });
      fireEvent.change(screen.getByLabelText('Campamento / programa'), {
        target: { value: 'Y' },
      });
      fireEvent.click(screen.getByRole('button', { name: /Enviar solicitud/ }));
      await waitFor(() =>
        expect(
          screen.getByText('Algo salió mal. ¿Intentar de nuevo?'),
        ).toBeInTheDocument(),
      );
    });

    it('preserves Spanish content character-for-character in the submitted payload', async () => {
      wrapEs();
      const description =
        'Programa bilingüe de taekwondo para niños de 5 a 12 años. ¡Disciplina, respeto y diversión!';
      const tagline = 'Taekwondo para niños — disciplina y diversión';
      fireEvent.change(screen.getByLabelText('Tu correo'), {
        target: { value: 'sensei@example.com' },
      });
      fireEvent.change(screen.getByLabelText('Nombre del negocio'), {
        target: { value: 'Academia Taekwondo Miami' },
      });
      fireEvent.change(screen.getByLabelText('Campamento / programa'), {
        target: { value: 'Campamento de verano bilingüe' },
      });
      fireEvent.change(screen.getByLabelText('Lema de una línea (opcional)'), {
        target: { value: tagline },
      });
      fireEvent.change(screen.getByLabelText('Cuéntanos sobre tu programa'), {
        target: { value: description },
      });
      fireEvent.click(screen.getByRole('button', { name: /Enviar solicitud/ }));

      await waitFor(() => {
        const fn = global.fetch as unknown as { mock: { calls: unknown[][] } };
        expect(fn.mock.calls.length).toBe(1);
      });
      const fetchMock = global.fetch as unknown as {
        mock: { calls: [string, { body: string }][] };
      };
      const payload = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(payload.description).toBe(description);
      expect(payload.tagline).toBe(tagline);
      expect(payload.business_name).toBe('Academia Taekwondo Miami');
      expect(payload.camp_name).toBe('Campamento de verano bilingüe');
      // Locale flag rides the payload so the API can flag admin email [ES].
      expect(payload.locale).toBe('es');
    });
  });

  it('renders all 18 canonical category chips', () => {
    wrap();
    const chips = screen
      .getByTestId('categories-chips')
      .querySelectorAll('[data-category]');
    expect(chips.length).toBe(18);
    // Spot-check core breadth + sub-genres are all present.
    expect(screen.getByRole('button', { name: 'Sports' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'STEM' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'All-around' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sailing' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Religious' })).toBeInTheDocument();
  });

  it('submits selected categories as an array (chip multi-select)', async () => {
    wrap();
    fireEvent.change(screen.getByLabelText('Your email'), {
      target: { value: 'op@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/Business name/), {
      target: { value: 'Sunshine Camp Co.' },
    });
    fireEvent.change(screen.getByLabelText(/Camp \/ program name/), {
      target: { value: 'Summer Adventure' },
    });
    // Toggle three chips: Sports, Arts, STEM
    fireEvent.click(screen.getByRole('button', { name: 'Sports', pressed: false }));
    fireEvent.click(screen.getByRole('button', { name: 'Arts', pressed: false }));
    fireEvent.click(screen.getByRole('button', { name: 'STEM', pressed: false }));
    // De-select Arts
    fireEvent.click(screen.getByRole('button', { name: 'Arts', pressed: true }));

    fireEvent.click(screen.getByRole('button', { name: /Send application/ }));
    await waitFor(() => {
      const fn = global.fetch as unknown as { mock: { calls: unknown[][] } };
      expect(fn.mock.calls.length).toBe(1);
    });
    const fetchMock = global.fetch as unknown as {
      mock: { calls: [string, { body: string }][] };
    };
    const payload = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(payload.categories).toEqual(['sports', 'stem']);
  });

  it('preserves all chip clicks even when fired in the same tick (race regression)', async () => {
    wrap();
    fireEvent.change(screen.getByLabelText('Your email'), {
      target: { value: 'op@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/Business name/), {
      target: { value: 'X' },
    });
    fireEvent.change(screen.getByLabelText(/Camp \/ program name/), {
      target: { value: 'Y' },
    });
    // Functional setState must read the latest categories on each click —
    // the prior shape captured a stale `form.categories` closure and only
    // the last write stuck when an operator tapped chips quickly.
    const chips = ['Sports', 'Arts', 'STEM', 'Outdoor', 'Nature'];
    for (const c of chips) {
      fireEvent.click(screen.getByRole('button', { name: c, pressed: false }));
    }
    fireEvent.click(screen.getByRole('button', { name: /Send application/ }));
    await waitFor(() => {
      const fn = global.fetch as unknown as { mock: { calls: unknown[][] } };
      expect(fn.mock.calls.length).toBe(1);
    });
    const fetchMock = global.fetch as unknown as {
      mock: { calls: [string, { body: string }][] };
    };
    const payload = JSON.parse(fetchMock.mock.calls[0][1].body);
    // All 5 chips must ride the payload.
    expect(payload.categories).toEqual(
      expect.arrayContaining(['sports', 'arts', 'stem', 'outdoor', 'nature']),
    );
    expect(payload.categories.length).toBe(5);
  });

  it('AddressPicker fills the address field when operator picks a geocode result', async () => {
    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (url.startsWith('/api/geocode')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            results: [
              {
                display_name: '536 Coral Way, Coral Gables, FL 33134, USA',
                latitude: 25.7501,
                longitude: -80.2643,
              },
            ],
          }),
        });
      }
      return Promise.resolve({ ok: true, json: async () => ({ ok: true }) });
    });
    global.fetch = fetchMock as typeof fetch;
    wrap();
    fireEvent.change(screen.getByLabelText('Your email'), {
      target: { value: 'op@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/Business name/), {
      target: { value: 'X' },
    });
    fireEvent.change(screen.getByLabelText(/Camp \/ program name/), {
      target: { value: 'Y' },
    });

    // Operator types in the AddressPicker search input + clicks Find.
    const searchInput = screen.getByPlaceholderText(
      '1234 Main St, Coral Gables, FL',
    );
    fireEvent.change(searchInput, {
      target: { value: '536 Coral Way Coral Gables' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Find' }));
    // Pick the first (and only) result.
    const pick = await screen.findByRole('button', { name: 'Pick this' });
    fireEvent.click(pick);

    // The manual address input should now hold the geocoded display_name,
    // and the operator could still edit it. Assert via submit payload.
    fireEvent.click(screen.getByRole('button', { name: /Send application/ }));
    await waitFor(() => {
      const camp = fetchMock.mock.calls.find(
        (c) => typeof c[0] === 'string' && c[0].startsWith('/api/camp-requests'),
      );
      expect(camp).toBeDefined();
    });
    const campCall = fetchMock.mock.calls.find(
      (c) => typeof c[0] === 'string' && c[0].startsWith('/api/camp-requests'),
    );
    const payload = JSON.parse(campCall![1].body);
    expect(payload.address).toBe(
      '536 Coral Way, Coral Gables, FL 33134, USA',
    );
  });

  it('merges "Other categories" comma-list into payload + dedupes against chip selections', async () => {
    wrap();
    fireEvent.change(screen.getByLabelText('Your email'), {
      target: { value: 'op@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/Business name/), {
      target: { value: 'X' },
    });
    fireEvent.change(screen.getByLabelText(/Camp \/ program name/), {
      target: { value: 'Y' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Sports', pressed: false }));
    fireEvent.change(screen.getByTestId('categories-other-input'), {
      // "Sports" duplicates the chip; should dedupe. "Robotics" + "BJJ"
      // are unusual values that wouldn't fit the canonical 18.
      target: { value: 'Robotics, BJJ, sports' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Send application/ }));
    await waitFor(() => {
      const fn = global.fetch as unknown as { mock: { calls: unknown[][] } };
      expect(fn.mock.calls.length).toBe(1);
    });
    const fetchMock = global.fetch as unknown as {
      mock: { calls: [string, { body: string }][] };
    };
    const payload = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(payload.categories).toEqual(['sports', 'robotics', 'bjj']);
  });

  it('drops empty session rows from the submitted payload', async () => {
    wrap();
    fireEvent.change(screen.getByLabelText('Your email'), {
      target: { value: 'op@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/Business name/), {
      target: { value: 'X' },
    });
    fireEvent.change(screen.getByLabelText(/Camp \/ program name/), {
      target: { value: 'Y' },
    });
    // Don't expand the accordion — default empty session row should be dropped.
    fireEvent.click(screen.getByRole('button', { name: /Send application/ }));

    await waitFor(() => {
      const fn = global.fetch as unknown as { mock: { calls: unknown[][] } };
      expect(fn.mock.calls.length).toBe(1);
    });
    const fetchMock = global.fetch as unknown as {
      mock: { calls: [string, { body: string }][] };
    };
    const payload = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(payload.sessions).toEqual([]);
  });
});
