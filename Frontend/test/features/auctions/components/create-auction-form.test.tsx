import * as useOccupiedRangesModule from '@/features/apartment/hooks/use-fetch-occupied-ranges';
import CreateAuctionForm from '@/features/auctions/components/create-auction-form';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios, { AxiosInstance } from 'axios';
import { useSession } from 'next-auth/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Create a direct spy on the module's useFetchOccupiedRanges function
const mockUseFetchOccupiedRanges = vi.spyOn(
  useOccupiedRangesModule,
  'useFetchOccupiedRanges',
);

// Mock dependencies
vi.mock('next-auth/react');
vi.mock('axios');
vi.mock('sonner');
vi.mock('next-runtime-env', () => ({
  env: () => 'http://localhost:3000/api',
}));
vi.mock('@/features/auctions/utils/date-utils', () => ({
  getDisabledDateRanges: vi.fn().mockReturnValue([]),
  toLocalDateTimeString: vi.fn().mockReturnValue('2025-06-22T12:00:00'),
}));

describe('CreateAuctionForm', () => {
  const mockProps = {
    apartmentId: 123,
    startingPrice: 1000,
    onClose: vi.fn(),
  };

  const mockPost = vi.fn().mockResolvedValue({ data: {} });
  const mockGet = vi.fn().mockResolvedValue({
    data: {
      occupiedRanges: [],
      availableRanges: [],
    },
  });

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup our mock implementation for useFetchOccupiedRanges
    mockUseFetchOccupiedRanges.mockReturnValue({
      availability: {
        occupiedRanges: [],
        availableRanges: [],
      },
      loading: false,
      error: null,
    });

    // Setup session mock
    vi.mocked(useSession).mockReturnValue({
      data: {
        accessToken: 'mock-token',
        user: { id: 1 },
      },
      status: 'authenticated',
    } as ReturnType<typeof useSession>);

    // Setup axios mock with proper typing for both component and hook
    vi.mocked(axios.create).mockReturnValue({
      post: mockPost,
      get: mockGet,
    } as unknown as AxiosInstance);
  });

  it('renders the form with all required fields', () => {
    render(<CreateAuctionForm {...mockProps} />);

    // Check for field labels
    expect(screen.getByText('Start Time')).toBeInTheDocument();
    expect(screen.getByText('End Time')).toBeInTheDocument();
    expect(screen.getByText('Starting Price (zł)')).toBeInTheDocument();
    expect(screen.getByText('Minimum Bid Increment (zł)')).toBeInTheDocument();
    expect(screen.getByText('Rental Start Date')).toBeInTheDocument();
    expect(screen.getByText('Rental End Date')).toBeInTheDocument();
    expect(screen.getByText('Max Bidders')).toBeInTheDocument();

    // Check for submit button
    expect(
      screen.getByRole('button', { name: 'Create Auction' }),
    ).toBeInTheDocument();
  });

  it('uses provided default values', () => {
    render(<CreateAuctionForm {...mockProps} />);

    // Find the correct input by looking at the container near the label
    const startingPriceLabel = screen.getByText('Starting Price (zł)');
    const inputContainer = startingPriceLabel.closest('div');
    const startingPriceInput = inputContainer?.querySelector(
      'input[name="startingPrice"]',
    );

    // Verify the form uses the provided starting price
    expect(startingPriceInput).toHaveValue(mockProps.startingPrice);
  });

  it('shows error messages when form values are invalid', async () => {
    const user = userEvent.setup();
    render(<CreateAuctionForm {...mockProps} />);

    // Find the minimum bid increment field and enter an invalid value
    const minBidLabel = screen.getByText('Minimum Bid Increment (zł)');
    const minBidContainer = minBidLabel.closest('div');
    const minBidInput = minBidContainer?.querySelector(
      'input[name="minimumBidIncrement"]',
    ) as HTMLInputElement;

    const maxBiddersLabel = screen.getByText('Max Bidders');
    const maxBiddersContainer = maxBiddersLabel.closest('div');
    const maxBiddersInput = maxBiddersContainer?.querySelector(
      'input[name="maxBidders"]',
    ) as HTMLInputElement;

    // Clear fields and enter values
    await user.clear(minBidInput);
    await user.type(minBidInput, '-50');

    await user.clear(maxBiddersInput);
    await user.type(maxBiddersInput, '10');

    // Check if an error message is displayed for negative value
    expect(screen.getByText(/must be positive/i)).toBeInTheDocument();
  });

  it('disables submit button when form is invalid', () => {
    render(<CreateAuctionForm {...mockProps} />);

    // By default form should be invalid until all required fields are filled
    const submitButton = screen.getByRole('button', { name: 'Create Auction' });
    expect(submitButton).toBeDisabled();
  });
});
