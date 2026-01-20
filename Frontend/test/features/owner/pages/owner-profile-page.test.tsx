import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import OwnerProfilePage from '@/features/owner/pages/owner-profile-page';
import useFetchOwner from '@/features/owner/hooks/use-fetch-owner-details';
import useFetchOwnerRentals from '@/features/owner/hooks/use-fetch-owner-rentals';
import useFetchRentals from '@/features/owner/hooks/use-fetch-rentals';
import { Session } from 'next-auth';

// Mock the dependencies
vi.mock('next-auth/react');
vi.mock('next/navigation');
vi.mock('@/features/owner/hooks/use-fetch-owner-details');
vi.mock('@/features/owner/hooks/use-fetch-owner-rentals');
vi.mock('@/features/owner/hooks/use-fetch-rentals');
vi.mock('@/core/lib/utils/format-date');
vi.mock('@/features/apartment-list/components/apartment-card');
vi.mock('@/core/components/calendar/calendar');
vi.mock('next/link', () => ({
  default: function MockLink({ children, href, ...props }: React.PropsWithChildren<{ href: string }>) {
    return <a href={href} {...props}>{children}</a>;
  }
}));

const mockUseSession = vi.mocked(useSession);
const mockUseRouter = vi.mocked(useRouter);
const mockUseFetchOwner = vi.mocked(useFetchOwner);
const mockUseFetchOwnerRentals = vi.mocked(useFetchOwnerRentals);
const mockUseFetchRentals = vi.mocked(useFetchRentals);

const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
  prefetch: vi.fn(),
};

const mockOwnerData = {
  id: 1,
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  phone: '+1234567890',
  username: 'johndoe',
  roles: ['OWNER'],
  ownedApartments: [
    { id: 1, title: 'Luxury Apartment Downtown' },
    { id: 2, title: 'Cozy Studio' },
  ],
  rentals: [],
};

const mockRentalsData = [
  {
    id: 1,
    apartmentId: 1,
    tenantId: 101,
    ownerId: 1,
    startDate: new Date('2024-01-15'),
    endDate: new Date('2024-01-20'),
    totalCost: 500,
    pricePerNight: 100,
    nights: 5,
    status: 'ACTIVE' as const,
    address: {
      city: 'New York',
      country: 'USA',
      street: 'Main St',
      apartmentNumber: '101A',
      postalCode: '10001',
      fullAddress: '101A Main St, New York, NY 10001, USA',
      region: 'NY',
      state: 'NY',
      latitude: 0,
      longitude: 0,
    },
    apartmentOccupied: false,
    rentalFees: 0,
  },
  {
    id: 2,
    apartmentId: 2,
    tenantId: 102,
    ownerId: 1,
    startDate: new Date('2024-02-01'),
    endDate: new Date('2024-02-05'),
    totalCost: 400,
    pricePerNight: 100,
    nights: 4,
    status: 'PENDING' as const,
    address: {
      city: 'Boston',
      country: 'USA',
      street: 'Beacon St',
      apartmentNumber: '202B',
      postalCode: '02108',
      fullAddress: '202B Beacon St, Boston, MA 02108, USA',
      region: 'MA',
      state: 'MA',
      latitude: 0,
      longitude: 0,
    },
    apartmentOccupied: false,
    rentalFees: 0,
  },
];

