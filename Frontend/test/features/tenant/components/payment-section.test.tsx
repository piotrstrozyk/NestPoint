import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PaymentsSection from '@/features/tenant/components/payments-section';
import type { Rental } from '@/features/tenant/hooks/use-fetch-tenant-rentals';

const today = new Date();

const baseRental: Rental = {
  id: 1,
  apartmentId: 101,
  tenantId: 201,
  ownerId: 301,
  totalCost: 1000,
  auctionPaymentConfirmed: false,
  auctionPaymentDeadline: today.toISOString(),
  auctionFineIssued: false,
  auctionFineAmount: 200,
  status: 'PENDING',
  startDate: today,
  endDate: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000),
  nights: 30,
  pricePerNight: 33.33,
  address: {
    street: '123 Main St',
    city: 'City',
    postalCode: '12345',
    country: 'Country',
    apartmentNumber: '1A',
    fullAddress: '123 Main St, 1A, City, 12345, Country',
    latitude: 0,
    longitude: 0
  },
  apartmentOccupied: false,
  isAuction: true,
  rentalFees: 0
};

describe('PaymentsSection', () => {
  let setSelectedPayment: ReturnType<typeof vi.fn>;
  let setShowPaymentModal: ReturnType<typeof vi.fn>;
  let setIsFine: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    setSelectedPayment = vi.fn();
    setShowPaymentModal = vi.fn();
    setIsFine = vi.fn();
  });

  it('shows error when rentalsError is set', () => {
    render(
      <PaymentsSection
        rentals={[]}
        rentalsLoading={false}
        rentalsError={new Error('fail')}
        completedPayments={[]}
        setSelectedPayment={setSelectedPayment}
        setShowPaymentModal={setShowPaymentModal}
      />
    );
    expect(screen.getByText(/error loading payment information/i)).toBeInTheDocument();
  });

  it('shows empty state when no unpaid auction rentals', () => {
    render(
      <PaymentsSection
        rentals={[]}
        rentalsLoading={false}
        rentalsError={null}
        completedPayments={[]}
        setSelectedPayment={setSelectedPayment}
        setShowPaymentModal={setShowPaymentModal}
      />
    );
    expect(screen.getByText(/no pending or overdue payments/i)).toBeInTheDocument();
  });

  it('shows today payment congratulation and Complete Payment button', () => {
    render(
      <PaymentsSection
        rentals={[
          { ...baseRental, id: 2, auctionPaymentDeadline: today.toISOString() },
        ]}
        rentalsLoading={false}
        rentalsError={null}
        completedPayments={[]}
        setSelectedPayment={setSelectedPayment}
        setShowPaymentModal={setShowPaymentModal}
      />
    );
    expect(screen.getByText(/congratulations on your auction win/i)).toBeInTheDocument();
    expect(screen.getByText(/complete payment/i)).toBeInTheDocument();
  });

  it('shows payments table with correct actions', () => {
    render(
      <PaymentsSection
        rentals={[
          // Fine
          { ...baseRental, id: 3, auctionFineIssued: true, auctionFineAmount: 300 },
          // Today payment
          { ...baseRental, id: 4, auctionPaymentDeadline: today.toISOString() },
          // Future payment
          { ...baseRental, id: 5, auctionPaymentDeadline: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString() },
        ]}
        rentalsLoading={false}
        rentalsError={null}
        completedPayments={[]}
        setSelectedPayment={setSelectedPayment}
        setShowPaymentModal={setShowPaymentModal}
        setIsFine={setIsFine}
      />
    );
    expect(screen.getByText('#3')).toBeInTheDocument();
    expect(screen.getByText('#4')).toBeInTheDocument();
    expect(screen.getByText('#5')).toBeInTheDocument();
    expect(screen.getByText(/pay fine/i)).toBeInTheDocument();
  });

  it('calls setSelectedPayment, setShowPaymentModal, setIsFine on Pay Fine click', () => {
    render(
      <PaymentsSection
        rentals={[
          { ...baseRental, id: 6, auctionFineIssued: true, auctionFineAmount: 400 },
        ]}
        rentalsLoading={false}
        rentalsError={null}
        completedPayments={[]}
        setSelectedPayment={setSelectedPayment}
        setShowPaymentModal={setShowPaymentModal}
        setIsFine={setIsFine}
      />
    );
    fireEvent.click(screen.getByText(/pay fine/i));
    expect(setSelectedPayment).toHaveBeenCalled();
    expect(setShowPaymentModal).toHaveBeenCalledWith(true);
    expect(setIsFine).toHaveBeenCalledWith(true);
  });

  it('calls setSelectedPayment, setShowPaymentModal, setIsFine(false) on Make Payment click', () => {
    render(
      <PaymentsSection
        rentals={[
          { ...baseRental, id: 8, auctionPaymentDeadline: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString() },
        ]}
        rentalsLoading={false}
        rentalsError={null}
        completedPayments={[]}
        setSelectedPayment={setSelectedPayment}
        setShowPaymentModal={setShowPaymentModal}
        setIsFine={setIsFine}
      />
    );
    fireEvent.click(screen.getByText(/make payment/i));
    expect(setSelectedPayment).toHaveBeenCalled();
    expect(setShowPaymentModal).toHaveBeenCalledWith(true);
    expect(setIsFine).toHaveBeenCalledWith(false);
  });
});
