import { ApartmentForm } from '@/features/add-apartment/schemas/add-apartment';
import { FieldErrors, UseFormRegister } from 'react-hook-form';

const bools = [
  'furnished',
  'wifi',
  'petsAllowed',
  'parkingSpace',
  'disabilityFriendly',
] as const;

type AmenitiesProps = {
  register: UseFormRegister<ApartmentForm>;
  errors: FieldErrors<ApartmentForm>;
};

export function AmenitiesCheckboxes({ register }: AmenitiesProps) {
  return (
    <div className='space-y-2'>
      {bools.map((field) => (
        <label key={field} className='flex items-center space-x-2'>
          <input type='checkbox' {...register(field)} />
          <span className='capitalize'>{field}</span>
        </label>
      ))}
    </div>
  );
}
