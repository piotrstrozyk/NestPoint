import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import ApartmentDetailPage from '@/features/apartment/pages/apartment-page';

// Mock all the custom hooks
vi.mock('@/features/apartment/hooks/use-fetch-apartment');
vi.mock('@/features/apartment-list/hooks/use-fetch-apartment-photos');
vi.mock('@/features/apartment/hooks/use-fetch-auction');
vi.mock('@/features/apartment/hooks/use-fetch-occupied-ranges');
vi.mock('@/features/owner/hooks/use-delete-apartment');
vi.mock('@/features/owner/hooks/use-fetch-rentals');
vi.mock('@/features/booking/hooks/use-confirm-auction');
vi.mock('@/features/tenant/hooks/use-fetch-tenant-overdue');
vi.mock('next-auth/react');
vi.mock('next/navigation');
vi.mock('sonner');

// Mock all the components
vi.mock('@/core/components/calendar/calendar', () => ({
  default: ({
    onRangeChange,
    onConfirm,
    onDayClick,
  }: {
    onRangeChange?: (range: { from: Date; to: Date }) => void;
    onConfirm?: (range: { from: Date; to: Date }) => void;
    onDayClick?: (date: Date) => void;
  }) => (
    <div data-testid="day-range-picker">
      <button onClick={() => onRangeChange?.({ from: new Date('2024-06-01'), to: new Date('2024-06-07') })}>
        Select Range
      </button>
      <button onClick={() => onConfirm?.({ from: new Date('2024-06-01'), to: new Date('2024-06-07') })}>
        Confirm Range
      </button>
      <button onClick={() => onDayClick?.(new Date('2024-06-01'))}>
        Click Day
      </button>
    </div>
  )
}));

vi.mock('@/features/apartment/components/address-card', () => ({
  MapCard: ({ address }: { address: string }) => <div data-testid="map-card">{address}</div>
}));

vi.mock('@/features/apartment/components/auction-details', () => {
  interface AuctionDetailsProps {
    auctionId: number;
  }
  return {
    default: ({ auctionId }: AuctionDetailsProps) => <div data-testid="auction-details">Auction {auctionId}</div>
  };
});

vi.mock('@/features/apartment/components/create-rental-with-payment-modal', () => {
  interface CreateRentalWithPaymentModalProps {
    apartmentId: number;
  }
  return {
    default: ({ apartmentId }: CreateRentalWithPaymentModalProps) => (
      <button data-testid="create-rental-modal">Book Apartment {apartmentId}</button>
    )
  };
});

vi.mock('@/features/apartment/components/details', () => ({
  KeyDetails: ({ apartment }: { apartment: { title: string } }) => (
    <div data-testid="key-details">Details for {apartment.title}</div>
  )
}));

vi.mock('@/features/apartment/components/image-grid', () => ({
  ImageGrid: ({ apartmentTitle }: { apartmentTitle: string }) => (
    <div data-testid="image-grid">Images for {apartmentTitle}</div>
  )
}));

vi.mock('@/features/apartment/components/review-section', () => ({
  default: ({ apartmentId }: { apartmentId: number }) => (
    <div data-testid="review-section">Reviews for apartment {apartmentId}</div>
  )
}));

vi.mock('@/features/auctions/components/create-auction-form', () => {
  interface CreateAuctionFormProps {
    apartmentId: number;
    onClose: () => void;
    prefillRange?: { from: Date; to: Date };
  }
  return {
    default: ({ apartmentId, onClose, prefillRange }: CreateAuctionFormProps) => (
      <div data-testid="create-auction-form">
        <span>Create auction for {apartmentId}</span>
        {prefillRange && <span>Prefilled range</span>}
        <button onClick={onClose}>Close</button>
      </div>
    )
  };
});

// Mock implementations
const mockUseSession = vi.mocked(useSession);
const mockUseParams = vi.mocked(useParams);
const mockUseRouter = vi.mocked(useRouter);

