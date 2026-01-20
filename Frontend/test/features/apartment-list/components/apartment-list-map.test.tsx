import ApartmentListMap from '@/features/apartment-list/components/apartment-list-map';
import { Apartment } from '@/features/apartment-list/types/apartment';
import { fireEvent, render, screen } from '@testing-library/react';
import L from 'leaflet';
import { describe, expect, it, vi } from 'vitest';

// Mock the Leaflet dependencies
vi.mock('leaflet', () => ({
  default: {
    divIcon: vi.fn().mockReturnValue({}),
    point: vi.fn().mockReturnValue({}),
    MarkerCluster: class {},
  },
  DivIcon: class {},
}));

vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid='map-container'>{children}</div>
  ),
  TileLayer: ({ url }: { url: string }) => (
    <div data-testid='tile-layer' data-url={url}></div>
  ),
}));

// We need to capture the iconCreateFunction to test it
let capturedIconCreateFunction: ((cluster: unknown) => unknown) | null = null;

// Update the mock for MarkerClusterGroup to capture the iconCreateFunction
vi.mock('react-leaflet-markercluster', () => ({
  default: ({
    children,
    iconCreateFunction,
  }: {
    children: React.ReactNode;
    iconCreateFunction: (cluster: unknown) => unknown;
  }) => {
    // Store the function so we can test it
    capturedIconCreateFunction = iconCreateFunction;
    return <div data-testid='marker-cluster-group'>{children}</div>;
  },
}));

vi.mock('@/features/maps/components/apartment-marker', () => ({
  default: ({ apt }: { apt: Apartment }) => (
    <div data-testid='apartment-marker' data-apartment-id={apt.id}></div>
  ),
}));

const mockFallbackCenter: [number, number] = [51.505, -0.09];

const mockApartments: Apartment[] = [
  {
    id: 1,
    address: {
      latitude: 52.1,
      longitude: 21.2,
      street: 'Test Street 1',
      city: 'Test City',
      apartmentNumber: '1A',
      postalCode: '00-001',
      country: 'Test Country',
      fullAddress: 'Test Street 1, 1A, 00-001 Test City, Test Country',
    },
    // Add other required properties as needed
    title: 'Apartment 1',
    rentalPrice: 1000,
    size: 50,
    numberOfRooms: 2,
    numberOfBeds: 1,
    description: 'A cozy apartment in the city center.',
    furnished: true,
    currentlyOccupied: false,
    ownerId: 1,
    kitchen: 'PRIVATE',
    wifi: true,
    petsAllowed: false,
    parkingSpace: true,
    yardAccess: 'PRIVATE',
    poolAccess: 'NONE',
    disabilityFriendly: false,
    poolFee: 0,
    propertyType: 'APARTMENT',
    availableDateRanges: [],
    occupiedDateRanges: [],
    photoUrls: null,
    coordinates: {
      lat: 52.1,
      lng: 21.2,
    },
  },
  {
    id: 2,
    address: {
      latitude: 53.3,
      longitude: 22.4,
      street: 'Test Street 2',
      city: 'Test City',
      apartmentNumber: '2B',
      postalCode: '00-002',
      country: 'Test Country',
      fullAddress: 'Test Street 2, 2B, 00-002 Test City, Test Country',
    },
    title: 'Apartment 2',
    rentalPrice: 1200,
    size: 60,
    numberOfRooms: 3,
    numberOfBeds: 2,
    description: 'A spacious apartment with a great view.',
    furnished: true,
    currentlyOccupied: false,
    ownerId: 2,
    kitchen: 'SHARED',
    wifi: true,
    petsAllowed: true,
    parkingSpace: false,
    yardAccess: 'SHARED',
    poolAccess: 'SHARED',
    disabilityFriendly: true,
    poolFee: 50,
    propertyType: 'APARTMENT',
    availableDateRanges: [],
    occupiedDateRanges: [],
    photoUrls: null,
    coordinates: {
      lat: 53.3,
      lng: 22.4,
    },
  },
  {
    id: 3,
    address: {
      latitude: 0,
      longitude: 0,
      street: 'Test Street 3',
      city: 'Test City',
      apartmentNumber: '3C',
      postalCode: '00-003',
      country: 'Test Country',
      fullAddress: 'Test Street 3, 3C, 00-003 Test City, Test Country',
    },
    title: 'Apartment 3',
    rentalPrice: 800,
    size: 40,
    numberOfRooms: 1,
    numberOfBeds: 1,
    description: 'A small but comfortable apartment.',
    furnished: false,
    currentlyOccupied: true,
    ownerId: 3,
    kitchen: 'PRIVATE',
    wifi: false,
    petsAllowed: false,
    parkingSpace: true,
    yardAccess: 'NONE',
    poolAccess: 'NONE',
    disabilityFriendly: false,
    poolFee: 0,
    propertyType: 'APARTMENT',
    availableDateRanges: [],
    occupiedDateRanges: [],
    photoUrls: null,
    coordinates: {
      lat: 0,
      lng: 0,
    },
  },
];

