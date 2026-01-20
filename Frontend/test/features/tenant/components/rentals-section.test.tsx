import { render, screen, fireEvent } from '@testing-library/react';
import RentalsSection from '../../../../src/features/tenant/components/rentals-section';
import { vi, describe, it, expect } from 'vitest';

const rentals = [
  {
    id: 1,
    apartmentId: 101,
    address: {
      city: 'Warsaw',
      country: 'Poland',
      street: 'Main St',
      apartmentNumber: '10A',
      postalCode: '00-001',
      fullAddress: 'Main St 10A, 00-001 Warsaw, Poland',
      region: 'Mazowieckie',
      latitude: 0,
      longitude: 0,
    },
    startDate: new Date('2025-07-01T00:00:00.000Z'),
    endDate: new Date('2025-07-05T00:00:00.000Z'),
    nights: 4,
    totalCost: 400,
    pricePerNight: 100,
    status: 'ACTIVE' as const,
    tenantId: 1,
    ownerId: 1,
    apartmentOccupied: false,
    rentalFees: 0,
    paymentStatus: 'PAID',
    createdAt: new Date('2025-06-01T00:00:00.000Z'),
    updatedAt: new Date('2025-07-01T00:00:00.000Z'),
    isAuction: false,
    auctionPaymentConfirmed: false,
    auctionPaymentDeadline: '2025-07-02T00:00:00.000Z',
    auctionFineIssued: false,
    auctionFineAmount: 0 as const,
  },
  {
    id: 2,
    apartmentId: 102,
    address: {
      city: 'Krakow',
      country: 'Poland',
      street: 'Market Sq',
      apartmentNumber: '5B',
      postalCode: '31-001',
      fullAddress: 'Market Sq 5B, 31-001 Krakow, Poland',
      region: 'Malopolskie',
      latitude: 0,
      longitude: 0,
    },
    startDate: new Date('2025-06-01T00:00:00.000Z'),
    endDate: new Date('2025-06-03T00:00:00.000Z'),
    nights: 2,
    totalCost: 200,
    pricePerNight: 100,
    status: 'COMPLETED' as const,
    tenantId: 2,
    ownerId: 2,
    apartmentOccupied: false,
    rentalFees: 0,
    paymentStatus: 'PAID',
    createdAt: new Date('2025-05-01T00:00:00.000Z'),
    updatedAt: new Date('2025-06-01T00:00:00.000Z'),
    isAuction: false,
    auctionPaymentConfirmed: false,
    auctionPaymentDeadline: '2025-06-02T00:00:00.000Z',
    auctionFineIssued: false,
    auctionFineAmount: 0 as const,
  },
];

describe('RentalsSection', () => {

  it('renders error state', () => {
    render(
      <RentalsSection
        rentals={[]}
        rentalsLoading={false}
        rentalsError={new Error('fail')}
        rentalStatusFilter="ALL"
        setRentalStatusFilter={vi.fn()}
      />
    );
    expect(screen.getByText(/error loading rentals/i)).toBeInTheDocument();
  });

  it('renders empty state for all', () => {
    render(
      <RentalsSection
        rentals={[]}
        rentalsLoading={false}
        rentalsError={null}
        rentalStatusFilter="ALL"
        setRentalStatusFilter={vi.fn()}
      />
    );
    expect(screen.getByText(/no rentals found/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /find apartments to rent/i })).toBeInTheDocument();
  });

  it('renders empty state for filtered', () => {
    render(
      <RentalsSection
        rentals={rentals}
        rentalsLoading={false}
        rentalsError={null}
        rentalStatusFilter="PENDING"
        setRentalStatusFilter={vi.fn()}
      />
    );
    expect(screen.getByText(/no pending rentals found/i)).toBeInTheDocument();
  });

  it('renders rentals table', () => {
    render(
      <RentalsSection
        rentals={rentals}
        rentalsLoading={false}
        rentalsError={null}
        rentalStatusFilter="ALL"
        setRentalStatusFilter={vi.fn()}
      />
    );
    expect(screen.getByText(/my rental history/i)).toBeInTheDocument();
    expect(screen.getByText('#1')).toBeInTheDocument();
    expect(screen.getByText('#2')).toBeInTheDocument();
    expect(screen.getByText(/apartment #101/i)).toBeInTheDocument();
    expect(screen.getByText(/apartment #102/i)).toBeInTheDocument();
    expect(screen.getByText(/warsaw, poland/i)).toBeInTheDocument();
    expect(screen.getByText(/krakow, poland/i)).toBeInTheDocument();
    expect(screen.getByText('ACTIVE')).toBeInTheDocument();
    expect(screen.getByText('COMPLETED')).toBeInTheDocument();
  });

  it('filters rentals by status', () => {
    render(
      <RentalsSection
        rentals={rentals}
        rentalsLoading={false}
        rentalsError={null}
        rentalStatusFilter="COMPLETED"
        setRentalStatusFilter={vi.fn()}
      />
    );
    expect(screen.getByText('COMPLETED')).toBeInTheDocument();
    expect(screen.queryByText('ACTIVE')).not.toBeInTheDocument();
  });

  it('calls setRentalStatusFilter on select change', () => {
    const setRentalStatusFilter = vi.fn();
    render(
      <RentalsSection
        rentals={rentals}
        rentalsLoading={false}
        rentalsError={null}
        rentalStatusFilter="ALL"
        setRentalStatusFilter={setRentalStatusFilter}
      />
    );
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'ACTIVE' } });
    expect(setRentalStatusFilter).toHaveBeenCalledWith('ACTIVE');
  });

  it('renders correct apartment links', () => {
    render(
      <RentalsSection
        rentals={rentals}
        rentalsLoading={false}
        rentalsError={null}
        rentalStatusFilter="ALL"
        setRentalStatusFilter={vi.fn()}
      />
    );
    expect(screen.getByRole('link', { name: /apartment #101/i })).toHaveAttribute('href', '/apartment/101');
    expect(screen.getByRole('link', { name: /apartment #102/i })).toHaveAttribute('href', '/apartment/102');
  });
});
