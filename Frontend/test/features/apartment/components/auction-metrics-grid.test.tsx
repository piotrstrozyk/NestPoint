import { render, screen } from '@testing-library/react';
import AuctionMetricsGrid from '@/features/apartment/components/auction-metrics-grid';
import { describe, it, expect, vi } from 'vitest';

// Mock AuctionStatusBadge to avoid dependency on its implementation
vi.mock('@/features/apartment/components/auction-status-badge', () => ({
  __esModule: true,
  default: ({ status }: { status: string }) => <span data-testid="auction-status-badge">{status}</span>,
}));

const mockAuction = {
  status: 'active',
  startTime: '2025-07-01T10:00:00Z',
  endTime: '2025-07-10T10:00:00Z',
  rentalStartDate: '2025-07-15T10:00:00Z',
  rentalEndDate: '2025-07-20T10:00:00Z',
  startingPrice: 100,
  bids: [
    { bidderId: 1, amount: 120 },
    { bidderId: 2, amount: 150 },
  ],
};

const fmt = (iso: string) => `FMT(${iso})`;

describe('AuctionMetricsGrid', () => {
  it('renders all auction metrics', () => {
    render(
      <AuctionMetricsGrid
        auction={mockAuction}
        auctionStatus="active"
        fmt={fmt}
        currentHighestBid={150}
        currentBidderCount={2}
        currentHighestBidder={2}
        userId={1}
      />
    );
    expect(screen.getByText('Auction Overview')).toBeInTheDocument();
    expect(screen.getByTestId('auction-status-badge')).toHaveTextContent('active');
    expect(screen.getByText('FMT(2025-07-01T10:00:00Z)')).toBeInTheDocument(); // startTime
    expect(screen.getByText('FMT(2025-07-10T10:00:00Z)')).toBeInTheDocument(); // endTime
    expect(screen.getByText('FMT(2025-07-15T10:00:00Z)')).toBeInTheDocument(); // rentalStartDate
    expect(screen.getByText('FMT(2025-07-20T10:00:00Z)')).toBeInTheDocument(); // rentalEndDate
    expect(screen.getByText('100 zł')).toBeInTheDocument();
    expect(screen.getByText('150 zł')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument(); // bidder count
  });

  it('shows "You are winning!" if user is highest bidder', () => {
    render(
      <AuctionMetricsGrid
        auction={mockAuction}
        auctionStatus="active"
        fmt={fmt}
        currentHighestBid={150}
        currentBidderCount={2}
        currentHighestBidder={1}
        userId={1}
      />
    );
    expect(screen.getByText('You are winning!')).toBeInTheDocument();
  });

  it('shows "No bidders yet" if no bids', () => {
    render(
      <AuctionMetricsGrid
        auction={{ ...mockAuction, bids: [], startingPrice: 100 }}
        auctionStatus="active"
        fmt={fmt}
        currentHighestBid={null}
        currentBidderCount={0}
        currentHighestBidder={null}
        userId={1}
      />
    );
    expect(screen.getByText('No bidders yet')).toBeInTheDocument();
  });

  it('shows "No observers yet" if no observers', () => {
    render(
      <AuctionMetricsGrid
        auction={mockAuction}
        auctionStatus="active"
        fmt={fmt}
        currentHighestBid={150}
        currentBidderCount={0}
        currentHighestBidder={2}
        userId={1}
      />
    );
    expect(screen.getByText('No observers yet')).toBeInTheDocument();
  });
});
