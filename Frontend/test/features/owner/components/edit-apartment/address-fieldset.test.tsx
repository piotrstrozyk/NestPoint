import { ApartmentForm } from '@/features/add-apartment/schemas/add-apartment';
import { AddressFieldset } from '@/features/owner/components/edit-apartment/address-fieldset';
import { fireEvent, render, screen } from '@testing-library/react';
import {
  FieldErrors,
  useForm,
  UseFormRegister,
  UseFormSetValue,
} from 'react-hook-form';
import { describe, expect, it, vi } from 'vitest';

let mockAddressToPick: ApartmentForm['address'] = {
  street: 'Test St',
  apartmentNumber: '1',
  city: 'Test City',
  postalCode: '00-000',
  country: 'Testland',
};
vi.mock('@/features/owner/components/edit-apartment/picker-map-modal', () => ({
  __esModule: true,
  default: ({
    onSelectAddress,
  }: {
    onSelectAddress: (addr: ApartmentForm['address']) => void;
  }) => (
    <button
      onClick={() => onSelectAddress(mockAddressToPick)}
      data-testid='picker-map-modal-btn'
    >
      Pick on Map (Mock)
    </button>
  ),
}));

describe('AddressFieldset', () => {
  function setup(
    errors?: FieldErrors<ApartmentForm>['address'],
    setValueSpy?: UseFormSetValue<ApartmentForm>,
  ) {
    const Wrapper = () => {
      const { register, setValue } = useForm<ApartmentForm>();
      return (
        <AddressFieldset
          register={register as UseFormRegister<ApartmentForm>}
          errors={errors}
          setValue={setValueSpy || setValue}
        />
      );
    };
    render(<Wrapper />);
  }

  it('renders all address fields and labels', () => {
    setup();
    ['street', 'apartmentNumber', 'city', 'postalCode', 'country'].forEach(
      (field) => {
        expect(
          screen.getByLabelText(new RegExp(field, 'i')),
        ).toBeInTheDocument();
      },
    );
    expect(screen.getByText('Address')).toBeInTheDocument();
    expect(screen.getByTestId('picker-map-modal-btn')).toBeInTheDocument();
  });

  it('shows error messages for each field if present', () => {
    const errors: FieldErrors<ApartmentForm>['address'] = {
      street: { type: 'manual', message: 'Street error' },
      apartmentNumber: { type: 'manual', message: 'Apt error' },
      city: { type: 'manual', message: 'City error' },
      postalCode: { type: 'manual', message: 'Postal error' },
      country: { type: 'manual', message: 'Country error' },
    };
    setup(errors);
    (
      ['street', 'apartmentNumber', 'city', 'postalCode', 'country'] as const
    ).forEach((field) => {
      const err = errors[field];
      if (err && err.message) {
        expect(screen.getByText(err.message)).toBeInTheDocument();
      }
    });
  });

  it('calls setValue for all address fields when address is picked', () => {
    const setValue = vi.fn();
    mockAddressToPick = {
      street: 'Test St',
      apartmentNumber: '1',
      city: 'Test City',
      postalCode: '00-000',
      country: 'Testland',
    };
    setup(undefined, setValue);
    fireEvent.click(screen.getByTestId('picker-map-modal-btn'));
    expect(setValue).toHaveBeenCalledWith(
      'address.street',
      `${mockAddressToPick.street} ${mockAddressToPick.apartmentNumber}`,
    );
    expect(setValue).toHaveBeenCalledWith(
      'address.city',
      mockAddressToPick.city,
    );
    expect(setValue).toHaveBeenCalledWith(
      'address.postalCode',
      mockAddressToPick.postalCode,
    );
    expect(setValue).toHaveBeenCalledWith(
      'address.country',
      mockAddressToPick.country,
    );
  });

  it('labels are associated with inputs', () => {
    setup();
    ['street', 'apartmentNumber', 'city', 'postalCode', 'country'].forEach(
      (field) => {
        const label = screen.getByText(new RegExp(field, 'i'));
        const input = screen.getByLabelText(new RegExp(field, 'i'));
        expect(label.tagName.toLowerCase()).toBe('label');
        expect(input).toBeInTheDocument();
      },
    );
  });

  it('calls setValue with only street when apartmentNumber is empty or whitespace', () => {
    const setValue = vi.fn();
    mockAddressToPick = {
      street: 'Test St',
      apartmentNumber: '',
      city: 'Test City',
      postalCode: '00-000',
      country: 'Testland',
    };
    setup(undefined, setValue);
    fireEvent.click(screen.getByTestId('picker-map-modal-btn'));
    expect(setValue).toHaveBeenCalledWith('address.street', 'Test St');
    expect(setValue).toHaveBeenCalledWith(
      'address.city',
      mockAddressToPick.city,
    );
    expect(setValue).toHaveBeenCalledWith(
      'address.postalCode',
      mockAddressToPick.postalCode,
    );
    expect(setValue).toHaveBeenCalledWith(
      'address.country',
      mockAddressToPick.country,
    );
  });
});
