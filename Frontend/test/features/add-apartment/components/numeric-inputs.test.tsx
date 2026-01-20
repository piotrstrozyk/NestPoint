import {
  NumericInputs,
  specs,
} from '@/features/add-apartment/components/numeric-inputs';
import type { ApartmentForm } from '@/features/add-apartment/schemas/add-apartment';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import type { UseFormRegister, UseFormRegisterReturn } from 'react-hook-form';
import { describe, expect, it, vi } from 'vitest';

describe('<NumericInputs />', () => {
  // Mock `register` to return the minimal shape and allow us to inspect calls
  const makeRegisterMock = () => {
    const register = vi.fn().mockImplementation(
      (name: keyof ApartmentForm): UseFormRegisterReturn => ({
        name: name as string,
        onChange: vi.fn(),
        onBlur: vi.fn(),
        ref: vi.fn(),
      }),
    );
    return register;
  };

  it('displays an error message when provided in errors prop', () => {
    const register = makeRegisterMock();
    // Pick one field to attach an error to
    const [fieldWithError] = specs[2]; // e.g. 'numberOfRooms'
    const message = 'Must be at least 1';
    const errors: Record<string, { message: string }> = {
      [fieldWithError]: { message },
    };

    render(
      <NumericInputs
        register={register as unknown as UseFormRegister<ApartmentForm>}
        errors={errors}
      />,
    );

    // The <p> with the error text should be in the document
    const errNode = screen.getByText(message);
    expect(errNode).toBeInTheDocument();
    // Updated class check to match the component implementation
    expect(errNode).toHaveClass('text-red-600');

    // Check that the AlertCircle icon is present alongside the error message
    const errContainer = errNode.closest('p');
    expect(errContainer).toHaveClass('flex');
    expect(errContainer).toHaveClass('items-center');
  });

  it('applies correct styling to input containers', () => {
    const register = makeRegisterMock();
    const { container } = render(
      <NumericInputs
        register={register as unknown as UseFormRegister<ApartmentForm>}
        errors={{}}
      />,
    );

    // Check that each input is properly contained
    const inputContainers = container.querySelectorAll(
      '.rounded-md.border.border-gray-100.bg-white.p-3.shadow-sm',
    );
    expect(inputContainers).toHaveLength(specs.length);

    // Check grid layout
    const gridContainer = container.firstChild;
    expect(gridContainer).toHaveClass('grid');
    expect(gridContainer).toHaveClass('grid-cols-1');
    expect(gridContainer).toHaveClass('md:grid-cols-2');
    expect(gridContainer).toHaveClass('lg:grid-cols-3');
  });
});