describe('OwnerProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseRouter.mockReturnValue(mockRouter);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Authentication and Authorization', () => {

    it('should render dashboard when user is authenticated as OWNER', async () => {
      mockUseSession.mockReturnValue({
        data: { user: { id: 1, role: 'OWNER' } } as Session,
        status: 'authenticated' as const,
        update: vi.fn(),
      });

      mockUseFetchOwner.mockReturnValue({
        owner: mockOwnerData,
        loading: false,
        error: null,
      });

      mockUseFetchOwnerRentals.mockReturnValue({
        rentals: [],
        loading: false,
        error: null,
      });

      mockUseFetchRentals.mockReturnValue({
        rentals: [],
        loading: false,
        error: null,
      });

      render(<OwnerProfilePage />);
      
      await waitFor(() => {
        expect(screen.getByText('Owner Dashboard')).toBeInTheDocument();
      });
    });
  });

  describe('Profile Information Display', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: { user: { id: 1, role: 'OWNER' } } as Session,
        status: 'authenticated' as const,
        update: vi.fn(),
      });

      mockUseFetchOwner.mockReturnValue({
        owner: mockOwnerData,
        loading: false,
        error: null,
      });

      mockUseFetchOwnerRentals.mockReturnValue({
        rentals: mockRentalsData,
        loading: false,
        error: null,
      });

      mockUseFetchRentals.mockReturnValue({
        rentals: mockRentalsData,
        loading: false,
        error: null,
      });
    });

    it('should display owner name and verification status', () => {
      render(<OwnerProfilePage />);
      
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Verified Owner')).toBeInTheDocument();
    });

    it('should display owner contact information', () => {
      render(<OwnerProfilePage />);
      
      expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
      expect(screen.getByText('+1234567890')).toBeInTheDocument();
    });

    it('should handle missing phone number gracefully', () => {
      const ownerWithoutPhone = { ...mockOwnerData, phone: '' };
      mockUseFetchOwner.mockReturnValue({
        owner: ownerWithoutPhone,
        loading: false,
        error: null,
      });

      render(<OwnerProfilePage />);
      
      expect(screen.getByText('No phone number provided')).toBeInTheDocument();
    });
  });

  describe('Tab Navigation', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: { user: { id: 1, role: 'OWNER' } } as Session,
        status: 'authenticated' as const,
        update: vi.fn(),
      });

      mockUseFetchOwner.mockReturnValue({
        owner: mockOwnerData,
        loading: false,
        error: null,
      });

      mockUseFetchOwnerRentals.mockReturnValue({
        rentals: mockRentalsData,
        loading: false,
        error: null,
      });

      mockUseFetchRentals.mockReturnValue({
        rentals: mockRentalsData,
        loading: false,
        error: null,
      });
    });

    it('should have apartments tab active by default', () => {
      render(<OwnerProfilePage />);
      
      const apartmentsTab = screen.getByText('My Properties');
      expect(apartmentsTab.closest('button')).toHaveClass('border-primary', 'text-primary');
    });

    it('should switch to rentals tab when clicked', () => {
      render(<OwnerProfilePage />);
      
      const rentalsTab = screen.getByText('My Rentals');
      fireEvent.click(rentalsTab);
      
      expect(rentalsTab.closest('button')).toHaveClass('border-primary', 'text-primary');
      expect(screen.getByText('My Rental Requests')).toBeInTheDocument();
    });

    it('should switch to calendar tab when clicked', () => {
      render(<OwnerProfilePage />);
      
      const calendarTab = screen.getAllByText('Calendar')[0]; // First Calendar tab
      fireEvent.click(calendarTab);
      
      expect(calendarTab.closest('button')).toHaveClass('border-primary', 'text-primary');
      expect(screen.getByText('Rental Calendar')).toBeInTheDocument();
    });
  });

  describe('Apartments Tab', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: { user: { id: 1, role: 'OWNER' } } as Session,
        status: 'authenticated' as const,
        update: vi.fn(),
      });

      mockUseFetchOwner.mockReturnValue({
        owner: mockOwnerData,
        loading: false,
        error: null,
      });

      mockUseFetchOwnerRentals.mockReturnValue({
        rentals: [],
        loading: false,
        error: null,
      });

      mockUseFetchRentals.mockReturnValue({
        rentals: [],
        loading: false,
        error: null,
      });
    });

    it('should display Add Property button', () => {
      render(<OwnerProfilePage />);
      
      const addButton = screen.getByText('Add Property');
      expect(addButton).toBeInTheDocument();
      expect(addButton.closest('a')).toHaveAttribute('href', '/add-apartment');
    });

    it('should show message when no properties exist', () => {
      const ownerWithoutApartments = { ...mockOwnerData, ownedApartments: [] };
      mockUseFetchOwner.mockReturnValue({
        owner: ownerWithoutApartments,
        loading: false,
        error: null,
      });

      render(<OwnerProfilePage />);
      
      expect(screen.getByText("You don't have any properties yet. Add your first property to start hosting!")).toBeInTheDocument();
    });
  });

  describe('Rentals Tab', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: { user: { id: 1, role: 'OWNER' } } as Session,
        status: 'authenticated' as const,
        update: vi.fn(),
      });

      mockUseFetchOwner.mockReturnValue({
        owner: mockOwnerData,
        loading: false,
        error: null,
      });

      mockUseFetchRentals.mockReturnValue({
        rentals: mockRentalsData,
        loading: false,
        error: null,
      });
    });

    it('should display rental requests when data is loaded', () => {
      mockUseFetchOwnerRentals.mockReturnValue({
        rentals: mockRentalsData,
        loading: false,
        error: null,
      });

      render(<OwnerProfilePage />);
      
      // Switch to rentals tab
      fireEvent.click(screen.getByText('My Rentals'));
      
      expect(screen.getByText('#1')).toBeInTheDocument();
      expect(screen.getByText('#2')).toBeInTheDocument();
      expect(screen.getByText('Tenant #101')).toBeInTheDocument();
      expect(screen.getByText('$500')).toBeInTheDocument();
    });

    it('should show error state for rentals', () => {
      mockUseFetchOwnerRentals.mockReturnValue({
        rentals: [],
        loading: false,
        error: new Error('Failed to fetch rentals'),
      });

      render(<OwnerProfilePage />);
      
      // Switch to rentals tab
      fireEvent.click(screen.getByText('My Rentals'));
      
      expect(screen.getByText('Error loading rental requests')).toBeInTheDocument();
    });

    it('should filter rentals by status', () => {
      mockUseFetchOwnerRentals.mockReturnValue({
        rentals: mockRentalsData,
        loading: false,
        error: null,
      });

      render(<OwnerProfilePage />);
      
      // Switch to rentals tab
      fireEvent.click(screen.getByText('My Rentals'));
      
      // Filter by PENDING status
      const statusFilter = screen.getByDisplayValue('All Rentals');
      fireEvent.change(statusFilter, { target: { value: 'PENDING' } });
      
      // Should only show pending rental
      expect(screen.getByText('#2')).toBeInTheDocument();
      expect(screen.queryByText('#1')).not.toBeInTheDocument();
    });

    it('should show no rentals message when filtered results are empty', () => {
      mockUseFetchOwnerRentals.mockReturnValue({
        rentals: mockRentalsData,
        loading: false,
        error: null,
      });

      render(<OwnerProfilePage />);
      
      // Switch to rentals tab
      fireEvent.click(screen.getByText('My Rentals'));
      
      // Filter by COMPLETED status (none exist in mock data)
      const statusFilter = screen.getByDisplayValue('All Rentals');
      fireEvent.change(statusFilter, { target: { value: 'COMPLETED' } });
      
      expect(screen.getByText('No completed rental requests found.')).toBeInTheDocument();
    });
  });

  describe('Calendar Tab', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: { user: { id: 1, role: 'OWNER' } } as Session,
        status: 'authenticated' as const,
        update: vi.fn(),
      });

      mockUseFetchOwner.mockReturnValue({
        owner: mockOwnerData,
        loading: false,
        error: null,
      });

      mockUseFetchOwnerRentals.mockReturnValue({
        rentals: [],
        loading: false,
        error: null,
      });

      mockUseFetchRentals.mockReturnValue({
        rentals: mockRentalsData,
        loading: false,
        error: null,
      });
    });

    it('should show message when no apartment is selected', () => {
      render(<OwnerProfilePage />);
      
      // Switch to calendar tab
      fireEvent.click(screen.getAllByText('Calendar')[0]);
      
      expect(screen.getByText('Select an apartment to view its rental calendar.')).toBeInTheDocument();
    });

    it('should show error state for calendar rentals', () => {
      mockUseFetchRentals.mockReturnValue({
        rentals: [],
        loading: false,
        error: new Error('Failed to fetch rentals'),
      });

      render(<OwnerProfilePage />);
      
      // Switch to calendar tab
      fireEvent.click(screen.getAllByText('Calendar')[0]);
      
      expect(screen.getByText('Error loading rentals for calendar')).toBeInTheDocument();
    });
  });

  describe('Data Fetching Hooks', () => {
    it('should call useFetchOwner with correct owner ID', () => {
      mockUseSession.mockReturnValue({
        data: { user: { id: 123, role: 'OWNER' } } as Session,
        status: 'authenticated' as const,
        update: vi.fn(),
      });

      mockUseFetchOwner.mockReturnValue({
        owner: mockOwnerData,
        loading: false,
        error: null,
      });

      mockUseFetchOwnerRentals.mockReturnValue({
        rentals: [],
        loading: false,
        error: null,
      });

      mockUseFetchRentals.mockReturnValue({
        rentals: [],
        loading: false,
        error: null,
      });

      render(<OwnerProfilePage />);
      
      expect(mockUseFetchOwner).toHaveBeenCalledWith(123);
      expect(mockUseFetchOwnerRentals).toHaveBeenCalledWith(123);
      expect(mockUseFetchRentals).toHaveBeenCalled();
    });
  });
});
