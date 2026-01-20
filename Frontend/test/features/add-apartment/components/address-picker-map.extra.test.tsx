import { render, screen } from '@testing-library/react';
import React from 'react';
import { vi } from 'vitest';

let _mapClicked = false;

// Mocks for leaflet and react-leaflet
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
import { PolygonGeoJSON } from '@/features/add-apartment/types/polygon-geojson';

describe('AddressPickerMap (extra coverage)', () => {
  beforeEach(() => {
    _mapClicked = false;
  });

  it('sets marker position on map click (ClickHandler)', () => {
    vi.spyOn(revGeoModule, 'default').mockReturnValue({
      data: null,
      loading: false,
      error: null,
    });
    render(<AddressPickerMap fallbackCenter={[0, 0]} zoom={5} />);
    // Marker should be rendered at [1,2] after click
    expect(screen.getByTestId('marker')).toHaveAttribute(
      'data-position',
      '1,2',
    );
  });

  const dummyAddress = {
    street: '',
    city: '',
    postalCode: '',
    country: '',
    apartmentNumber: '',
    fullAddress: '',
    latitude: 0,
    longitude: 0,
  };

  it('shows noGeoData notice when marker set, not loading, no error, no geojson', () => {
    vi.spyOn(revGeoModule, 'default').mockReturnValue({
      data: {
        geojson: undefined as unknown as PolygonGeoJSON,
        address: dummyAddress,
      },
      loading: false,
      error: null,
    });
    render(<AddressPickerMap fallbackCenter={[0, 0]} zoom={5} />);
    expect(
      screen.getByText('Could not find an address here.'),
    ).toBeInTheDocument();
  });

  it('renders a Circle for valid Point geojson', () => {
    vi.spyOn(revGeoModule, 'default').mockReturnValue({
      data: {
        geojson: {
          type: 'Point',
          coordinates: [2, 1],
        } as unknown as PolygonGeoJSON,
        address: dummyAddress,
      },
      loading: false,
      error: null,
    });
    render(<AddressPickerMap fallbackCenter={[0, 0]} zoom={5} />);
    // Circle should be rendered at [1,2]
    expect(screen.getByTestId('circle')).toHaveAttribute('data-center', '1,2');
  });

  it('does not render Circle for invalid Point geojson', () => {
    vi.spyOn(revGeoModule, 'default').mockReturnValue({
      data: {
        geojson: {
          type: 'Polygon' as const,
          coordinates: [
            [
              [2, 1],
              [3, 4],
              [5, 6],
              [2, 1],
            ],
          ], // valid Polygon coordinates
        } as const,
        address: dummyAddress,
      },
      loading: false,
      error: null,
    });
    render(<AddressPickerMap fallbackCenter={[0, 0]} zoom={5} />);
    expect(screen.queryByTestId('circle')).toBeNull();
  });

  it('shows loading overlay when loading and markerPos are set', () => {
    vi.spyOn(revGeoModule, 'default').mockReturnValue({
      data: {
        geojson: {
          type: 'Point',
          coordinates: [2], // invalid
        } as unknown as { type: 'Polygon'; coordinates: [number, number][][] },
        address: dummyAddress,
      },
      loading: true,
      error: null,
    });
    render(<AddressPickerMap fallbackCenter={[0, 0]} zoom={5} />);
    // Simulate map click to set markerPos
    expect(screen.getByText('Drawing shape...')).toBeInTheDocument();
  });

  it('shows error overlay when error is present', () => {
    vi.spyOn(revGeoModule, 'default').mockReturnValue({
      data: {
        geojson: {
          type: 'Point',
          coordinates: [2], // invalid
        } as unknown as { type: 'Polygon'; coordinates: [number, number][][] },
        address: dummyAddress,
      },
      loading: false,
      error: new Error('Some error'),
    });
    render(<AddressPickerMap fallbackCenter={[0, 0]} zoom={5} />);
    // Simulate map click to set markerPos
    expect(screen.getByText('Error drawing shape')).toBeInTheDocument();
  });

  it('calls onAddressChange with null when no address is found', () => {
    const onAddressChange = vi.fn();
    vi.spyOn(revGeoModule, 'default').mockReturnValue({
      data: {
        address: { ...dummyAddress, fullAddress: '' },
        geojson: undefined as unknown as PolygonGeoJSON,
      },
      loading: false,
      error: null,
    });
    render(
      <AddressPickerMap
        fallbackCenter={[0, 0]}
        zoom={5}
        onAddressChange={onAddressChange}
      />,
    );
    expect(onAddressChange).toHaveBeenCalledWith(null);
  });
});
