import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, Mock } from 'vitest';
import userEvent from '@testing-library/user-event';
import ApartmentsPage from '@/features/apartment-list/pages/apartment-list-page';

// Mock the hooks
vi.mock('@/features/apartment-list/hooks/use-fetch-apartments');
vi.mock('@/features/apartment-list/hooks/use-fetch-available');
vi.mock('@/features/apartment-list/hooks/use-fetch-by-auction');

// Mock the components
vi.mock('@/core/components/calendar/calendar', () => ({
  default: ({ onConfirm }: { onConfirm: (range?: { from: Date; to: Date } | undefined) => void }) => (
    <div data-testid="day-range-picker">
      <button
        onClick={() => onConfirm({ from: new Date('2024-01-01'), to: new Date('2024-01-31') })}
        data-testid="select-date-range"
      >
        Select Date Range
      </button>
      <button
        onClick={() => onConfirm(undefined)}
        data-testid="clear-date-range"
      >
        Clear Range
      </button>
    </div>
  ),
}));

type MockApartment = typeof mockApartments[number];
interface MockApartmentCardProps {
  apt: MockApartment;
  isLoading: boolean;
}

vi.mock('@/features/apartment-list/components/apartment-card', () => ({
  default: ({ apt, isLoading }: MockApartmentCardProps) => (
    <div data-testid={isLoading ? 'apartment-card-skeleton' : 'apartment-card'}>
      {!isLoading && (
        <>
          <h3>{apt.title}</h3>
          <p>{apt.description}</p>
          <span data-testid="price">{apt.rentalPrice}</span>
          <span data-testid="city">{apt.address.city}</span>
          <span data-testid="size">{apt.size}</span>
          <span data-testid="rooms">{apt.numberOfRooms}</span>
          <span data-testid="beds">{apt.numberOfBeds}</span>
        </>
      )}
    </div>
  ),
}));

vi.mock('@/features/apartment-list/components/map-modal', () => ({
  default: () => <div data-testid="apartments-map-modal" />,
}));

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: React.PropsWithChildren<{ href: string }>) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

// Mock hooks
import useFetchApartments from '@/features/apartment-list/hooks/use-fetch-apartments';
import useFetchAvailableApartments from '@/features/apartment-list/hooks/use-fetch-available';
import useFetchApartmentsByAuction from '@/features/apartment-list/hooks/use-fetch-by-auction';

const mockUseFetchApartments = useFetchApartments as Mock;
const mockUseFetchAvailableApartments = useFetchAvailableApartments as Mock;
const mockUseFetchApartmentsByAuction = useFetchApartmentsByAuction as Mock;

