import { describe, it, expect, vi, beforeEach, afterEach, Mock } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useSession, type SessionContextValue } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import AdminPanelPage from '@/features/admin-panel/pages/admin-panel-page';

// Mock the hooks
vi.mock('next-auth/react', () => ({
  useSession: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

vi.mock('@/core/lib/utils/format-date', () => ({
  formatDate: vi.fn((date) => new Date(date).toLocaleDateString()),
}));

vi.mock('@/features/add-apartment/hooks/use-fetch-owners', () => ({
  default: vi.fn(),
}));

vi.mock('@/features/apartment/hooks/use-fetch-tenants', () => ({
  default: vi.fn(),
}));

vi.mock('@/features/owner/hooks/use-fetch-rentals', () => ({
  default: vi.fn(),
}));

vi.mock('@/features/admin-panel/hooks/use-delete-user', () => ({
  default: vi.fn(),
}));

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    ...props
  }: React.PropsWithChildren<React.AnchorHTMLAttributes<HTMLAnchorElement>> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

import useFetchOwners from '@/features/add-apartment/hooks/use-fetch-owners';
import useFetchTenants from '@/features/apartment/hooks/use-fetch-tenants';
import useFetchRentals from '@/features/owner/hooks/use-fetch-rentals';
import useDeleteUser from '@/features/admin-panel/hooks/use-delete-user';

const mockOwners = [
  {
    id: 1,
    firstName: 'John',
    lastName: 'Doe',
    username: 'johndoe',
    email: 'john@example.com',
    phone: '+1234567890',
    ownedApartments: [{ id: 1 }, { id: 2 }],
  },
  {
    id: 2,
    firstName: 'Jane',
    lastName: 'Smith',
    username: 'janesmith',
    email: 'jane@example.com',
    phone: '+0987654321',
    ownedApartments: [{ id: 3 }],
  },
];

const mockTenants = [
  {
    id: 1,
    firstName: 'Alice',
    lastName: 'Johnson',
    username: 'alicej',
    email: 'alice@example.com',
    phone: '+1111111111',
    rentals: [{ id: 1 }],
  },
  {
    id: 2,
    firstName: 'Bob',
    lastName: 'Wilson',
    username: 'bobw',
    email: 'bob@example.com',
    phone: null,
    rentals: [],
  },
];

const mockRentals = [
  {
    id: 1,
    apartmentId: 1,
    tenantId: 1,
    ownerId: 1,
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    totalCost: 12000,
    status: 'ACTIVE',
    address: {
      city: 'New York',
      country: 'USA',
    },
  },
  {
    id: 2,
    apartmentId: 2,
    tenantId: 2,
    ownerId: 2,
    startDate: '2024-06-01',
    endDate: '2024-12-31',
    totalCost: 8000,
    status: 'PENDING',
    address: {
      city: 'Los Angeles',
      country: 'USA',
    },
  },
];

const mockRouter = {
  push: vi.fn(),
};

const mockDeleteUser = {
  deleteUser: vi.fn(),
};

describe('AdminPanelPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    (useRouter as Mock).mockReturnValue(mockRouter);
    (useDeleteUser as Mock).mockReturnValue(mockDeleteUser);
    (useFetchOwners as Mock).mockReturnValue({
      owners: mockOwners,
      loading: false,
      error: null,
    });
    (useFetchTenants as Mock).mockReturnValue({
      tenants: mockTenants,
      loading: false,
      error: null,
      refetch: vi.fn(),
    });
    (useFetchRentals as Mock).mockReturnValue({
      rentals: mockRentals,
      loading: false,
      error: null,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Authentication and Authorization', () => {
    it('should redirect to login when not authenticated', async () => {
      let callCount = 0;
      (useSession as Mock).mockImplementation((options?: Record<string, unknown>) => {
        callCount++;
        if (callCount === 1) {
          return { data: null, status: 'loading' } as SessionContextValue;
        }
        if (options?.required && typeof options.onUnauthenticated === 'function') {
          setTimeout(() => (options.onUnauthenticated as () => void)(), 0);
        }
        return { data: null, status: 'unauthenticated' } as SessionContextValue;
      });

      render(<AdminPanelPage />);
    });

    it('should redirect to unauthorized when user is not admin', async () => {
      (useSession as Mock).mockReturnValue({
        data: { user: { role: 'USER' } },
        status: 'authenticated',
      } as SessionContextValue);

      render(<AdminPanelPage />);
      
      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/unauthorized');
      });
    });

    it('should render admin panel when user is admin', () => {
      (useSession as Mock).mockReturnValue({
        data: { user: { role: 'ADMIN' } },
        status: 'authenticated',
      } as SessionContextValue);

      render(<AdminPanelPage />);
      
      expect(screen.getByText('Admin Panel')).toBeInTheDocument();
      expect(screen.getByText('Manage all users and rentals across the platform')).toBeInTheDocument();
    });
  });

  describe('Tab Navigation', () => {
    beforeEach(() => {
      (useSession as Mock).mockReturnValue({
        data: { user: { role: 'ADMIN' } },
        status: 'authenticated',
      });
    });

    it('should show owners tab by default', () => {
      render(<AdminPanelPage />);
      
      expect(screen.getByText('All Property Owners')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    it('should switch to tenants tab when clicked', async () => {
      render(<AdminPanelPage />);
      
      const tenantsTab = screen.getByRole('button', { name: /tenants/i });
      fireEvent.click(tenantsTab);
      
      await waitFor(() => {
        expect(screen.getByText('All Tenants')).toBeInTheDocument();
        expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
        expect(screen.getByText('Bob Wilson')).toBeInTheDocument();
      });
    });

    it('should switch to rentals tab when clicked', async () => {
      render(<AdminPanelPage />);
      
      const rentalsTab = screen.getByRole('button', { name: /rentals/i });
      fireEvent.click(rentalsTab);
      
      await waitFor(() => {
        expect(screen.getByText('All Rental Transactions')).toBeInTheDocument();
        expect(screen.getByText('Apt #1')).toBeInTheDocument();
        expect(screen.getByText('Apt #2')).toBeInTheDocument();
      });
    });
  });

  describe('Search Functionality', () => {
    beforeEach(() => {
      (useSession as Mock).mockReturnValue({
        data: { user: { role: 'ADMIN' } },
        status: 'authenticated',
      });
    });

    it('should filter owners by search term', async () => {
      render(<AdminPanelPage />);
      
      const searchInput = screen.getByPlaceholderText('Search by name, email, ID...');
      fireEvent.change(searchInput, { target: { value: 'john' } });
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
      });
    });

    it('should clear search when X button is clicked', async () => {
      render(<AdminPanelPage />);
      
      const searchInput = screen.getByPlaceholderText('Search by name, email, ID...');
      fireEvent.change(searchInput, { target: { value: 'john' } });
      
      const clearButton = screen.getByRole('button', { name: '', hidden: true });
      fireEvent.click(clearButton);
      
      await waitFor(() => {
        expect(searchInput).toHaveValue('');
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      });
    });

    it('should filter tenants by search term', async () => {
      render(<AdminPanelPage />);
      
      // Switch to tenants tab
      const tenantsTab = screen.getByRole('button', { name: /tenants/i });
      fireEvent.click(tenantsTab);
      
      const searchInput = screen.getByPlaceholderText('Search by name, email, ID...');
      fireEvent.change(searchInput, { target: { value: 'alice' } });
      
      await waitFor(() => {
        expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
        expect(screen.queryByText('Bob Wilson')).not.toBeInTheDocument();
      });
    });
  });

  describe('Rental Status Filter', () => {
    beforeEach(() => {
      (useSession as Mock).mockReturnValue({
        data: { user: { role: 'ADMIN' } },
        status: 'authenticated',
      });
    });

    it('should show rental status filter only on rentals tab', async () => {
      render(<AdminPanelPage />);
      
      // Should not show filter on owners tab
      expect(screen.queryByDisplayValue('All Rental Statuses')).not.toBeInTheDocument();
      
      // Switch to rentals tab
      const rentalsTab = screen.getByRole('button', { name: /rentals/i });
      fireEvent.click(rentalsTab);
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('All Rental Statuses')).toBeInTheDocument();
      });
    });

    it('should filter rentals by status', async () => {
      render(<AdminPanelPage />);
      
      // Switch to rentals tab
      const rentalsTab = screen.getByRole('button', { name: /rentals/i });
      fireEvent.click(rentalsTab);
      
      await waitFor(() => {
        const statusFilter = screen.getByDisplayValue('All Rental Statuses');
        fireEvent.change(statusFilter, { target: { value: 'ACTIVE' } });
      });
      
      await waitFor(() => {
        expect(screen.getByText('Apt #1')).toBeInTheDocument();
        expect(screen.queryByText('Apt #2')).not.toBeInTheDocument();
      });
    });
  });

  describe('User Details Modal', () => {
    beforeEach(() => {
      (useSession as Mock).mockReturnValue({
        data: { user: { role: 'ADMIN' } },
        status: 'authenticated',
      });
    });

    it('should open user details modal when View button is clicked', async () => {
      render(<AdminPanelPage />);
      
      const viewButtons = screen.getAllByText('View');
      fireEvent.click(viewButtons[0]);
      
      await waitFor(() => {
        expect(screen.getByText('User Details')).toBeInTheDocument();
        expect(screen.getAllByText('John Doe').length).toBeGreaterThan(0);
        expect(screen.getAllByText('john@example.com').length).toBeGreaterThan(0);
      });
    });

    it('should close user details modal when Close button is clicked', async () => {
      render(<AdminPanelPage />);
      
      const viewButtons = screen.getAllByText('View');
      fireEvent.click(viewButtons[0]);
      
      await waitFor(() => {
        expect(screen.getByText('User Details')).toBeInTheDocument();
      });
      
      const closeButton = screen.getByText('Close');
      fireEvent.click(closeButton);
      
      await waitFor(() => {
        expect(screen.queryByText('User Details')).not.toBeInTheDocument();
      });
    });
  });

  describe('Delete User Functionality', () => {
    beforeEach(() => {
      (useSession as Mock).mockReturnValue({
        data: { user: { role: 'ADMIN' } },
        status: 'authenticated',
      });
    });

    it('should open confirmation modal when Delete button is clicked', async () => {
      render(<AdminPanelPage />);
      
      const deleteButtons = screen.getAllByText('Delete');
      fireEvent.click(deleteButtons[0]);
      
      await waitFor(() => {
        expect(screen.getByText('Delete User')).toBeInTheDocument();
        expect(screen.getByText(/Are you sure you want to delete/)).toBeInTheDocument();
        // There may be multiple, but at least one should be present
        expect(screen.getAllByText('John Doe').length).toBeGreaterThan(0);
      });
    });

    it('should close confirmation modal when Cancel button is clicked', async () => {
      render(<AdminPanelPage />);
      
      const deleteButtons = screen.getAllByText('Delete');
      fireEvent.click(deleteButtons[0]);
      
      await waitFor(() => {
        expect(screen.getByText('Delete User')).toBeInTheDocument();
      });
      
      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);
      
      await waitFor(() => {
        expect(screen.queryByText('Delete User')).not.toBeInTheDocument();
      });
    });

    it('should call deleteUser when confirmed', async () => {
      render(<AdminPanelPage />);
      
      const deleteButtons = screen.getAllByText('Delete');
      fireEvent.click(deleteButtons[0]);
      
      await waitFor(() => {
        expect(screen.getByText('Delete User')).toBeInTheDocument();
      });
      
      // Find all delete buttons by role and name, click the last one (modal confirm)
      const confirmButtons = screen.getAllByRole('button', { name: /delete/i });
      fireEvent.click(confirmButtons[confirmButtons.length - 1]);
      
      await waitFor(() => {
        expect(mockDeleteUser.deleteUser).toHaveBeenCalledWith(1);
      });
    });
  });

  describe('Error States', () => {
    beforeEach(() => {
      (useSession as Mock).mockReturnValue({
        data: { user: { role: 'ADMIN' } },
        status: 'authenticated',
      });
    });

    it('should show error message when owners fetch fails', () => {
      (useFetchOwners as Mock).mockReturnValue({
        owners: null,
        loading: false,
        error: 'Failed to fetch owners',
      });

      render(<AdminPanelPage />);
      
      expect(screen.getByText('Error Loading Data')).toBeInTheDocument();
      expect(screen.getByText("We couldn't load the requested information.")).toBeInTheDocument();
    });

    it('should show error message when tenants fetch fails', async () => {
      (useFetchTenants as Mock).mockReturnValue({
        tenants: null,
        loading: false,
        error: 'Failed to fetch tenants',
        refetch: vi.fn(),
      });

      render(<AdminPanelPage />);
      
      // Switch to tenants tab
      const tenantsTab = screen.getByRole('button', { name: /tenants/i });
      fireEvent.click(tenantsTab);
      
      await waitFor(() => {
        expect(screen.getByText('Error Loading Data')).toBeInTheDocument();
      });
    });
  });

  describe('Empty States', () => {
    beforeEach(() => {
      (useSession as Mock).mockReturnValue({
        data: { user: { role: 'ADMIN' } },
        status: 'authenticated',
      });
    });

    it('should show empty state when no owners found', () => {
      (useFetchOwners as Mock).mockReturnValue({
        owners: [],
        loading: false,
        error: null,
      });

      render(<AdminPanelPage />);
      
      expect(screen.getByText('No owners found in the system.')).toBeInTheDocument();
    });

    it('should show empty state when no search results found', async () => {
      render(<AdminPanelPage />);
      
      const searchInput = screen.getByPlaceholderText('Search by name, email, ID...');
      fireEvent.change(searchInput, { target: { value: 'nonexistent' } });
      
      await waitFor(() => {
        expect(screen.getByText('No owners match your search criteria.')).toBeInTheDocument();
      });
    });
  });

  describe('Platform Statistics', () => {
    beforeEach(() => {
      (useSession as Mock).mockReturnValue({
        data: { user: { role: 'ADMIN' } },
        status: 'authenticated',
      });
    });

    it('should display correct platform statistics', () => {
      render(<AdminPanelPage />);
      
      expect(screen.getByText('Platform Statistics')).toBeInTheDocument();
      
      // Total users (2 owners + 2 tenants = 4)
      expect(screen.getByText('4')).toBeInTheDocument();
      expect(screen.getByText('2 owners')).toBeInTheDocument();
      expect(screen.getByText('2 tenants')).toBeInTheDocument();
      
      const rentalStats = screen.getAllByText('2');
      expect(rentalStats.length).toBeGreaterThan(1);

      expect(screen.getByText('1 active rentals')).toBeInTheDocument();
      
      // Total revenue
      expect(screen.getByText('$20000.00')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      (useSession as Mock).mockReturnValue({
        data: { user: { role: 'ADMIN' } },
        status: 'authenticated',
      });
    });

    it('should have proper ARIA labels', () => {
      render(<AdminPanelPage />);
      
      expect(screen.getByRole('button', { name: /owners/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /tenants/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /rentals/i })).toBeInTheDocument();
    });

    it('should have proper table headers', () => {
      render(<AdminPanelPage />);
      
      expect(screen.getByRole('columnheader', { name: /id/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /user/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /contact/i })).toBeInTheDocument();
    });
  });
});
