import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import {
  DataQualityPanel,
  type DataQualityCamp,
  type DataQualityData,
} from '@/components/admin/DataQualityPanel';

const fixture = (overrides?: Partial<DataQualityData>): DataQualityData => ({
  noAddress: [],
  noPhone: [],
  staleVerifications: [],
  ...overrides,
});

const c = (over?: Partial<DataQualityCamp>): DataQualityCamp => ({
  id: 'c1',
  slug: 'camp-a',
  name: 'Camp A',
  address: null,
  phone: null,
  last_verified_at: null,
  data_completeness: 0.8,
  ...over,
});

describe('DataQualityPanel', () => {
  it('renders three sections with empty states by default', () => {
    render(<DataQualityPanel locale="en" data={fixture()} />);
    expect(screen.getByText(/Camps needing addresses \(0\)/)).toBeInTheDocument();
    expect(screen.getByText(/Camps needing phones \(0\)/)).toBeInTheDocument();
    expect(screen.getByText(/Stale verifications \(0\)/)).toBeInTheDocument();
    expect(
      screen.getByText('No verified camps are missing an address.'),
    ).toBeInTheDocument();
  });

  it('shows section counts and rows when data is present', () => {
    const data = fixture({
      noAddress: [c({ id: '1', slug: 'a', name: 'Alpha' })],
      noPhone: [
        c({ id: '2', slug: 'b', name: 'Beta', address: '1 Main St' }),
        c({ id: '3', slug: 'c', name: 'Gamma' }),
      ],
      staleVerifications: [
        c({
          id: '4',
          slug: 'd',
          name: 'Delta',
          last_verified_at: new Date(
            Date.now() - 90 * 86400000,
          ).toISOString(),
        }),
      ],
    });
    render(<DataQualityPanel locale="en" data={data} />);

    expect(screen.getByText(/Camps needing addresses \(1\)/)).toBeInTheDocument();
    expect(screen.getByText(/Camps needing phones \(2\)/)).toBeInTheDocument();
    expect(screen.getByText(/Stale verifications \(1\)/)).toBeInTheDocument();

    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
    expect(screen.getByText('Gamma')).toBeInTheDocument();
    expect(screen.getByText('Delta')).toBeInTheDocument();
  });

  it('renders Edit + View links pointing at the locale-aware admin and camp pages', () => {
    const data = fixture({
      noAddress: [c({ id: '1', slug: 'sunset-camp', name: 'Sunset Camp' })],
    });
    render(<DataQualityPanel locale="es" data={data} />);

    const editLink = screen.getByRole('link', { name: /Edit/i });
    expect(editLink).toHaveAttribute(
      'href',
      '/es/admin?tab=enrichment#camp-sunset-camp',
    );

    const viewLink = screen.getByRole('link', { name: /View/i });
    expect(viewLink).toHaveAttribute('href', '/es/camps/sunset-camp');
  });

  it('shows "—" for missing fields and percentage for completeness', () => {
    const data = fixture({
      noPhone: [
        c({
          id: '1',
          slug: 'x',
          name: 'Xenon',
          address: null,
          phone: null,
          data_completeness: 0.42,
        }),
      ],
    });
    render(<DataQualityPanel locale="en" data={data} />);
    expect(screen.getByText('Xenon')).toBeInTheDocument();
    expect(screen.getByText('42%')).toBeInTheDocument();
  });
});
