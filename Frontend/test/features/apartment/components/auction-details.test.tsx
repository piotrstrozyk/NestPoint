import { render, screen } from '@testing-library/react';
import AuctionDetails from '@/features/apartment/components/auction-details';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Set process.env.NEXT_PUBLIC_API_BASE_URL to a valid value to prevent SockJS URL errors during tests
process.env.NEXT_PUBLIC_API_BASE_URL = 'http://localhost';

// Mocks
vi.mock('next-auth/react', () => ({ useSession: vi.fn() }));
vi.mock('@/features/apartment/hooks/use-fetch-auction', () => ({ useFetchAuction: vi.fn() }));
vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
vi.mock('@/features/apartment/components/auction-title', () => ({
  __esModule: true,
  default: ({ title }: { title: string }) => <div data-testid="auction-title">{title}</div>,
}));
vi.mock('@/features/apartment/components/auction-metrics-grid', () => ({
  __esModule: true,
  default: () => <div data-testid="auction-metrics-grid" />,
}));
vi.mock('@/features/apartment/components/auction-bid-form', () => ({
  __esModule: true,
  default: () => <div data-testid="auction-bid-form" />,
}));

import { useSession } from 'next-auth/react';
import { useFetchAuction } from '@/features/apartment/hooks/use-fetch-auction';

const mockAuction = {
  id: 1,
  apartmentTitle: 'Test Apartment',
  status: 'ACTIVE',
  currentBidderCount: 2,
  minimumBidIncrement: 10,
  bids: [
    { bidderId: 1, bidTime: new Date().toISOString() },
    { bidderId: 2, bidTime: new Date().toISOString() },
  ],
};

describe('AuctionDetails', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (useSession as any).mockReturnValue({ data: { user: { id: 1, role: ['TENANT'], name: 'Test User' }, accessToken: 'token' }, status: 'authenticated' });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (useFetchAuction as any).mockReturnValue({ auction: mockAuction, loading: false, error: null });
  });

  it('renders loading state', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (useFetchAuction as any).mockReturnValue({ auction: null, loading: true, error: null });
    render(<AuctionDetails apartmentId={1} />);
    expect(screen.getByText(/loading auction/i)).toBeInTheDocument();
  });

  it('renders error state', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (useFetchAuction as any).mockReturnValue({ auction: null, loading: false, error: true });
    render(<AuctionDetails apartmentId={1} />);
    expect(screen.getByText(/error loading auction details/i)).toBeInTheDocument();
  });

  it('renders auction title and metrics', () => {
    render(<AuctionDetails apartmentId={1} />);
    expect(screen.getByTestId('auction-title')).toHaveTextContent('Test Apartment');
    expect(screen.getByTestId('auction-metrics-grid')).toBeInTheDocument();
  });

  it('renders bid form if auction is active and user is tenant', () => {
    render(<AuctionDetails apartmentId={1} />);
    expect(screen.getByTestId('auction-bid-form')).toBeInTheDocument();
  });

  it('renders inactive message if auction is not active', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (useFetchAuction as any).mockReturnValue({ auction: { ...mockAuction, status: 'COMPLETED' }, loading: false, error: null });
    render(<AuctionDetails apartmentId={1} />);
    expect(screen.getByText(/auction is not active/i)).toBeInTheDocument();
  });
});
