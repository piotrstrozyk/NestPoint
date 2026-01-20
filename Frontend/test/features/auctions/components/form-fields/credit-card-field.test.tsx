import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, vi, expect } from 'vitest';
import CreditCardField from '@/features/auctions/components/form-fields/credit-card-field';

function setup(props = {}) {
  const onChange = vi.fn();
  const onBlur = vi.fn();
  const ref = vi.fn();
  const register = (name: string) => ({ name, onChange, onBlur, ref });
  render(
    <CreditCardField
      name="cardNumber"
      label="Credit Card Number"
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      register={register as any}
      {...props}
    />
  );
  return { onChange, onBlur };
}

describe('CreditCardField', () => {
  it('renders label and input', () => {
    setup();
    expect(screen.getByLabelText('Credit Card Number')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('1234 5678 90')).toBeInTheDocument();
  });

  it('formats input as groups of 4 digits, max 10 digits', async () => {
    setup();
    const input = screen.getByLabelText('Credit Card Number');
    await userEvent.type(input, '1234567890');
    expect(input).toHaveValue('1234 5678 90');
    // Typing more than 10 digits
    await userEvent.type(input, '12345');
    expect(input).toHaveValue('1234 5678 90');
  });

  it('only allows digits and ignores non-numeric input', async () => {
    setup();
    const input = screen.getByLabelText('Credit Card Number');
    await userEvent.type(input, '12ab34!@#56');
    expect(input).toHaveValue('1234 56');
  });

  it('shows digit count and color feedback', async () => {
    setup();
    const input = screen.getByLabelText('Credit Card Number');
    // Initially gray
    expect(screen.getByText('0/10')).toHaveClass('text-gray-400');
    await userEvent.type(input, '1234');
    expect(screen.getByText('4/10')).toHaveClass('text-amber-600');
    await userEvent.type(input, '567890');
    expect(screen.getByText('10/10')).toHaveClass('text-green-600');
  });

  it('shows warning if not exactly 10 digits', async () => {
    setup();
    const input = screen.getByLabelText('Credit Card Number');
    await userEvent.type(input, '12345');
    expect(screen.getByText('Card number must be exactly 10 digits')).toBeInTheDocument();
  });

  it('shows error message if error prop is passed', () => {
    setup({ error: { message: 'Invalid card' } });
    expect(screen.getByText('Invalid card')).toBeInTheDocument();
    expect(screen.queryByText('Card number must be exactly 10 digits')).not.toBeInTheDocument();
  });

  it('calls onChange with raw digits', async () => {
    const { onChange } = setup();
    const input = screen.getByLabelText('Credit Card Number');
    await userEvent.type(input, '1234 5678 90');
    expect(onChange).toHaveBeenCalled();
    // Last call should have value: '1234567890'
    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0];
    expect(lastCall.target.value).toBe('1234567890');
  });

  it('calls onBlur with raw digits', async () => {
    const { onBlur } = setup();
    const input = screen.getByLabelText('Credit Card Number');
    await userEvent.type(input, '1234 5');
    fireEvent.blur(input);
    expect(onBlur).toHaveBeenCalled();
    const lastCall = onBlur.mock.calls[onBlur.mock.calls.length - 1][0];
    expect(lastCall.target.value).toBe('12345');
  });
});