// Import the mocked hooks
import useFetchApartment from '@/features/apartment/hooks/use-fetch-apartment';
import useFetchApartmentPhotos from '@/features/apartment-list/hooks/use-fetch-apartment-photos';
import { useFetchAuctions } from '@/features/apartment/hooks/use-fetch-auction';
import { useFetchOccupiedRanges } from '@/features/apartment/hooks/use-fetch-occupied-ranges';
import useDeleteApartment from '@/features/owner/hooks/use-delete-apartment';
import useFetchRentals from '@/features/owner/hooks/use-fetch-rentals';
import { useConfirmAuction } from '@/features/booking/hooks/use-confirm-auction';
import useFetchUserOverdueAuctionPayments from '@/features/tenant/hooks/use-fetch-tenant-overdue';
import { toast } from 'sonner';

const mockUseFetchApartment = vi.mocked(useFetchApartment);
const mockUseFetchApartmentPhotos = vi.mocked(useFetchApartmentPhotos);
const mockUseFetchAuctions = vi.mocked(useFetchAuctions);
const mockUseFetchOccupiedRanges = vi.mocked(useFetchOccupiedRanges);
const mockUseDeleteApartment = vi.mocked(useDeleteApartment);
const mockUseFetchRentals = vi.mocked(useFetchRentals);
const mockUseConfirmAuction = vi.mocked(useConfirmAuction);
const mockUseFetchUserOverdueAuctionPayments = vi.mocked(useFetchUserOverdueAuctionPayments);
const mockToast = vi.mocked(toast);

// Mock data
const mockApartment = {
  id: 1,
  title: 'Test Apartment',
  description: 'A nice test apartment',
  rentalPrice: 100,
  ownerId: 321,
  address: {
    street: '123 Test St',
    apartmentNumber: '4B',
    city: 'Test City',
    postalCode: '12345',
    country: 'Test Country',
    fullAddress: '123 Test St 4B, Test City',
    latitude: 52.2297,
    longitude: 21.0122,
  },
  size: 50,
  numberOfRooms: 2,
  numberOfBeds: 3,
  furnished: true,
  currentlyOccupied: false,
  kitchen: 'PRIVATE' as const,
  wifi: true,
  petsAllowed: true,
  parkingSpace: true,
  yardAccess: 'PRIVATE' as const,
  poolAccess: 'NONE' as const,
  disabilityFriendly: false,
  poolFee: 0,
  propertyType: 'APARTMENT' as const,
  availableDateRanges: [],
  occupiedDateRanges: [],
  photoUrls: [],
  coordinates: {
    lat: 52.2297,
    lng: 21.0122,
  },
};

const mockPhotos = ['photo1.jpg', 'photo2.jpg'];

const mockAuctions = [
  {
    id: 1,
    apartmentId: 1,
    apartmentTitle: 'Test Apartment',
    startTime: '2024-06-01T00:00:00Z',
    endTime: '2024-06-07T23:59:59Z',
    startingPrice: 100,
    minimumBidIncrement: 10,
    rentalStartDate: '2024-06-01',
    rentalEndDate: '2024-06-07',
    status: 'ACTIVE',
    maxBidders: 5,
    currentHighestBid: 120,
    currentBidderCount: 2,
    bids: [],
    resultingRentalId: null,
    active: true,
  }
];

const mockOverduePayments = [
  {
    rentalId: 1,
    apartmentId: 1,
    tenantId: 1,
    ownerId: 2,
    startDate: '2025-06-01',
    endDate: '2025-06-10',
    nights: 9,
    pricePerNight: 100,
    totalCost: 900,
    status: 'OVERDUE' as const,
    address: {
      street: 'Test',
      apartmentNumber: '1',
      city: 'Test City',
      postalCode: '12345',
      country: 'Test Country',
      fullAddress: 'Test 1, Test City',
      latitude: 0,
      longitude: 0,
    },
    apartmentOccupied: false,
    rentalFees: 0,
    isAuction: true,
    auctionPaymentConfirmed: false,
    auctionPaymentDeadline: '2025-06-01',
    auctionFineIssued: true,
    auctionFineAmount: 50,
  },
];

