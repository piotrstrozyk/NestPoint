import { Apartment } from '@/features/apartment-list/types/apartment';
import MyMap from '@/features/landing-page/components/map';
import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock react-leaflet components
vi.mock('react-leaflet', () => ({
  MapContainer: ({
    children,
    center,
    zoom,
    ...props
  }: {
    children?: React.ReactNode;
    center: [number, number];
    zoom: number;
    [key: string]: unknown;
  }) => (
    <div
      data-testid='map-container'
      data-center={JSON.stringify(center)}
      data-zoom={zoom}
      {...props}
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
  Marker: ({
    position,
    children,
    eventHandlers,
    ref,
    ...props
  }: {
    position: [number, number];
    children?: React.ReactNode;
    eventHandlers?: Record<string, () => void>;
    ref?: React.RefObject<{ openPopup: () => void }>;
    [key: string]: unknown;
  }) => {
    // Execute ref callback to set the ref value if provided
    if (ref) {
      ref.current = {
        openPopup: vi.fn(),
      };
    }

    // Call the add event handler immediately to simulate marker being added to map
    if (eventHandlers && eventHandlers.add) {
      setTimeout(() => eventHandlers.add(), 0);
    }

    return (
      <div
        data-testid='marker'
        data-position={JSON.stringify(position)}
        data-has-add-handler={!!eventHandlers?.add}
        {...props}
      >
        {children}
      </div>
    );
  },
  Popup: ({
    children,
    ...props
  }: {
    children?: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <div data-testid='popup' {...props}>
      {children}
    </div>
  ),
  useMap: () => ({
    latLngToContainerPoint: vi.fn().mockReturnValue({ x: 100, y: 100 }),
    containerPointToLatLng: vi.fn().mockReturnValue([51.505, -0.09]),
    flyTo: vi.fn(),
  }),
}));

vi.mock('@/features/maps/components/apartment-popup', () => ({
  default: ({ apt }: { apt: Apartment }) => (
    <div data-testid='apartment-popup' data-apt-id={apt.id}></div>
  ),
}));

// Mock Leaflet
vi.mock('leaflet', () => ({
  default: {
    point: vi.fn().mockReturnValue({ x: 100, y: 0 }),
  },
}));

// Import CSS mocks
vi.mock('leaflet/dist/leaflet.css', () => ({}));
vi.mock(
  'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css',
  () => ({}),
);
vi.mock('leaflet-defaulticon-compatibility', () => ({}));

describe('MyMap Component', () => {
  const mockApartment: Apartment = {
    id: 123,
    title: 'Test Apartment',
    description: 'A test apartment',
    address: {
      street: '123 Test St',
      apartmentNumber: '1A',
      city: 'Test City',
      postalCode: '00-000',
      country: 'Test Country',
      fullAddress: '123 Test St, 1A, 00-000 Test City, Test Country',
      latitude: 51.505,
      longitude: -0.09,
    },
    size: 75,
    rentalPrice: 2000,
    numberOfRooms: 3,
    numberOfBeds: 2,
    furnished: true,
    currentlyOccupied: false,
    ownerId: 1,
    kitchen: 'PRIVATE',
    wifi: true,
    petsAllowed: true,
    parkingSpace: false,
    yardAccess: 'NONE',
    poolAccess: 'NONE',
    disabilityFriendly: false,
    poolFee: 0,
    propertyType: 'APARTMENT',
    availableDateRanges: [
      {
        startDate: new Date('2024-06-01'),
        endDate: new Date('2024-12-31'),
      },
    ],
    occupiedDateRanges: [],
    photoUrls: ['/test-image.jpg'],
  };

  const defaultProps = {
    position: [51.505, -0.09] as [number, number],
    zoom: 13,
    apt: mockApartment,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the map container with correct props', () => {
    const { getByTestId } = render(<MyMap {...defaultProps} />);

    const mapContainer = getByTestId('map-container');
    expect(mapContainer).toBeInTheDocument();
    expect(mapContainer).toHaveAttribute(
      'data-center',
      JSON.stringify(defaultProps.position),
    );
    expect(mapContainer).toHaveAttribute(
      'data-zoom',
      String(defaultProps.zoom),
    );
    expect(mapContainer).toHaveClass('h-full');
    expect(mapContainer).toHaveClass('w-full');
  });

  it('renders a tile layer with correct URL', () => {
    const { getByTestId } = render(<MyMap {...defaultProps} />);

    const tileLayer = getByTestId('tile-layer');
    expect(tileLayer).toBeInTheDocument();
    expect(tileLayer).toHaveAttribute(
      'data-url',
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    );
  });

  it('renders a marker at the correct position', () => {
    const { getByTestId } = render(<MyMap {...defaultProps} />);

    const marker = getByTestId('marker');
    expect(marker).toBeInTheDocument();
    expect(marker).toHaveAttribute(
      'data-position',
      JSON.stringify(defaultProps.position),
    );
  });

  it('renders a popup with the apartment information', () => {
    const { getByTestId } = render(<MyMap {...defaultProps} />);

    const popup = getByTestId('popup');
    expect(popup).toBeInTheDocument();

    const apartmentPopup = getByTestId('apartment-popup');
    expect(apartmentPopup).toBeInTheDocument();
    expect(apartmentPopup).toHaveAttribute(
      'data-apt-id',
      String(mockApartment.id),
    );
  });

  it('renders with different position and zoom', () => {
    const customProps = {
      ...defaultProps,
      position: [48.8566, 2.3522] as [number, number],
      zoom: 15,
    };

    const { getByTestId } = render(<MyMap {...customProps} />);

    const mapContainer = getByTestId('map-container');
    expect(mapContainer).toHaveAttribute(
      'data-center',
      JSON.stringify(customProps.position),
    );
    expect(mapContainer).toHaveAttribute('data-zoom', String(customProps.zoom));
  });
  it('opens popup when marker is added to the map', async () => {
    const { getByTestId } = render(<MyMap {...defaultProps} />);

    const marker = getByTestId('marker');
    expect(marker).toBeInTheDocument();
    expect(marker).toHaveAttribute('data-has-add-handler', 'true');

    await vi.runAllTimersAsync();
  });
});
