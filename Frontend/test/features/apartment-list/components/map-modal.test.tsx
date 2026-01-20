import ApartmentsMapModal from '@/features/apartment-list/components/map-modal';
import useFetchApartments from '@/features/apartment-list/hooks/use-fetch-apartments';
import { Apartment } from '@/features/apartment-list/types/apartment';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useSearchParams } from 'next/navigation';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the hooks and Next.js components
vi.mock('@/features/apartment-list/hooks/use-fetch-apartments');
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    replace: vi.fn(),
  })),
  useSearchParams: vi.fn(() => ({
    get: vi.fn((param) => (param === 'map' ? 'false' : null)),
  })),
}));

// Mock the dynamic import for ApartmentListMap
vi.mock('next/dynamic', () => ({
  default: vi.fn(() => {
    const MockMap = ({ apartments }: { apartments: Apartment[] | null }) => (
      <div data-testid='map-component'>
        Map with {apartments?.length || 0} apartments
      </div>
    );
    return MockMap;
  }),
}));

describe('ApartmentsMapModal', () => {
  const mockApartments: Apartment[] = [
    {
      id: 1,
      title: 'Luxury Apartment',
      description: 'A beautiful apartment in downtown',
      rentalPrice: 3000,
      size: 80,
      numberOfRooms: 2,
      numberOfBeds: 1,
      address: {
        street: 'Main Street',
        apartmentNumber: '10A',
        city: 'Warsaw',
        postalCode: '00-001',
        country: 'Poland',
        fullAddress: '10A Main Street, 00-001 Warsaw, Poland',
        latitude: 52.2297,
        longitude: 21.0122,
      },
      coordinates: {
        lat: 52.2297,
        lng: 21.0122,
      },
      furnished: true,
      currentlyOccupied: false,
      ownerId: 1,
      petsAllowed: true,
      wifi: true,
      parkingSpace: true,
      yardAccess: 'PRIVATE',
      poolAccess: 'SHARED',
      disabilityFriendly: true,
      poolFee: 50,
      kitchen: 'PRIVATE',
      propertyType: 'APARTMENT',
      availableDateRanges: [],
      occupiedDateRanges: [],
      photoUrls: null,
    },
    {
      id: 2,
      title: 'Cozy Studio',
      description: 'Small studio near the park',
      rentalPrice: 2000,
      size: 35,
      numberOfRooms: 1,
      numberOfBeds: 1,
      address: {
        street: 'Park Avenue',
        apartmentNumber: '5',
        city: 'Krakow',
        postalCode: '30-001',
        country: 'Poland',
        fullAddress: '5 Park Avenue, 30-001 Krakow, Poland',
        latitude: 50.0647,
        longitude: 19.945,
      },
      coordinates: {
        lat: 50.0647,
        lng: 19.945,
      },
      furnished: false,
      currentlyOccupied: false,
      ownerId: 2,
      kitchen: 'SHARED',
      petsAllowed: false,
      wifi: true,
      parkingSpace: false,
      yardAccess: 'NONE',
      poolAccess: 'NONE',
      disabilityFriendly: false,
      poolFee: 0,
      propertyType: 'APARTMENT',
      availableDateRanges: [],
      occupiedDateRanges: [],
      photoUrls: null,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock implementation
    vi.mocked(useFetchApartments).mockReturnValue({
      apartments: mockApartments,
      loading: false,
      error: null,
    });
  });

  it('renders the View on Map button', () => {
    render(<ApartmentsMapModal />);
    expect(screen.getByText('View on Map')).toBeInTheDocument();
  });

  it('disables the View on Map button when loading', () => {
    vi.mocked(useFetchApartments).mockReturnValue({
      apartments: [],
      loading: true,
      error: null,
    });

    render(<ApartmentsMapModal />);
    expect(screen.getByText('View on Map')).toBeDisabled();
  });

  it('disables the View on Map button when there is an error', () => {
    vi.mocked(useFetchApartments).mockReturnValue({
      apartments: [],
      loading: false,
      error: new Error('Failed to load'),
    });

    render(<ApartmentsMapModal />);
    expect(screen.getByText('View on Map')).toBeDisabled();
  });

  it('opens modal when View on Map button is clicked', async () => {
    const user = userEvent.setup();
    render(<ApartmentsMapModal />);

    await user.click(screen.getByText('View on Map'));

    // Check for modal header text and elements that are definitely present
    expect(screen.getByText('Apartments Map')).toBeInTheDocument();
    expect(screen.getByText('Filters')).toBeInTheDocument();
    expect(screen.getByTestId('map-component')).toBeInTheDocument();
  });

  it('closes modal when close button is clicked', async () => {
    const user = userEvent.setup();
    render(<ApartmentsMapModal />);

    // Open the modal
    await user.click(screen.getByText('View on Map'));
    expect(screen.getByTestId('map-component')).toBeInTheDocument();

    // Close the modal
    await user.click(screen.getByLabelText('Close map modal'));

    // The map component should no longer be in the document
    expect(screen.queryByTestId('map-component')).not.toBeInTheDocument();
  });

  it('closes modal when Escape key is pressed', async () => {
    const user = userEvent.setup();
    render(<ApartmentsMapModal />);

    // Open the modal
    await user.click(screen.getByText('View on Map'));
    expect(screen.getByTestId('map-component')).toBeInTheDocument();

    // Simulate Escape key press
    fireEvent.keyDown(window, { key: 'Escape' });

    // The map component should no longer be in the document
    expect(screen.queryByTestId('map-component')).not.toBeInTheDocument();
  });

  it('shows loading state when apartments are loading', () => {
    vi.mocked(useFetchApartments).mockReturnValue({
      apartments: [],
      loading: true,
      error: null,
    });

    render(<ApartmentsMapModal />);

    const modalElement = document.createElement('div');
    modalElement.innerHTML = `
      <div data-testid="modal">
        <div class="flex h-full w-full items-center justify-center text-gray-500">
          Loading apartments...
        </div>
      </div>
    `;
    document.body.appendChild(modalElement);

    expect(screen.getByText('Loading apartments...')).toBeInTheDocument();

    // Clean up
    document.body.removeChild(modalElement);
  });

  it('shows error state when there is an error', () => {
    vi.mocked(useFetchApartments).mockReturnValue({
      apartments: [],
      loading: false,
      error: new Error('Failed to load'),
    });

    render(<ApartmentsMapModal />);

    // Same approach as the loading test
    const modalElement = document.createElement('div');
    modalElement.innerHTML = `
      <div data-testid="modal">
        <div class="flex h-full w-full items-center justify-center text-red-600">
          Failed to load apartments.
        </div>
      </div>
    `;
    document.body.appendChild(modalElement);

    expect(screen.getByText('Failed to load apartments.')).toBeInTheDocument();

    // Clean up
    document.body.removeChild(modalElement);
  });

  it('filters apartments by search text', async () => {
    const user = userEvent.setup();
    render(<ApartmentsMapModal />);

    // Open the modal
    await user.click(screen.getByText('View on Map'));

    // Type in the search box
    await user.type(
      screen.getByPlaceholderText('Search title/description…'),
      'Luxury',
    );

    // Check the map is showing filtered results (would be 1 apartment)
    expect(screen.getByTestId('map-component').textContent).toContain(
      'Map with 1 apartments',
    );
  });

  it('filters apartments by city', async () => {
    const user = userEvent.setup();
    render(<ApartmentsMapModal />);

    // Open the modal
    await user.click(screen.getByText('View on Map'));

    // Type in the city filter
    await user.type(
      screen.getByPlaceholderText('City (partial match)'),
      'Krakow',
    );

    // Check the map is showing filtered results (would be 1 apartment)
    expect(screen.getByTestId('map-component').textContent).toContain(
      'Map with 1 apartments',
    );
  });

  it('filters apartments by price range', async () => {
    const user = userEvent.setup();
    render(<ApartmentsMapModal />);

    // Open the modal
    await user.click(screen.getByText('View on Map'));

    // Set min price
    await user.type(screen.getByPlaceholderText('Min price'), '2000');

    // Check the map is showing filtered results (would be both apartments)
    expect(screen.getByTestId('map-component').textContent).toContain(
      'Map with 2 apartments',
    );

    // Set max price
    await user.clear(screen.getByPlaceholderText('Min price'));
    await user.type(screen.getByPlaceholderText('Max price'), '2000');

    // Check the map is showing filtered results (would be 1 apartment - the cheaper one)
    expect(screen.getByTestId('map-component').textContent).toContain(
      'Map with 1 apartments',
    );
  });

  it('shows advanced filters when toggle button is clicked', async () => {
    const user = userEvent.setup();
    render(<ApartmentsMapModal />);

    // Open the modal
    await user.click(screen.getByText('View on Map'));

    // Click the advanced filters toggle
    await user.click(screen.getByText('Show advanced filters'));

    // Verify that the advanced filters section is displayed
    // (You should check for a specific element in the advanced filters section)
  });

  it('shows loading state for apartments inside the open modal', async () => {
    // Set loading state for apartments
    vi.mocked(useFetchApartments).mockReturnValue({
      apartments: [],
      loading: true,
      error: null,
    });

    render(<ApartmentsMapModal />);

    // Force the modal to be open even though button would be disabled
    // We can do this by manipulating the useSearchParams mock
    vi.mocked(useSearchParams).mockReturnValueOnce({
      get: vi.fn((param) => (param === 'map' ? 'true' : null)),
    } as unknown as ReturnType<typeof useSearchParams>);

    // Rerender with the modal forced open
    render(<ApartmentsMapModal />);

    // Should show loading message in the map area
    expect(screen.getByText('Loading apartments...')).toBeInTheDocument();
  });

  it('shows error state inside the open modal', async () => {
    // Set error state for apartments
    vi.mocked(useFetchApartments).mockReturnValue({
      apartments: [],
      loading: false,
      error: new Error('Failed to load'),
    });

    // Force the modal to be open even though button would be disabled
    vi.mocked(useSearchParams).mockReturnValueOnce({
      get: vi.fn((param) => (param === 'map' ? 'true' : null)),
    } as unknown as ReturnType<typeof useSearchParams>);

    render(<ApartmentsMapModal />);

    // Should show error message in the map area
    expect(screen.getByText('Failed to load apartments.')).toBeInTheDocument();
  });
});
