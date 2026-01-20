'use client';

import { ApartmentForm } from '@/features/add-apartment/schemas/add-apartment';
import {
  AlertCircle,
  Building,
  Compass,
  Home,
  Map,
  MapPin,
} from 'lucide-react';
import { FieldErrors, UseFormRegister, UseFormSetValue } from 'react-hook-form';
import PickerMapModal from './picker-map-modal';

const addressFields = [
  {
    name: 'street' as const,
    icon: <MapPin className='h-4 w-4 text-gray-500' />,
    placeholder: 'Street name',
  },
  {
    name: 'apartmentNumber' as const,
    icon: <Home className='h-4 w-4 text-gray-500' />,
    placeholder: 'Apt. number (optional)',
  },
  {
    name: 'city' as const,
    icon: <Building className='h-4 w-4 text-gray-500' />,
    placeholder: 'City name',
  },
  {
    name: 'postalCode' as const,
    icon: <Compass className='h-4 w-4 text-gray-500' />,
    placeholder: 'Postal code',
  },
  {
    name: 'country' as const,
    icon: <Map className='h-4 w-4 text-gray-500' />,
    placeholder: 'Country',
  },
];

type Props = {
  register: UseFormRegister<ApartmentForm>;
  errors: FieldErrors<ApartmentForm>['address'];
  setValue: UseFormSetValue<ApartmentForm>;
};

export function AddressFieldset({ register, errors, setValue }: Props) {
  return (
    <div className='space-y-4'>
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
        {addressFields.map(({ name, icon, placeholder }) => (
          <div key={name} className='relative'>
            <div className='pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3'>
              {icon}
            </div>
            <input
              {...register(`address.${name}`)}
              placeholder={placeholder}
              className='block w-full rounded-md border border-gray-300 py-2 pr-3 pl-10 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none'
            />
            {errors?.[name] && (
              <p className='mt-1 flex items-center text-sm text-red-600'>
                <AlertCircle className='mr-1 h-4 w-4' />
                {errors[name]?.message}
              </p>
            )}
          </div>
        ))}
      </div>

      <div className='rounded-lg border border-indigo-100 bg-indigo-50 p-4'>
        <div className='flex items-start'>
          <div className='mt-1 flex-shrink-0'>
            <svg
              className='text-primary h-5 w-5'
              fill='currentColor'
              viewBox='0 0 20 20'
            >
              <path
                fillRule='evenodd'
                d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z'
                clipRule='evenodd'
              />
            </svg>
          </div>
          <div className='ml-3 flex-1'>
            <p className='text-primary text-sm'>
              For accurate location placement, please use the map picker. This
              helps visitors find your property more easily.
            </p>
            <div className='mt-3'>
              <PickerMapModal
                onSelectAddress={(addr) => {
                  setValue(
                    'address.street',
                    addr.street +
                      (addr.apartmentNumber ? ` ${addr.apartmentNumber}` : ''),
                  );
                  setValue('address.city', addr.city);
                  setValue('address.postalCode', addr.postalCode);
                  setValue('address.country', addr.country);
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