describe('ApartmentDetailPage', () => {
  const mockPush = vi.fn();
  const mockRefresh = vi.fn();
  const mockDeleteApartment = vi.fn();
  const mockConfirmAuction = vi.fn();
  const mockRefetch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockUseParams.mockReturnValue({ id: '1' });
mockUseRouter.mockReturnValue({
  push: mockPush,
  refresh: mockRefresh,
  back: vi.fn(),
  forward: vi.fn(),
  replace: vi.fn(),
  prefetch: vi.fn(),
});
    
    // Default mock implementations
    mockUseFetchApartment.mockReturnValue({
      apartment: mockApartment,
      loading: false,
      error: null,
      refetch: vi.fn(),
    });
mockUseFetchApartmentPhotos.mockReturnValue({
  photos: mockPhotos,
  photoObjects: mockPhotos.map((url, i) => ({ id: i + 1, url })),
  loading: false,
  error: null,
  refetch: vi.fn(),
});
mockUseFetchAuctions.mockReturnValue({
  auctions: mockAuctions,
  loading: false,
  error: null,
  refetch: mockRefetch,
});
mockUseFetchOccupiedRanges.mockReturnValue({
  availability: {
    occupiedRanges: [],
    availableRanges: [],
  },
  loading: false,
  error: null,
});
mockUseDeleteApartment.mockReturnValue({
  deleteApartment: mockDeleteApartment,
  data: undefined,
  variables: undefined,
  error: null,
  isError: false,
  isIdle: true,
  isPending: false,
  isSuccess: false,
  status: 'idle',
  mutate: vi.fn(),
  mutateAsync: vi.fn(),
  reset: vi.fn(),
  context: undefined,
  failureCount: 0,
  failureReason: null,
  isPaused: false,
  submittedAt: Date.now(),
});
    mockUseFetchRentals.mockReturnValue({
      rentals: [
        {
          id: 1,
          apartmentId: 1,
          tenantId: 123,
          ownerId: 321,
          startDate: new Date('2025-06-01'),
          endDate: new Date('2025-06-10'),
          nights: 9,
          pricePerNight: 100,
          totalCost: 900,
          status: 'PENDING',
          address: {
            street: 'Test',
            apartmentNumber: '1',
            city: 'Test City',
            postalCode: '12345',
            country: 'Test Country',
            fullAddress: 'Test 1, Test City',
            latitude: 0,
            longitude: 0,
          },
          apartmentOccupied: false,
          rentalFees: 0,
          isAuction: true,
          auctionPaymentConfirmed: false,
          auctionPaymentDeadline: '2024-06-15T00:00:00Z',
          auctionFineIssued: false,
          auctionFineAmount: 0,
        },
      ],
      loading: false,
      error: null,
    });
    mockUseConfirmAuction.mockReturnValue({
      confirmAuction: mockConfirmAuction,
      loading: false,
      error: null,
      data: undefined,
    });
    mockUseFetchUserOverdueAuctionPayments.mockReturnValue({
      payments: [],
      loading: false,
      error: null,
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Owner View', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: {
          user: {
            id: 321,
            role: 'OWNER',
          },
          expires: '2099-01-01T00:00:00.000Z',
        },
        status: 'authenticated',
        update: vi.fn(),
      });
    });

    it('renders apartment details for owner', () => {
      render(<ApartmentDetailPage />);
      
      expect(screen.getByText('Test Apartment')).toBeInTheDocument();
      expect(screen.getByText('A nice test apartment')).toBeInTheDocument();
      // Use function matcher to match split text '100 zł'
      expect(
        screen.getByText((content, node) =>
          node?.textContent?.replace(/\s+/g, '') === '100zł'
        )
      ).toBeInTheDocument();
      expect(screen.getByTestId('image-grid')).toBeInTheDocument();
      expect(screen.getByTestId('key-details')).toBeInTheDocument();
    });

    it('shows owner-specific buttons', () => {
      render(<ApartmentDetailPage />);
      
      expect(screen.getByText('Start Auction')).toBeInTheDocument();
      expect(screen.getByText('Edit Apartment')).toBeInTheDocument();
    });

    it('shows delete button when no auctions or rentals exist', () => {
      mockUseFetchAuctions.mockReturnValue({
        auctions: [],
        loading: false,
        error: null,
        refetch: mockRefetch,
      });
      mockUseFetchRentals.mockReturnValue({
        rentals: [],
        loading: false,
        error: null,
      });

      render(<ApartmentDetailPage />);
      
      expect(screen.getByText('Delete')).toBeInTheDocument();
    });

    it('does not show delete button when auctions exist', () => {
      render(<ApartmentDetailPage />);
      
      expect(screen.queryByText('Delete')).not.toBeInTheDocument();
    });

    it('opens auction creation modal when Start Auction is clicked', async () => {
      render(<ApartmentDetailPage />);
      
      fireEvent.click(screen.getByText('Start Auction'));
      
      await waitFor(() => {
        expect(screen.getByTestId('create-auction-form')).toBeInTheDocument();
      });
    });

    it('opens edit apartment page when Edit button is clicked', () => {
      render(<ApartmentDetailPage />);
      
      fireEvent.click(screen.getByText('Edit Apartment'));
      
      expect(mockPush).toHaveBeenCalledWith('/edit-apartment/1');
    });

    it('handles delete apartment flow', async () => {
      mockUseFetchAuctions.mockReturnValue({
        auctions: [],
        loading: false,
        error: null,
        refetch: mockRefetch,
      });
      mockUseFetchRentals.mockReturnValue({
        rentals: [],
        loading: false,
        error: null,
      });

      render(<ApartmentDetailPage />);
      // Click delete button
      fireEvent.click(screen.getByText('Delete'));
      // Check if confirmation modal appears
      await waitFor(() => {
        // There are two elements with 'Delete Apartment', so check both exist
        expect(screen.getAllByText('Delete Apartment').length).toBeGreaterThan(1);
      });
      // Type apartment title for confirmation
      const confirmInput = screen.getByPlaceholderText('Type apartment title to confirm');
      fireEvent.change(confirmInput, { target: { value: 'Test Apartment' } });
      // Click confirm delete (use getByRole for the button)
      fireEvent.click(screen.getByRole('button', { name: 'Delete Apartment' }));
      expect(mockDeleteApartment).toHaveBeenCalledWith(1);
    });
  });

  describe('Tenant View', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: {
          user: {
            id: 123,
            role: 'TENANT',
          },
          expires: '2099-01-01T00:00:00.000Z',
        },
        status: 'authenticated',
        update: vi.fn(),
      });
    });

    it('renders apartment details for tenant', () => {
      render(<ApartmentDetailPage />);
      
      expect(screen.getByText('Test Apartment')).toBeInTheDocument();
      expect(screen.getByTestId('create-rental-modal')).toBeInTheDocument();
    });

    it('does not show owner-specific buttons', () => {
      render(<ApartmentDetailPage />);
      
      expect(screen.queryByText('Start Auction')).not.toBeInTheDocument();
      expect(screen.queryByText('Edit Apartment')).not.toBeInTheDocument();
      expect(screen.queryByText('Delete')).not.toBeInTheDocument();
    });

    it('shows unpaid auction rental warning', () => {
      render(<ApartmentDetailPage />);
      
      expect(screen.getByText('You have unpaid rentals')).toBeInTheDocument();
      expect(screen.getByText('Pay for Rental')).toBeInTheDocument();
    });

    it('shows overdue payment warning when tenant has overdue payments', () => {
      mockUseFetchUserOverdueAuctionPayments.mockReturnValue({
        payments: mockOverduePayments,
        loading: false,
        error: null,
      });

      render(<ApartmentDetailPage />);
      
      expect(screen.getByText('You have overdue auction payments')).toBeInTheDocument();
    });

    it('disables booking when tenant has overdue payments', () => {
      mockUseFetchUserOverdueAuctionPayments.mockReturnValue({
        payments: mockOverduePayments,
        loading: false,
        error: null,
      });

      render(<ApartmentDetailPage />);
      
      const bookingSection = screen.getByTestId('create-rental-modal').parentElement;
      expect(bookingSection).toHaveClass('opacity-60', 'pointer-events-none');
    });

    it('opens auction payment modal when Pay for Rental is clicked', async () => {
      render(<ApartmentDetailPage />);
      
      fireEvent.click(screen.getByText('Pay for Rental'));
      
      await waitFor(() => {
        expect(screen.getByText('Auction Payment')).toBeInTheDocument();
      });
    });

    it('handles auction payment submission', async () => {
      mockConfirmAuction.mockResolvedValue({ success: true });
      
      render(<ApartmentDetailPage />);
      
      // Open payment modal
      fireEvent.click(screen.getByText('Pay for Rental'));
      
      await waitFor(() => {
        expect(screen.getByText('Auction Payment')).toBeInTheDocument();
      });
      
      // Fill in card number
      const cardInput = screen.getByPlaceholderText('Enter 10-digit card number');
      fireEvent.change(cardInput, { target: { value: '1234567890' } });
      
      // Submit payment
      fireEvent.click(screen.getByText('Pay Now'));
      
      await waitFor(() => {
        expect(mockConfirmAuction).toHaveBeenCalledWith({
          rentalId: 1,
          cardNumber: '1234567890'
        });
      });
      
      expect(mockToast.success).toHaveBeenCalledWith('Auction payment confirmed!');
      expect(mockRefresh).toHaveBeenCalled();
    });

    it('handles auction payment failure', async () => {
      mockConfirmAuction.mockResolvedValue({ 
        success: false, 
        message: 'Payment declined' 
      });
      
      render(<ApartmentDetailPage />);
      
      fireEvent.click(screen.getByText('Pay for Rental'));
      
      await waitFor(() => {
        expect(screen.getByText('Auction Payment')).toBeInTheDocument();
      });
      
      const cardInput = screen.getByPlaceholderText('Enter 10-digit card number');
      fireEvent.change(cardInput, { target: { value: '1234567890' } });
      
      fireEvent.click(screen.getByText('Pay Now'));
      
      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('Payment declined');
      });
    });
  });

  describe('Admin View', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: {
          user: {
            id: 231,
            role: 'ADMIN',
          },
          expires: '2099-01-01T00:00:00.000Z',
        },
        status: 'authenticated',
        update: vi.fn(),
      });
    });

    it('shows admin-specific buttons', () => {
      render(<ApartmentDetailPage />);
      
      expect(screen.getByText('Edit Apartment')).toBeInTheDocument();
    });

    it('can delete apartment as admin', () => {
      mockUseFetchAuctions.mockReturnValue({
        auctions: [],
        loading: false,
        error: null,
        refetch: mockRefetch,
      });
      mockUseFetchRentals.mockReturnValue({
        rentals: [],
        loading: false,
        error: null,
      });

      render(<ApartmentDetailPage />);
      
      expect(screen.getByText('Delete')).toBeInTheDocument();
    });
  });

  describe('Auction Functionality', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: {
          user: {
            id: 321,
            role: 'TENANT',
          },
          expires: '2099-01-01T00:00:00.000Z',
        },
        status: 'authenticated',
        update: vi.fn(),
      });
    });

    it('shows active auction button for owner', () => {
      mockUseSession.mockReturnValue({
        data: {
          user: {
            id: 321,
            role: 'OWNER',
          },
          expires: '2099-01-01T00:00:00.000Z',
        },
        status: 'authenticated',
        update: vi.fn(),
      });

      render(<ApartmentDetailPage />);
      
      expect(screen.getByText('See Active Auction')).toBeInTheDocument();
    });

    it('opens auction details modal when See Active Auction is clicked', async () => {
      mockUseSession.mockReturnValue({
        data: {
          user: {
            id: 321,
            role: 'OWNER',
          },
          expires: '2099-01-01T00:00:00.000Z',
        },
        status: 'authenticated',
        update: vi.fn(),
      });

      render(<ApartmentDetailPage />);
      
      fireEvent.click(screen.getByText('See Active Auction'));
      
      await waitFor(() => {
        expect(screen.getByTestId('auction-details')).toBeInTheDocument();
      });
    });

    it('handles calendar interactions', async () => {
      render(<ApartmentDetailPage />);
      
      // Click on calendar day
      fireEvent.click(screen.getByText('Click Day'));
      
      // Should open auction details modal since there's an active auction
      await waitFor(() => {
        expect(screen.getByTestId('auction-details')).toBeInTheDocument();
      });
    });
  });

  describe('Calendar Integration', () => {
    it('prefills auction range when owner selects dates', async () => {
      mockUseSession.mockReturnValue({
        data: {
          user: {
            id: 321,
            role: 'OWNER',
          },
          expires: '2099-01-01T00:00:00.000Z',
        },
        status: 'authenticated',
        update: vi.fn(),
      });

      render(<ApartmentDetailPage />);
      
      // Confirm range selection
      fireEvent.click(screen.getByText('Confirm Range'));
      
      await waitFor(() => {
        expect(screen.getByTestId('create-auction-form')).toBeInTheDocument();
        expect(screen.getByText('Prefilled range')).toBeInTheDocument();
      });
    });
  });

  describe('Form Validation', () => {
    it('validates auction payment card number', async () => {
      mockUseSession.mockReturnValue({
        data: {
          user: {
            id: 123,
            role: 'TENANT',
          },
          expires: '2099-01-01T00:00:00.000Z',
        },
        status: 'authenticated',
        update: vi.fn(),
      });
      render(<ApartmentDetailPage />);
      
      // Open payment modal
      fireEvent.click(screen.getByText('Pay for Rental'));
      
      await waitFor(() => {
        expect(screen.getByText('Auction Payment')).toBeInTheDocument();
      });
      
      // Try to submit with invalid card number
      const cardInput = screen.getByPlaceholderText('Enter 10-digit card number');
      fireEvent.change(cardInput, { target: { value: '123' } });
      
      fireEvent.click(screen.getByText('Pay Now'));
    });

    it('validates delete confirmation text', async () => {
      mockUseSession.mockReturnValue({
        data: {
          user: {
            id: 'owner123',
            role: 'OWNER',
          },
          expires: '2099-01-01T00:00:00.000Z',
        },
        status: 'authenticated',
        update: vi.fn(),
      });
      mockUseFetchAuctions.mockReturnValue({
        auctions: [],
        loading: false,
        error: null,
        refetch: mockRefetch,
      });
      mockUseFetchRentals.mockReturnValue({
        rentals: [],
        loading: false,
        error: null,
      });
      
      mockUseSession.mockReturnValue({
        data: {
          user: {
            id: 321,
            role: 'OWNER',
          },
          expires: '2099-01-01T00:00:00.000Z',
        },
        status: 'authenticated',
        update: vi.fn(),
      });

      render(<ApartmentDetailPage />);
      
      fireEvent.click(screen.getByText('Delete'));
      
      await waitFor(() => {
        // There are two elements with 'Delete Apartment', so check both exist
        expect(screen.getAllByText('Delete Apartment').length).toBeGreaterThan(1);
      });
      // Try to delete with wrong confirmation text
      const confirmInput = screen.getByPlaceholderText('Type apartment title to confirm');
      fireEvent.change(confirmInput, { target: { value: 'Wrong Title' } });
      
      const deleteButton = screen.getByRole('button', { name: 'Delete Apartment' });
      expect(deleteButton).toHaveClass('opacity-50');
    });
  });
});