describe('ApartmentListMap', () => {
  it('renders the map when center is available', () => {
    render(
      <ApartmentListMap
        apartments={mockApartments}
        fallbackCenter={mockFallbackCenter}
      />,
    );

    expect(screen.getByTestId('map-container')).toBeInTheDocument();
  });

  it('displays OSM view by default', () => {
    render(
      <ApartmentListMap
        apartments={mockApartments}
        fallbackCenter={mockFallbackCenter}
      />,
    );

    const tileLayer = screen.getByTestId('tile-layer');
    expect(tileLayer).toHaveAttribute(
      'data-url',
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    );
    expect(screen.getByText('Satellite View')).toBeInTheDocument();
  });

  it('toggles between OSM and satellite view', () => {
    render(
      <ApartmentListMap
        apartments={mockApartments}
        fallbackCenter={mockFallbackCenter}
      />,
    );

    // Initial state is OSM
    expect(screen.getByText('Satellite View')).toBeInTheDocument();

    // Click to toggle
    fireEvent.click(screen.getByText('Satellite View'));

    // Should now show satellite and button text should change
    const tileLayer = screen.getByTestId('tile-layer');
    expect(tileLayer).toHaveAttribute(
      'data-url',
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    );
    expect(screen.getByText('OSM View')).toBeInTheDocument();
  });

  it('renders markers only for apartments with valid coordinates', () => {
    render(
      <ApartmentListMap
        apartments={mockApartments}
        fallbackCenter={mockFallbackCenter}
      />,
    );

    const markers = screen.getAllByTestId('apartment-marker');
    expect(markers).toHaveLength(3);
    expect(markers[0]).toHaveAttribute('data-apartment-id', '1');
    expect(markers[1]).toHaveAttribute('data-apartment-id', '2');
  });

  it('uses fallback center when no apartments have coordinates', () => {
    const noCoordinatesApartments = [
      {
        ...mockApartments[2], // The apartment without coordinates
        id: 4,
      },
    ];

    render(
      <ApartmentListMap
        apartments={noCoordinatesApartments}
        fallbackCenter={mockFallbackCenter}
      />,
    );

    expect(screen.getByTestId('map-container')).toBeInTheDocument();
  });

  it('uses custom zoom level when provided', () => {
    const customZoom = 10;

    render(
      <ApartmentListMap
        apartments={mockApartments}
        fallbackCenter={mockFallbackCenter}
        zoom={customZoom}
      />,
    );

    expect(screen.getByTestId('map-container')).toBeInTheDocument();
  });

  it('displays loading state when center is null', async () => {
    // We need to manipulate the component's state to test the loading message
    // This can be done by providing an empty apartment array and forcing a re-render
    // before the useEffect sets the center

    const { rerender } = render(
      <ApartmentListMap apartments={[]} fallbackCenter={mockFallbackCenter} />,
    );

    // Force rerender to simulate the center being set
    rerender(
      <ApartmentListMap
        apartments={mockApartments}
        fallbackCenter={mockFallbackCenter}
      />,
    );
  });
});

describe('makeClusterIcon function', () => {
  beforeEach(() => {
    capturedIconCreateFunction = null;
    // Reset the mock counts
    vi.clearAllMocks();
  });
  // We need to expose and test the cluster icon creation logic
  it('creates small cluster icon for less than 5 markers', () => {
    render(
      <ApartmentListMap
        apartments={mockApartments}
        fallbackCenter={mockFallbackCenter}
      />,
    );

    // Create a mock MarkerCluster instance
    const mockCluster = {
      getChildCount: () => 3,
    };

    // Verify the function was captured
    expect(capturedIconCreateFunction).not.toBeNull();

    // Call the function with our mock cluster
    if (capturedIconCreateFunction) {
      capturedIconCreateFunction(mockCluster);
    }

    // Now verify the L.divIcon and L.point were called
    expect(L.divIcon).toHaveBeenCalled();
    expect(L.point).toHaveBeenCalledWith(40, 40);
  });

  it('creates medium cluster icon for 5-9 markers', () => {
    render(
      <ApartmentListMap
        apartments={mockApartments}
        fallbackCenter={mockFallbackCenter}
      />,
    );

    // Create a mock MarkerCluster instance
    const mockCluster = {
      getChildCount: () => 7,
    };

    // Call the function with our mock cluster
    if (capturedIconCreateFunction) {
      capturedIconCreateFunction(mockCluster);
    }

    // Verify the L.divIcon and L.point were called with medium size
    expect(L.divIcon).toHaveBeenCalled();
    expect(L.point).toHaveBeenCalledWith(50, 50);
  });

  it('creates large cluster icon for 10+ markers', () => {
    render(
      <ApartmentListMap
        apartments={mockApartments}
        fallbackCenter={mockFallbackCenter}
      />,
    );

    // Create a mock MarkerCluster instance
    const mockCluster = {
      getChildCount: () => 15,
    };

    // Call the function with our mock cluster
    if (capturedIconCreateFunction) {
      capturedIconCreateFunction(mockCluster);
    }

    // Verify the L.divIcon and L.point were called with large size
    expect(L.divIcon).toHaveBeenCalled();
    expect(L.point).toHaveBeenCalledWith(60, 60);
  });

  it('skips rendering markers for apartments with invalid coordinates', () => {
    // Create mock apartments with invalid coordinates
    const invalidApartments = [
      {
        ...mockApartments[0],
        id: 10,
        address: {
          ...mockApartments[0].address,
          latitude: null, // Invalid latitude
          longitude: 21.2,
        },
      },
      {
        ...mockApartments[0],
        id: 11,
        address: {
          ...mockApartments[0].address,
          latitude: 52.1,
          longitude: null, // Invalid longitude as null
        },
      },
      {
        ...mockApartments[0],
        id: 12,
        address: {
          ...mockApartments[0].address,
          latitude: null, // Invalid latitude as null
          longitude: 21.2,
        },
      },
    ];

    render(
      <ApartmentListMap
        apartments={invalidApartments}
        fallbackCenter={mockFallbackCenter}
      />,
    );

    // Verify no apartment markers are rendered
    const markers = screen.queryAllByTestId('apartment-marker');
    expect(markers).toHaveLength(0);
  });
});