// Sample apartment data
const mockApartments = [
  {
    id: 1,
    title: 'Modern Apartment Downtown',
    description: 'Beautiful modern apartment in the city center',
    size: 75,
    numberOfRooms: 3,
    numberOfBeds: 2,
    rentalPrice: 2500,
    furnished: true,
    wifi: true,
    petsAllowed: false,
    propertyType: 'APARTMENT' as const,
    ownerId: 1,
    address: {
      street: 'Main St 123',
      apartmentNumber: '4A',
      city: 'Warsaw',
      postalCode: '00-001',
      country: 'Poland',
      fullAddress: 'Main St 123, 4A, Warsaw',
      latitude: 52.2297,
      longitude: 21.0122,
    },
    currentlyOccupied: false,
    parkingSpace: true,
    yardAccess: 'SHARED' as const,
    poolAccess: 'NONE' as const,
    kitchen: 'PRIVATE' as const,
    poolFee: 0,
    disabilityFriendly: true,
    availableDateRanges: [],
    occupiedDateRanges: [],
    photoUrls: null,
    coordinates: { lat: 52.2297, lng: 21.0122 },
  },
  {
    id: 2,
    title: 'Cozy Room Near University',
    description: 'Perfect for students, close to campus',
    size: 25,
    numberOfRooms: 1,
    numberOfBeds: 1,
    rentalPrice: 800,
    furnished: false,
    wifi: true,
    petsAllowed: true,
    propertyType: 'ROOM' as const,
    ownerId: 2,
    address: {
      street: 'University Ave 456',
      apartmentNumber: '2B',
      city: 'Krakow',
      postalCode: '30-001',
      country: 'Poland',
      fullAddress: 'University Ave 456, 2B, Krakow',
      latitude: 50.0647,
      longitude: 19.9450,
    },
    currentlyOccupied: false,
    parkingSpace: false,
    yardAccess: 'NONE' as const,
    poolAccess: 'SHARED' as const,
    kitchen: 'SHARED' as const,
    poolFee: 50,
    disabilityFriendly: false,
    availableDateRanges: [],
    occupiedDateRanges: [],
    photoUrls: null,
    coordinates: { lat: 50.0647, lng: 19.9450 },
  },
  {
    id: 3,
    title: 'Luxury Property with Pool',
    description: 'High-end property with private amenities',
    size: 150,
    numberOfRooms: 5,
    numberOfBeds: 3,
    rentalPrice: 5000,
    furnished: true,
    wifi: true,
    petsAllowed: true,
    propertyType: 'PROPERTY' as const,
    ownerId: 3,
    address: {
      street: 'Luxury Lane 789',
      apartmentNumber: '',
      city: 'Warsaw',
      postalCode: '02-001',
      country: 'Poland',
      fullAddress: 'Luxury Lane 789, Warsaw',
      latitude: 52.2297,
      longitude: 21.0122,
    },
    currentlyOccupied: false,
    parkingSpace: true,
    yardAccess: 'PRIVATE' as const,
    poolAccess: 'PRIVATE' as const,
    kitchen: 'PRIVATE' as const,
    poolFee: 0,
    disabilityFriendly: false,
    availableDateRanges: [],
    occupiedDateRanges: [],
    photoUrls: null,
    coordinates: { lat: 52.2297, lng: 21.0122 },
  },
];

