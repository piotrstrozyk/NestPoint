import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, vi, beforeEach, expect } from 'vitest';
import CreateRentalWithPaymentModal from '@/features/apartment/components/create-rental-with-payment-modal';

// Mocks
vi.mock('next-auth/react', () => ({ useSession: vi.fn() }));
vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
vi.mock('@/features/apartment/hooks/use-fetch-occupied-ranges', () => ({ useFetchOccupiedRanges: vi.fn() }));
vi.mock('@/features/booking/hooks/use-create-rental-with-payment', () => ({ useCreateRentalWithPayment: vi.fn() }));
vi.mock('@/features/auctions/components/form-fields/credit-card-field', () => ({
  __esModule: true,
  default: (props: React.ComponentProps<'input'> & { error?: string | { message: string } }) => (
    <>
      <input data-testid="credit-card-field" {...props} />
      {props.error && <div>{typeof props.error === 'string' ? props.error : props.error.message}</div>}
    </>
  ),
}));
vi.mock('@/features/auctions/components/form-fields/date-field', () => ({
  __esModule: true,
  default: (props: React.ComponentProps<'input'>) => <input data-testid={props.name} {...props} />
}));
vi.mock('@/features/apartment/hooks/use-calculate-price', () => ({ useCalculatePrice: vi.fn() }));

import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { useFetchOccupiedRanges } from '@/features/apartment/hooks/use-fetch-occupied-ranges';
import { useCreateRentalWithPayment } from '@/features/booking/hooks/use-create-rental-with-payment';
import { useCalculatePrice } from '@/features/apartment/hooks/use-calculate-price';

const mockSession = { data: { user: { id: 1 }, accessToken: 'token' } };

const defaultProps = { apartmentId: 42 };

describe('CreateRentalWithPaymentModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (useSession as any).mockReturnValue(mockSession);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (useFetchOccupiedRanges as any).mockReturnValue({ availability: { occupiedRanges: [] } });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (useCalculatePrice as any).mockReturnValue({ data: { nights: 2, pricePerNight: 100, totalPrice: 200 }, loading: false, error: null });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (useCreateRentalWithPayment as any).mockReturnValue({ createRentalWithPayment: vi.fn().mockResolvedValue({ success: true }) });
  });

  it('renders the book button', () => {
    render(<CreateRentalWithPaymentModal {...defaultProps} />);
    expect(screen.getByText('Book Apartment Now')).toBeInTheDocument();
  });

  it('opens and closes the modal', async () => {
    render(<CreateRentalWithPaymentModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Book Apartment Now'));
    expect(screen.getByText('Book Apartment')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    await waitFor(() => expect(screen.queryByText('Book Apartment')).not.toBeInTheDocument());
  });

  it('shows price details when priceInfo is available', async () => {
    render(<CreateRentalWithPaymentModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Book Apartment Now'));
    expect(await screen.findByText('Price Details')).toBeInTheDocument();
    expect(screen.getByText('Number of nights:')).toBeInTheDocument();
    expect(screen.getByText('100.00zł')).toBeInTheDocument();
    expect(screen.getByText('200.00zł')).toBeInTheDocument();
  });

  it('shows error if not logged in', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (useSession as any).mockReturnValue({ data: null });
    render(<CreateRentalWithPaymentModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Book Apartment Now'));
    expect(toast.error).toHaveBeenCalledWith('Please sign in to create a rental');
  });

  it('shows card number validation error', async () => {
    render(<CreateRentalWithPaymentModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Book Apartment Now'));
    const cardInput = screen.getByTestId('credit-card-field');
    await userEvent.type(cardInput, '123');
    const submit = screen.getByRole('button', { name: /book for/i });
    fireEvent.click(submit);
    await waitFor(() => expect(screen.getByText('Card number must be exactly 10 digits')).toBeInTheDocument());
  });
});
