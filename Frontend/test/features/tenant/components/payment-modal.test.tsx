import { render, screen } from '@testing-library/react';
import PaymentModal from '../../../../src/features/tenant/components/payment-modal';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// Mock CreditCardField
vi.mock('@/features/auctions/components/form-fields/credit-card-field', () => ({
  __esModule: true,
  default: ({ register }: { register: (name: string) => { onChange: () => void; onBlur: () => void; name: string; ref: React.Ref<HTMLInputElement> } }) => {
    const { onChange, onBlur, name, ref } = register('cardNumber');
    return (
      <input
        data-testid="card-input"
        name={name}
        ref={ref}
        onChange={onChange}
        onBlur={onBlur}
      />
    );
  },
}));

// Mock hooks
const confirmAuctionPayment = vi.fn();
const payFine = vi.fn();
vi.mock('@/features/tenant/hooks/use-confirm-auction-payment', () => ({
  __esModule: true,
  default: () => ({ confirmAuctionPayment, loading: false }),
}));
vi.mock('@/features/tenant/hooks/use-pay-fine', () => ({
  __esModule: true,
  usePayAuctionFine: () => ({ payFine, loading: false }),
}));

describe('PaymentModal', () => {
  let baseProps: {
    rentalId: number;
    auctionId: number;
    amount: number;
    onClose: () => void;
    onSuccess: () => void;
    isFine?: boolean;
  };

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    baseProps = {
      rentalId: 1,
      auctionId: 2,
      amount: 123.45,
      onClose: vi.fn(),
      onSuccess: vi.fn(),
    };
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders for normal payment', () => {
    render(<PaymentModal {...baseProps} />);
    expect(screen.getByText(/complete your payment/i)).toBeInTheDocument();
    expect(screen.getByText(/\$123.45/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /pay now/i })).toBeInTheDocument();
  });

  it('renders for fine payment', () => {
    render(<PaymentModal {...baseProps} isFine />);
    expect(screen.getByText(/pay overdue fine/i)).toBeInTheDocument();
    expect(screen.getByText(/pay fine/i)).toBeInTheDocument();
  });
});
