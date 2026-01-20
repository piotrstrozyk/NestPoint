// test/address-picker-map.test.tsx
import { render, screen } from '@testing-library/react';
import React from 'react';
import { vi } from 'vitest';

let _mapClicked = false;

vi.mock('leaflet', () => {
  class DummyIcon {
    constructor() {}
  }
  return {
    __esModule: true,
    default: { Icon: { Default: DummyIcon } },
  };
});
vi.mock('leaflet/dist/leaflet.css', () => ({ default: '' }));
vi.mock('leaflet-defaulticon-compatibility', () => ({ default: {} }));
vi.mock(
  'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css',
  () => ({ default: '' }),
);

// ── 2️⃣ Stub React‑Leaflet ─────────────────────────────────────────────────
vi.mock('react-leaflet', () => ({
  __esModule: true,
  MapContainer: ({ children }: React.PropsWithChildren<object>) => (
    <div data-testid='map'>{children}</div>
  ),
  TileLayer: () => <div data-testid='tilelayer' />,
  Marker: ({ position }: { position: [number, number] }) => (
    <div data-testid='marker' data-position={position.join(',')} />
  ),
  GeoJSON: ({ data }: { data: Record<string, unknown> }) => (
    <div data-testid='geojson' data-type={data.type as string} />
  ),
  Circle: ({ center }: { center: [number, number] }) => (
    <div data-testid='circle' data-center={center.join(',')} />
  ),
  useMapEvents: (
    handlers: Record<
      string,
      (event: { latlng: { lat: number; lng: number } }) => void
    >,
  ) => {
    // Only fire click once:
    if (!_mapClicked) {
      _mapClicked = true;
      handlers.click({ latlng: { lat: 1, lng: 2 } });
    }
    return null;
  },
}));

import AddressPickerMap from '@/features/add-apartment/components/address-picker-map';
import * as revGeoModule from '@/features/add-apartment/hooks/use-reverse-geocode';

describe('AddressPickerMap', () => {
  const mockData = {
    address: {
      fullAddress: '123 Main St, Townsville',
      street: 'Main St',
      city: 'Townsville',
      postalCode: '00000',
      country: 'Utopia',
      apartmentNumber: '',
      latitude: 1,
      longitude: 2,
    },
    geojson: {
      type: 'Polygon' as const,
      coordinates: [
        [
          [2, 1] as [number, number],
          [2, 1] as [number, number],
          [2, 1] as [number, number],
          [2, 1] as [number, number],
        ],
      ],
    },
  };

  beforeEach(() => {
    // reset the click flag each test
    _mapClicked = false;

    // spy on the hook’s default export
    vi.spyOn(revGeoModule, 'default').mockReturnValue({
      data: mockData,
      loading: false,
      error: null,
    });
  });

  it('renders marker, circle, shows address & calls onAddressChange', () => {
    const onAddressChange = vi.fn();

    render(
      <AddressPickerMap
        fallbackCenter={[0, 0]}
        zoom={5}
        onAddressChange={onAddressChange}
      />,
    );

    // 1) The input shows the fullAddress
    expect(
      screen.getByPlaceholderText('Click on the map to get an address'),
    ).toHaveValue('123 Main St, Townsville');

    // 2) onAddressChange was called once
    expect(onAddressChange).toHaveBeenCalledTimes(1);
    expect(onAddressChange).toHaveBeenCalledWith(mockData.address);

    // 3) Marker rendered at [1,2]
    expect(screen.getByTestId('marker')).toHaveAttribute(
      'data-position',
      '1,2',
    );

    // 4) GeoJSON rendered for polygon
    expect(screen.getByTestId('geojson')).toHaveAttribute(
      'data-type',
      'Polygon',
    );

    // 5) No circle when geojson.type is Polygon
    expect(screen.queryByTestId('circle')).toBeNull();
  });
});
