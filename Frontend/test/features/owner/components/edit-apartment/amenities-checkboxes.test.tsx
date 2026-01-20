import { ApartmentForm } from '@/features/add-apartment/schemas/add-apartment';
import { AmenitiesCheckboxes } from '@/features/owner/components/edit-apartment/amenities-checkboxes';
import { fireEvent, render, screen } from '@testing-library/react';
import { useForm, UseFormRegister } from 'react-hook-form';
import { describe, expect, it, vi } from 'vitest';

const bools = [
  'furnished',
  'wifi',
  'petsAllowed',
  'parkingSpace',
  'disabilityFriendly',
] as const;

describe('AmenitiesCheckboxes', () => {
  function setup() {
    const Wrapper = () => {
      const { register, watch } = useForm<ApartmentForm>({ defaultValues: {} });
      return (
        <>
          <AmenitiesCheckboxes
            register={register as UseFormRegister<ApartmentForm>}
            errors={{}}
          />
          {/* Expose watch for test assertions */}
          <div data-testid='watched'>{JSON.stringify(watch())}</div>
        </>
      );
    };
    render(<Wrapper />);
  }

  it('renders all amenity checkboxes and labels', () => {
    setup();
    bools.forEach((field) => {
      const checkbox = screen.getByLabelText(new RegExp(field, 'i'));
      expect(checkbox).toBeInTheDocument();
      expect(checkbox).toHaveAttribute('type', 'checkbox');
    });
  });

  it('labels are associated with checkboxes', () => {
    setup();
    bools.forEach((field) => {
      const label = screen.getByText(new RegExp(field, 'i'), {
        selector: 'span',
      });
      expect(label.tagName.toLowerCase()).toBe('span');
      const checkbox = screen.getByLabelText(new RegExp(field, 'i'));
      expect(checkbox).toBeInTheDocument();
    });
  });

  it('checkboxes update form state when clicked', () => {
    setup();
    bools.forEach((field) => {
      const checkbox = screen.getByLabelText(
        new RegExp(field, 'i'),
      ) as HTMLInputElement;
      expect(checkbox.checked).toBe(false);
      fireEvent.click(checkbox);
      // After click, the watched value should be true
      const watched = JSON.parse(
        screen.getByTestId('watched').textContent || '{}',
      );
      expect(watched[field]).toBe(true);
      fireEvent.click(checkbox);
      const watched2 = JSON.parse(
        screen.getByTestId('watched').textContent || '{}',
      );
      expect(watched2[field]).toBe(false);
    });
  });

  it('calls register for each amenity field', () => {
    const register: UseFormRegister<ApartmentForm> = vi.fn(
      () => ({}),
    ) as unknown as UseFormRegister<ApartmentForm>;
    render(<AmenitiesCheckboxes register={register} errors={{}} />);
    bools.forEach((field) => {
      expect(register).toHaveBeenCalledWith(field);
    });
  });
});
