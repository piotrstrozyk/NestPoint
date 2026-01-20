import { ApartmentForm } from '@/features/add-apartment/schemas/add-apartment';
import { AlertCircle } from 'lucide-react';
import { FieldErrors, UseFormRegister } from 'react-hook-form';

export const specs: Array<[keyof ApartmentForm, number, string, string]> = [
  ['size', 1, 'm²', 'Total area of the property'],
  ['rentalPrice', 0, 'zł', 'Monthly rental price'],
  ['numberOfRooms', 1, '', 'Total number of rooms'],
  ['numberOfBeds', 1, '', 'Number of beds available'],
  ['poolFee', 0, 'zł', 'Additional fee for pool access (if applicable)'],
];

type Props = {
  register: UseFormRegister<ApartmentForm>;
  errors: FieldErrors<ApartmentForm>;
};

export function NumericInputs({ register, errors }: Props) {
  return (
    <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
      {specs.map(([name, min, unit, description]) => (
        <div
          key={name}
          className='rounded-md border border-gray-100 bg-white p-3 shadow-sm'
        >
          <label className='mb-1 block text-sm font-medium text-gray-700 capitalize'>
            {name.replace(/([A-Z])/g, ' $1').trim()}
          </label>
          <div className='relative'>
            <input
              type='number'
              {...register(name, { valueAsNumber: true })}
              min={min}
              className='w-full rounded-md border-gray-300 p-2 pr-12 text-gray-800 shadow-sm focus:border-indigo-500 focus:ring-indigo-500'
            />
            <div className='pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-sm text-gray-500'>
              {unit}
            </div>
          </div>
          <p className='mt-1 text-xs text-gray-500'>{description}</p>
          {errors[name]?.message && (
            <p className='mt-1 flex items-center text-sm text-red-600'>
              <AlertCircle className='mr-1 h-4 w-4' />
              {errors[name]?.message as string}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
