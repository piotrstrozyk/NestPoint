import type { ApartmentForm } from '@/features/add-apartment/schemas/add-apartment';
import {
  NumericInputs,
  specs,
} from '@/features/owner/components/edit-apartment/numeric-inputs';
import { render, screen } from '@testing-library/react';
import type { FieldErrors, UseFormRegister } from 'react-hook-form';
import { vi } from 'vitest';

// Helper to create a type-safe mock register function
const mockRegister: UseFormRegister<ApartmentForm> = ((
  name: keyof ApartmentForm,
) => ({
  name: name as string,
  onChange: vi.fn(),
  onBlur: vi.fn(),
  ref: vi.fn(),
})) as UseFormRegister<ApartmentForm>;

describe('NumericInputs', () => {
  it('renders all numeric fields with correct labels and min values', () => {
    render(<NumericInputs register={mockRegister} errors={{}} />);
    specs.forEach(([name, min]) => {
      // Label
      expect(screen.getByText(name, { selector: 'label' })).toBeInTheDocument();
      // Input
      const input = screen.getByLabelText(name) as HTMLInputElement;
      expect(input).toBeInTheDocument();
      expect(input.type).toBe('number');
      expect(input.min).toBe(min.toString());
    });
  });

  it('shows error messages for fields with errors', () => {
    const errors: FieldErrors<ApartmentForm> = {
      size: { message: 'Size error', type: 'min' },
      rentalPrice: { message: 'Price error', type: 'min' },
    };
    render(<NumericInputs register={mockRegister} errors={errors} />);
    expect(screen.getByText('Size error')).toBeInTheDocument();
    expect(screen.getByText('Price error')).toBeInTheDocument();
  });

  it('does not show error messages when errors are absent', () => {
    render(<NumericInputs register={mockRegister} errors={{}} />);
    specs.forEach(([name]) => {
      // No error message should be present
      const error = screen.queryByTestId(`${name}-error`);
      expect(error).toBeNull();
    });
  });

  it('labels are associated with inputs for accessibility', () => {
    render(<NumericInputs register={mockRegister} errors={{}} />);
    specs.forEach(([name]) => {
      const label = screen.getByText(name, { selector: 'label' });
      const input = screen.getByLabelText(name);
      expect(label).toBeInTheDocument();
      expect(input).toBeInTheDocument();
    });
  });
});
