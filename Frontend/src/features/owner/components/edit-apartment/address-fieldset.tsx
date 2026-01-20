'use client';

import { ApartmentForm } from '@/features/add-apartment/schemas/add-apartment';
import { FieldErrors, UseFormRegister, UseFormSetValue } from 'react-hook-form';
import PickerMapModal from './picker-map-modal';

const fields = [
  'street',
  'apartmentNumber',
  'city',
  'postalCode',
  'country',
] as const;

type Props = {
  register: UseFormRegister<ApartmentForm>;
  errors: FieldErrors<ApartmentForm>['address'];
  setValue: UseFormSetValue<ApartmentForm>;
};

export function AddressFieldset({ register, errors, setValue }: Props) {
  return (
    <fieldset className='space-y-4 rounded border p-4'>
      <legend className='font-semibold'>Address</legend>

      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
        {fields.map((field) => (
          <div key={field}>
            <label className='block capitalize' htmlFor={`address-${field}`}>
              {field}
            </label>
            <input
              id={`address-${field}`}
              {...register(`address.${field}` as const)}
              className='w-full rounded border px-2 py-1'
            />
            {errors?.[field] && (
              <p className='text-sm text-red-500'>{errors[field]?.message}</p>
            )}
          </div>
        ))}
      </div>
      <div className='flex justify-end'>
        <PickerMapModal
          onSelectAddress={(addr) => {
            // fill each form field
            setValue(
              'address.street',
              addr.street +
                (addr.apartmentNumber && addr.apartmentNumber.trim()
                  ? ` ${addr.apartmentNumber}`
                  : ''),
            );
            setValue('address.city', addr.city);
            setValue('address.postalCode', addr.postalCode);
            setValue('address.country', addr.country);
          }}
        />
      </div>
    </fieldset>
  );
}