describe('ApartmentsPage', () => {
  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    
    // Default mock implementations
    mockUseFetchApartments.mockReturnValue({
      apartments: mockApartments,
      loading: false,
      error: null,
    });
    
    mockUseFetchAvailableApartments.mockReturnValue({
      apartments: mockApartments,
      loading: false,
      error: null,
    });
    
    mockUseFetchApartmentsByAuction.mockReturnValue({
      apartments: [],
      loading: false,
      error: null,
    });
  });

  describe('Initial Render', () => {
    it('renders the page title and apartment count', () => {
      render(<ApartmentsPage />);
      
      expect(screen.getByText('Available Apartments')).toBeInTheDocument();
      expect(screen.getByText('3 apartments found')).toBeInTheDocument();
    });

    it('renders all apartment cards', () => {
      render(<ApartmentsPage />);
      
      expect(screen.getAllByTestId('apartment-card')).toHaveLength(3);
      expect(screen.getByText('Modern Apartment Downtown')).toBeInTheDocument();
      expect(screen.getByText('Cozy Room Near University')).toBeInTheDocument();
      expect(screen.getByText('Luxury Property with Pool')).toBeInTheDocument();
    });

    it('renders map modal component', () => {
      render(<ApartmentsPage />);
      
      expect(screen.getByTestId('apartments-map-modal')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('shows loading state when apartments are loading', () => {
      mockUseFetchApartments.mockReturnValue({
        apartments: [],
        loading: true,
        error: null,
      });

      render(<ApartmentsPage />);
      
      expect(screen.getByText('Searching for apartments...')).toBeInTheDocument();
      expect(screen.getAllByTestId('apartment-card-skeleton')).toHaveLength(6);
    });

    it('disables filters when loading', () => {
      mockUseFetchApartments.mockReturnValue({
        apartments: [],
        loading: true,
        error: null,
      });

      render(<ApartmentsPage />);
      
      const searchInput = screen.getByPlaceholderText('Search title/description…');
      expect(searchInput).toBeDisabled();
    });
  });

  describe('Error State', () => {
    it('shows error message when fetch fails', () => {
      mockUseFetchApartments.mockReturnValue({
        apartments: [],
        loading: false,
        error: 'Failed to fetch apartments',
      });

      render(<ApartmentsPage />);
      
      expect(screen.getByText('Failed to load apartments')).toBeInTheDocument();
      expect(screen.getByText('We\'re experiencing some technical difficulties. Please try again later.')).toBeInTheDocument();
    });
  });

  describe('Search and Filtering', () => {
    it('filters apartments by search text in title', async () => {
      const user = userEvent.setup();
      render(<ApartmentsPage />);
      
      const searchInput = screen.getByPlaceholderText('Search title/description…');
      await user.type(searchInput, 'Modern');
      
      await waitFor(() => {
        expect(screen.getByText('1 apartment found')).toBeInTheDocument();
        expect(screen.getByText('Modern Apartment Downtown')).toBeInTheDocument();
        expect(screen.queryByText('Cozy Room Near University')).not.toBeInTheDocument();
      });
    });

    it('filters apartments by search text in description', async () => {
      const user = userEvent.setup();
      render(<ApartmentsPage />);
      
      const searchInput = screen.getByPlaceholderText('Search title/description…');
      await user.type(searchInput, 'students');
      
      await waitFor(() => {
        expect(screen.getByText('1 apartment found')).toBeInTheDocument();
        expect(screen.getByText('Cozy Room Near University')).toBeInTheDocument();
      });
    });

    it('filters apartments by city', async () => {
      const user = userEvent.setup();
      render(<ApartmentsPage />);
      
      const cityInput = screen.getByPlaceholderText('City (partial match)');
      await user.type(cityInput, 'Krakow');
      
      await waitFor(() => {
        expect(screen.getByText('1 apartment found')).toBeInTheDocument();
        expect(screen.getByText('Cozy Room Near University')).toBeInTheDocument();
      });
    });

    it('filters apartments by partial city match', async () => {
      const user = userEvent.setup();
      render(<ApartmentsPage />);
      
      const cityInput = screen.getByPlaceholderText('City (partial match)');
      await user.type(cityInput, 'War');
      
      await waitFor(() => {
        expect(screen.getByText('2 apartments found')).toBeInTheDocument();
        expect(screen.getByText('Modern Apartment Downtown')).toBeInTheDocument();
        expect(screen.getByText('Luxury Property with Pool')).toBeInTheDocument();
      });
    });

    it('filters apartments by price range', async () => {
      const user = userEvent.setup();
      render(<ApartmentsPage />);
      
      const minPriceInput = screen.getByPlaceholderText('Min price');
      const maxPriceInput = screen.getByPlaceholderText('Max price');
      
      await user.type(minPriceInput, '1000');
      await user.type(maxPriceInput, '3000');
      
      await waitFor(() => {
        expect(screen.getByText('1 apartment found')).toBeInTheDocument();
        expect(screen.getByText('Modern Apartment Downtown')).toBeInTheDocument();
      });
    });
  });

  describe('Advanced Filters', () => {
    it('shows/hides advanced filters', async () => {
      const user = userEvent.setup();
      render(<ApartmentsPage />);
      
      // Advanced filters should be hidden initially
      expect(screen.queryByText('Min rooms')).not.toBeInTheDocument();
      
      // Click to show advanced filters
      await user.click(screen.getByText('Show advanced filters'));
      
      // Advanced filters should now be visible
      expect(screen.getByPlaceholderText('Min rooms')).toBeInTheDocument();
      expect(screen.getByText('Hide advanced filters')).toBeInTheDocument();
      
      // Click to hide advanced filters
      await user.click(screen.getByText('Hide advanced filters'));
      
      // Advanced filters should be hidden again
      expect(screen.queryByText('Min rooms')).not.toBeInTheDocument();
    });

    it('filters by property type', async () => {
      const user = userEvent.setup();
      render(<ApartmentsPage />);
      
      await user.click(screen.getByText('Show advanced filters'));
      
      const propertyTypeSelect = screen.getByDisplayValue('All property types');
      await user.selectOptions(propertyTypeSelect, 'ROOM');
      
      await waitFor(() => {
        expect(screen.getByText('1 apartment found')).toBeInTheDocument();
        expect(screen.getByText('Cozy Room Near University')).toBeInTheDocument();
      });
    });

    it('filters by minimum rooms', async () => {
      const user = userEvent.setup();
      render(<ApartmentsPage />);
      
      await user.click(screen.getByText('Show advanced filters'));
      
      const roomsInput = screen.getByPlaceholderText('Min rooms');
      await user.type(roomsInput, '3');
      
      await waitFor(() => {
        expect(screen.getByText('2 apartments found')).toBeInTheDocument();
        expect(screen.getByText('Modern Apartment Downtown')).toBeInTheDocument();
        expect(screen.getByText('Luxury Property with Pool')).toBeInTheDocument();
      });
    });

    it('filters by amenities', async () => {
      const user = userEvent.setup();
      render(<ApartmentsPage />);
      
      await user.click(screen.getByText('Show advanced filters'));
      
      const furnishedCheckbox = screen.getByLabelText('Furnished');
      await user.click(furnishedCheckbox);
      
      await waitFor(() => {
        expect(screen.getByText('2 apartments found')).toBeInTheDocument();
        expect(screen.getByText('Modern Apartment Downtown')).toBeInTheDocument();
        expect(screen.getByText('Luxury Property with Pool')).toBeInTheDocument();
      });
    });

    it('filters by multiple amenities', async () => {
      const user = userEvent.setup();
      render(<ApartmentsPage />);
      
      await user.click(screen.getByText('Show advanced filters'));
      
      const furnishedCheckbox = screen.getByLabelText('Furnished');
      const parkingCheckbox = screen.getByLabelText('Parking');
      
      await user.click(furnishedCheckbox);
      await user.click(parkingCheckbox);
      
      await waitFor(() => {
        expect(screen.getByText('2 apartments found')).toBeInTheDocument();
        expect(screen.getByText('Modern Apartment Downtown')).toBeInTheDocument();
        expect(screen.getByText('Luxury Property with Pool')).toBeInTheDocument();
      });
    });
  });

  describe('Sorting', () => {
    it('sorts apartments by price ascending', async () => {
      const user = userEvent.setup();
      render(<ApartmentsPage />);
      
      // Click sort button to open dropdown
      await user.click(screen.getByText(/Sort:/));
      
      // Click price low to high
      await user.click(screen.getByText('Price (low to high)'));
      
      await waitFor(() => {
        const apartmentCards = screen.getAllByTestId('apartment-card');
        const prices = apartmentCards.map(card => 
          parseInt(card.querySelector('[data-testid="price"]')?.textContent || '0')
        );
        expect(prices).toEqual([800, 2500, 5000]);
      });
    });

    it('sorts apartments by price descending', async () => {
      const user = userEvent.setup();
      render(<ApartmentsPage />);
      
      await user.click(screen.getByText(/Sort:/));
      await user.click(screen.getByText('Price (high to low)'));
      
      await waitFor(() => {
        const apartmentCards = screen.getAllByTestId('apartment-card');
        const prices = apartmentCards.map(card => 
          parseInt(card.querySelector('[data-testid="price"]')?.textContent || '0')
        );
        expect(prices).toEqual([5000, 2500, 800]);
      });
    });

    it('sorts apartments by size ascending', async () => {
      const user = userEvent.setup();
      render(<ApartmentsPage />);
      
      await user.click(screen.getByText(/Sort:/));
      await user.click(screen.getByText('Size (small to large)'));
      
      await waitFor(() => {
        const apartmentCards = screen.getAllByTestId('apartment-card');
        const sizes = apartmentCards.map(card => 
          parseInt(card.querySelector('[data-testid="size"]')?.textContent || '0')
        );
        expect(sizes).toEqual([25, 75, 150]);
      });
    });
  });

  describe('Filter Management', () => {
    it('shows active filter count', async () => {
      const user = userEvent.setup();
      render(<ApartmentsPage />);
      
      // Initially no active filters
      expect(screen.queryByTestId('active-filter-count')).not.toBeInTheDocument();
      
      // Add a search filter
      const searchInput = screen.getByPlaceholderText('Search title/description…');
      await user.type(searchInput, 'Modern');
      
      await waitFor(() => {
        expect(screen.getByTestId('active-filter-count')).toHaveTextContent('1');
      });
    });

    it('clears all filters', async () => {
      const user = userEvent.setup();
      render(<ApartmentsPage />);
      
      // Add some filters
      const searchInput = screen.getByPlaceholderText('Search title/description…');
      await user.type(searchInput, 'Modern');
      const cityInput = screen.getByPlaceholderText('City (partial match)');
      await user.type(cityInput, 'Warsaw');
      await waitFor(() => {
        expect(screen.getByTestId('active-filter-count')).toHaveTextContent('2');
      });
      // Clear all filters
      await user.click(screen.getByText('Clear all filters'));
      await waitFor(() => {
        expect(screen.getByText('3 apartments found')).toBeInTheDocument();
        expect(searchInput).toHaveValue('');
        expect(cityInput).toHaveValue('');
      });
    });
  });

  describe('Date Range Filtering', () => {
    it('switches to available apartments hook when date range is selected', async () => {
      const user = userEvent.setup();
      render(<ApartmentsPage />);
      
      await user.click(screen.getByText('Show advanced filters'));
      
      // Select a date range
      await user.click(screen.getByTestId('select-date-range'));
      
      await waitFor(() => {
        expect(mockUseFetchAvailableApartments).toHaveBeenCalledWith('2024-01-01', '2024-01-31');
      });
    });

    it('clears date range', async () => {
      const user = userEvent.setup();
      render(<ApartmentsPage />);
      
      await user.click(screen.getByText('Show advanced filters'));
      
      // Select then clear date range
      await user.click(screen.getByTestId('select-date-range'));
      await user.click(screen.getByText('Clear date range'));
      
      await waitFor(() => {
        // Should go back to using all apartments
        expect(mockUseFetchApartments).toHaveBeenCalled();
      });
    });
  });

  describe('Auction Filtering', () => {
    it('switches to auction hook when auction filters are selected', async () => {
      const user = userEvent.setup();
      render(<ApartmentsPage />);
      
      await user.click(screen.getByText('Show advanced filters'));
      
      const upcomingCheckbox = screen.getByLabelText('Upcoming');
      await user.click(upcomingCheckbox);
      
      await waitFor(() => {
        expect(mockUseFetchApartmentsByAuction).toHaveBeenCalledWith(true, false);
      });
    });

    it('handles both auction filters', async () => {
      const user = userEvent.setup();
      render(<ApartmentsPage />);
      
      await user.click(screen.getByText('Show advanced filters'));
      
      const upcomingCheckbox = screen.getByLabelText('Upcoming');
      const completedCheckbox = screen.getByLabelText('Completed');
      
      await user.click(upcomingCheckbox);
      await user.click(completedCheckbox);
      
      await waitFor(() => {
        expect(mockUseFetchApartmentsByAuction).toHaveBeenCalledWith(true, true);
      });
    });
  });

  describe('Empty States', () => {
    it('shows empty state when no apartments match filters', async () => {
      const user = userEvent.setup();
      render(<ApartmentsPage />);
      
      // Apply a filter that matches no apartments
      const searchInput = screen.getByPlaceholderText('Search title/description…');
      await user.type(searchInput, 'nonexistent apartment');
      
      await waitFor(() => {
        expect(screen.getByText('No apartments match your filters')).toBeInTheDocument();
        expect(screen.getByText('Try adjusting your search criteria or clearing some filters')).toBeInTheDocument();
      });
    });

    it('clears filters from empty state', async () => {
      const user = userEvent.setup();
      render(<ApartmentsPage />);
      
      // Apply filter that matches nothing
      const searchInput = screen.getByPlaceholderText('Search title/description…');
      await user.type(searchInput, 'nonexistent');
      
      await waitFor(() => {
        expect(screen.getByText('No apartments match your filters')).toBeInTheDocument();
      });
      
      // Click clear filters button in empty state
      const clearButtons = screen.getAllByText('Clear all filters');
      await user.click(clearButtons[clearButtons.length - 1]); // Click the one in empty state
      
      await waitFor(() => {
        expect(screen.getByText('3 apartments found')).toBeInTheDocument();
        expect(searchInput).toHaveValue('');
      });
    });
  });

  describe('Accessibility and Links', () => {
    it('wraps apartment cards in links', () => {
      render(<ApartmentsPage />);
      
      const apartmentLinks = screen.getAllByRole('link');
      expect(apartmentLinks).toHaveLength(3);
      expect(apartmentLinks[0]).toHaveAttribute('href', '/apartment/1');
      expect(apartmentLinks[1]).toHaveAttribute('href', '/apartment/2');
      expect(apartmentLinks[2]).toHaveAttribute('href', '/apartment/3');
    });

    it('maintains focus management for sort dropdown', async () => {
      const user = userEvent.setup();
      render(<ApartmentsPage />);
      
      const sortButton = screen.getByText(/Sort:/);
      await user.click(sortButton);
      
      // Dropdown should be visible
      expect(screen.getByText('Price (low to high)')).toBeInTheDocument();
    });
  });

  describe('Complex Filter Combinations', () => {
    it('combines multiple filters correctly', async () => {
      const user = userEvent.setup();
      render(<ApartmentsPage />);
      
      // Add city filter
      const cityInput = screen.getByPlaceholderText('City (partial match)');
      await user.type(cityInput, 'Warsaw');
      
      // Add price filter
      const maxPriceInput = screen.getByPlaceholderText('Max price');
      await user.type(maxPriceInput, '3000');
      
      // Show advanced filters and add amenity filter
      await user.click(screen.getByText('Show advanced filters'));
      const furnishedCheckbox = screen.getByLabelText('Furnished');
      await user.click(furnishedCheckbox);
      
      await waitFor(() => {
        expect(screen.getByText('1 apartment found')).toBeInTheDocument();
        expect(screen.getByText('Modern Apartment Downtown')).toBeInTheDocument();
      });
    });

    it('applies sorting after filtering', async () => {
      const user = userEvent.setup();
      render(<ApartmentsPage />);
      
      // Filter to get multiple results
      const cityInput = screen.getByPlaceholderText('City (partial match)');
      await user.type(cityInput, 'Warsaw');
      
      await waitFor(() => {
        expect(screen.getByText('2 apartments found')).toBeInTheDocument();
      });
      
      // Apply sorting
      await user.click(screen.getByText(/Sort:/));
      await user.click(screen.getByText('Price (low to high)'));
      
      await waitFor(() => {
        const apartmentCards = screen.getAllByTestId('apartment-card');
        const prices = apartmentCards.map(card => 
          parseInt(card.querySelector('[data-testid="price"]')?.textContent || '0')
        );
        expect(prices).toEqual([2500, 5000]); // Only Warsaw apartments, sorted by price
      });
    });
  });
});
