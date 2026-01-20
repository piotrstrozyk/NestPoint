import AddressMap from '@/features/maps/components/address-map';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the Leaflet dependencies
vi.mock('leaflet-defaulticon-compatibility', () => ({}));
vi.mock('leaflet/dist/leaflet.css', () => ({}));
vi.mock(
  'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css',
  () => ({}),
);

// Mock the react-leaflet components
vi.mock('react-leaflet', () => ({
  MapContainer: ({
    children,
    center,
    zoom,
  }: {
    children: React.ReactNode;
    center: [number, number];
    zoom: number;
  }) => (
    <div
      data-testid='map-container'
      data-center={JSON.stringify(center)}
      data-zoom={zoom}
    >
      {children}
    </div>
  ),
  TileLayer: ({ url, attribution }: { url: string; attribution?: string }) => (
    <div
      data-testid='tile-layer'
      data-url={url}
      data-attribution={attribution}
    ></div>
  ),
  GeoJSON: ({ data, style }: { data: unknown; style?: unknown }) => (
    <div data-testid='geojson-layer' data-style={JSON.stringify(style)}>
      {JSON.stringify(data)}
    </div>
  ),
  Marker: ({ position }: { position: unknown }) => (
    <div
      data-testid='map-marker'
      data-position={JSON.stringify(position)}
    ></div>
  ),
}));

// Sample geocoding response
const mockGeocodingResponse = [
  {
    lat: '52.5200',
    lon: '13.4050',
    geojson: {
      type: 'Polygon',
      coordinates: [
        [
          [13.404, 52.519],
          [13.406, 52.519],
          [13.406, 52.521],
          [13.404, 52.521],
          [13.404, 52.519],
        ],
      ],
    },
  },
];

// Sample geocoding response without geojson
const mockGeocodingResponseNoGeoJSON = [
  {
    lat: '52.5200',
    lon: '13.4050',
  },
];

describe('AddressMap', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    // Mock console methods to avoid cluttering test output
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('shows loading state initially', () => {
    // Mock fetch to delay response
    global.fetch = vi.fn().mockImplementation(() => new Promise(() => {}));

    render(<AddressMap address='Berlin, Germany' zoom={15} />);
    expect(screen.getByText('Loading map…')).toBeInTheDocument();
  });

  it('renders the map when geocoding data is loaded', async () => {
    // Mock successful fetch
    global.fetch = vi.fn().mockResolvedValueOnce({
      json: vi.fn().mockResolvedValueOnce(mockGeocodingResponse),
    });

    render(<AddressMap address='Berlin, Germany' zoom={15} />);

    await waitFor(() => {
      expect(screen.queryByText('Loading map…')).not.toBeInTheDocument();
    });

    const mapContainer = screen.getByTestId('map-container');
    expect(mapContainer).toBeInTheDocument();
    expect(mapContainer.getAttribute('data-center')).toBe(
      JSON.stringify([52.52, 13.405]),
    );
    expect(mapContainer.getAttribute('data-zoom')).toBe('15');
  });

  it('includes the GeoJSON layer when available', async () => {
    // Mock successful fetch with GeoJSON
    global.fetch = vi.fn().mockResolvedValueOnce({
      json: vi.fn().mockResolvedValueOnce(mockGeocodingResponse),
    });

    render(<AddressMap address='Berlin, Germany' zoom={15} />);

    await waitFor(() => {
      expect(screen.getByTestId('geojson-layer')).toBeInTheDocument();
    });

    const geoJSONLayer = screen.getByTestId('geojson-layer');
    expect(geoJSONLayer).toBeInTheDocument();
    expect(JSON.parse(geoJSONLayer.textContent || '')).toEqual(
      mockGeocodingResponse[0].geojson,
    );
  });

  it('does not include GeoJSON layer when not available', async () => {
    // Mock successful fetch without GeoJSON
    global.fetch = vi.fn().mockResolvedValueOnce({
      json: vi.fn().mockResolvedValueOnce(mockGeocodingResponseNoGeoJSON),
    });

    render(<AddressMap address='Another Address' zoom={15} />);

    await waitFor(() => {
      expect(screen.queryByText('Loading map…')).not.toBeInTheDocument();
    });

    expect(screen.queryByTestId('geojson-layer')).not.toBeInTheDocument();
  });

  it('toggles between OSM and satellite view', async () => {
    // Mock successful fetch
    global.fetch = vi.fn().mockResolvedValueOnce({
      json: vi.fn().mockResolvedValueOnce(mockGeocodingResponse),
    });

    render(<AddressMap address='Berlin, Germany' zoom={15} />);

    await waitFor(() => {
      expect(screen.queryByText('Loading map…')).not.toBeInTheDocument();
    });

    // Check initial OSM view
    let tileLayers = screen.getAllByTestId('tile-layer');
    expect(tileLayers[0].getAttribute('data-url')).toBe(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    );

    // Toggle to satellite view
    fireEvent.click(screen.getByText('Satellite View'));

    // Check satellite view
    tileLayers = screen.getAllByTestId('tile-layer');
    expect(tileLayers[0].getAttribute('data-url')).toBe(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    );

    // Toggle back to OSM view
    fireEvent.click(screen.getByText('OSM View'));

    // Check OSM view again
    tileLayers = screen.getAllByTestId('tile-layer');
    expect(tileLayers[0].getAttribute('data-url')).toBe(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    );
  });

  it('handles fetch errors gracefully', async () => {
    // Mock failed fetch
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

    render(<AddressMap address='Invalid Address' zoom={15} />);

    // Should still show loading state as center remains null
    expect(screen.getByText('Loading map…')).toBeInTheDocument();

    // Verify error was logged
    await waitFor(() => {
      expect(console.error).toHaveBeenCalled();
    });
  });

  it('re-fetches when address prop changes', async () => {
    // First fetch
    global.fetch = vi.fn().mockResolvedValueOnce({
      json: vi.fn().mockResolvedValueOnce(mockGeocodingResponse),
    });

    const { rerender } = render(
      <AddressMap address='Berlin, Germany' zoom={15} />,
    );

    await waitFor(() => {
      expect(screen.queryByText('Loading map…')).not.toBeInTheDocument();
    });

    // Setup second fetch with different coordinates
    global.fetch = vi.fn().mockResolvedValueOnce({
      json: vi.fn().mockResolvedValueOnce([
        {
          lat: '48.8566',
          lon: '2.3522',
        },
      ]),
    });

    // Change address prop
    rerender(<AddressMap address='Paris, France' zoom={15} />);

    // Verify second fetch was called with new address
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('q=Paris%2C+France'),
    );

    // Wait for re-render with new coordinates
    await waitFor(() => {
      const mapContainer = screen.getByTestId('map-container');
      expect(mapContainer.getAttribute('data-center')).toBe(
        JSON.stringify([48.8566, 2.3522]),
      );
    });
  });
});
