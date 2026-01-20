import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ProfileHeader from '@/features/tenant/components/profile-header';
import type { OverdueAuctionPayment } from '@/features/tenant/hooks/use-fetch-tenant-overdue';
import type { Owner as Tenant } from '@/features/tenant/hooks/use-fetch-tenant-details';

interface MockTabsProps {
  activeTab: 'rentals' | 'payments';
  setActiveTab: (tab: 'rentals' | 'payments') => void;
}
vi.mock('@/features/tenant/components/profile-tabs', () => ({
  __esModule: true,
  default: ({ activeTab, setActiveTab }: MockTabsProps) => (
    <div>
      <button onClick={() => setActiveTab('rentals')} data-testid='tab-rentals'>Rentals Tab</button>
      <button onClick={() => setActiveTab('payments')} data-testid='tab-payments'>Payments Tab</button>
      <span data-testid='active-tab'>{activeTab}</span>
    </div>
  ),
}));

const tenant: Tenant = {
  id: 1,
  username: 'johndoe',
  email: 'john@example.com',
  firstName: 'John',
  lastName: 'Doe',
  phone: '123-456-7890',
  roles: [],
  ownedApartments: [],
  rentals: [],
};

const overduePayments: OverdueAuctionPayment[] = [
  {
    rentalId: 1,
    apartmentId: 10,
    tenantId: 1,
    ownerId: 2,
    startDate: '2025-06-01',
    endDate: '2025-06-10',
    nights: 9,
    pricePerNight: 100,
    totalCost: 900,
    status: 'OVERDUE',
    address: {
      street: 'Main St',
      apartmentNumber: '1A',
      city: 'City',
      postalCode: '12345',
      country: 'Country',
      fullAddress: 'Main St 1A, City',
      latitude: 0,
      longitude: 0,
    },
    apartmentOccupied: false,
    rentalFees: 0,
    isAuction: true,
    auctionPaymentConfirmed: false,
    auctionPaymentDeadline: '2025-06-01',
    auctionFineIssued: true,
    auctionFineAmount: 100,
  },
  {
    rentalId: 2,
    apartmentId: 11,
    tenantId: 1,
    ownerId: 2,
    startDate: '2025-06-15',
    endDate: '2025-06-20',
    nights: 5,
    pricePerNight: 120,
    totalCost: 600,
    status: 'OVERDUE',
    address: {
      street: 'Second St',
      apartmentNumber: '2B',
      city: 'City',
      postalCode: '54321',
      country: 'Country',
      fullAddress: 'Second St 2B, City',
      latitude: 0,
      longitude: 0,
    },
    apartmentOccupied: false,
    rentalFees: 0,
    isAuction: true,
    auctionPaymentConfirmed: false,
    auctionPaymentDeadline: '2025-06-15',
    auctionFineIssued: true,
    auctionFineAmount: 200,
  },
];

describe('ProfileHeader', () => {
  let setActiveTab: (tab: 'rentals' | 'payments') => void;

  beforeEach(() => {
    setActiveTab = vi.fn();
  });

  it('renders tenant name, email, phone, and verified badge', () => {
    render(
      <ProfileHeader
        tenant={tenant}
        payments={[]}
        activeTab='rentals'
        setActiveTab={setActiveTab}
      />
    );
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
    expect(screen.getByText('123-456-7890')).toBeInTheDocument();
    expect(screen.getByText(/verified tenant/i)).toBeInTheDocument();
  });

  it('shows fallback for missing phone number', () => {
    render(
      <ProfileHeader
        tenant={{ ...tenant, phone: '' }}
        payments={[]}
        activeTab='rentals'
        setActiveTab={setActiveTab}
      />
    );
    expect(screen.getByText(/no phone number provided/i)).toBeInTheDocument();
  });

  it('does not show overdue warning if no payments', () => {
    render(
      <ProfileHeader
        tenant={tenant}
        payments={[]}
        activeTab='rentals'
        setActiveTab={setActiveTab}
      />
    );
    expect(screen.queryByText(/attention required/i)).not.toBeInTheDocument();
  });

  it('shows overdue warning if payments exist', () => {
    render(
      <ProfileHeader
        tenant={tenant}
        payments={overduePayments}
        activeTab='payments'
        setActiveTab={setActiveTab}
      />
    );
    expect(screen.getByText(/attention required/i)).toBeInTheDocument();
    expect(screen.getByText(/you have 2 overdue payments/i)).toBeInTheDocument();
  });

  it('shows correct active tab and calls setActiveTab on click', () => {
    render(
      <ProfileHeader
        tenant={tenant}
        payments={[]}
        activeTab='payments'
        setActiveTab={setActiveTab}
      />
    );
    expect(screen.getByTestId('active-tab').textContent).toBe('payments');
    fireEvent.click(screen.getByTestId('tab-rentals'));
    expect(setActiveTab).toHaveBeenCalledWith('rentals');
    fireEvent.click(screen.getByTestId('tab-payments'));
    expect(setActiveTab).toHaveBeenCalledWith('payments');
  });
});
