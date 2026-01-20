import { ApartmentForm } from '@/features/add-apartment/schemas/add-apartment';
import { Accessibility, Check, Dog, ParkingCircle, Wifi } from 'lucide-react';
import { FieldErrors, UseFormRegister } from 'react-hook-form';

const amenities: Array<[keyof ApartmentForm, string, React.ElementType]> = [
  ['furnished', 'Fully furnished apartment', Check],
  ['wifi', 'WiFi internet included', Wifi],
  ['petsAllowed', 'Pets are welcome', Dog],
  ['parkingSpace', 'Parking space available', ParkingCircle],
  ['disabilityFriendly', 'Accessible for disabilities', Accessibility],
];

type AmenitiesProps = {
  register: UseFormRegister<ApartmentForm>;
  errors: FieldErrors<ApartmentForm>;
};

export function AmenitiesCheckboxes({ register }: AmenitiesProps) {
  return (
    <div className='space-y-3'>
      {amenities.map(([field, label, Icon]) => (
        <label
          key={field}
          className='flex cursor-pointer items-center rounded p-2 transition hover:bg-gray-100'
        >
          <div className='flex h-5 items-center'>
            <input
              type='checkbox'
              {...register(field)}
              className='text-primary h-4 w-4 rounded border-gray-300 focus:ring-indigo-500'
            />
          </div>
          <div className='ml-3 flex items-center'>
            <span className='mr-2'>
              <Icon className='text-primary h-4 w-4' key={field + '-icon'} />
            </span>
            <span className='text-sm text-gray-700'>{label}</span>
          </div>
        </label>
      ))}
    </div>
  );
}
