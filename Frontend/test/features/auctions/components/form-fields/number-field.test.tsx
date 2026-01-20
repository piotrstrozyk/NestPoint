import NumberField from '@/features/auctions/components/form-fields/number-field';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

describe('NumberField', () => {
  const mockRegister = vi.fn().mockReturnValue({
    name: 'testNumber',
    onChange: vi.fn(),
    onBlur: vi.fn(),
    ref: vi.fn(),
  });

  it('renders with the correct label', () => {
    render(
      <NumberField
        name='testNumber'
        label='Test Number'
        register={mockRegister}
      />,
    );

    expect(screen.getByText('Test Number')).toBeInTheDocument();
  });

  it('renders a number input field', () => {
    const { container } = render(
      <NumberField
        name='testNumber'
        label='Test Number'
        register={mockRegister}
      />,
    );

    const numberInput = container.querySelector('input[type="number"]');
    expect(numberInput).toBeInTheDocument();
  });

  it('registers the input field with react-hook-form and valueAsNumber option', () => {
    render(
      <NumberField
        name='testNumber'
        label='Test Number'
        register={mockRegister}
      />,
    );

    expect(mockRegister).toHaveBeenCalledWith('testNumber', {
      valueAsNumber: true,
    });
  });

  it('uses default step value of 1 when step is not provided', () => {
    const { container } = render(
      <NumberField
        name='testNumber'
        label='Test Number'
        register={mockRegister}
      />,
    );

    const numberInput = container.querySelector('input[type="number"]');
    expect(numberInput).toHaveAttribute('step', '1');
  });

  it('uses custom step value when provided', () => {
    const { container } = render(
      <NumberField
        name='testNumber'
        label='Test Number'
        register={mockRegister}
        step='0.01'
      />,
    );

    const numberInput = container.querySelector('input[type="number"]');
    expect(numberInput).toHaveAttribute('step', '0.01');
  });

  it('displays error message when error is provided', () => {
    const errorMessage = 'This field is required';

    render(
      <NumberField
        name='testNumber'
        label='Test Number'
        register={mockRegister}
        error={{ message: errorMessage, type: 'required' }}
      />,
    );

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('does not display error message when no error is provided', () => {
    const { container } = render(
      <NumberField
        name='testNumber'
        label='Test Number'
        register={mockRegister}
      />,
    );

    const errorElement = container.querySelector('.text-red-500');
    expect(errorElement).not.toBeInTheDocument();
  });

  it('applies the correct CSS classes to the input', () => {
    const { container } = render(
      <NumberField
        name='testNumber'
        label='Test Number'
        register={mockRegister}
      />,
    );

    const numberInput = container.querySelector('input[type="number"]');
    expect(numberInput).toHaveClass(
      'w-full',
      'rounded',
      'border',
      'px-3',
      'py-2',
    );
  });
});
