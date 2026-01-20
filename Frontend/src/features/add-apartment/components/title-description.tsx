import { ApartmentForm } from '@/features/add-apartment/schemas/add-apartment';
import { AlertCircle } from 'lucide-react';
import { FieldErrors, UseFormRegister } from 'react-hook-form';

type Props = {
  register: UseFormRegister<ApartmentForm>;
  errors: FieldErrors<ApartmentForm>;
};

export function TitleDescription({ register, errors }: Props) {
  return (
    <div className='space-y-4'>
      <div>
        <label className='mb-1 block text-sm font-medium text-gray-700'>
          Title
        </label>
        <input
          {...register('title')}
          placeholder='e.g. Cozy Studio in City Center'
          className='w-full rounded-md border-gray-300 p-2 text-gray-800 shadow-sm focus:border-indigo-500 focus:ring-indigo-500'
        />
        {errors.title && (
          <p className='mt-1 flex items-center text-sm text-red-600'>
            <AlertCircle className='mr-1 h-4 w-4' />
            {errors.title.message}
          </p>
        )}
      </div>
      <div>
        <label className='mb-1 block text-sm font-medium text-gray-700'>
          Description
        </label>
        <textarea
          {...register('description')}
          rows={4}
          placeholder='Describe your property, highlight key features and nearby amenities'
          className='w-full rounded-md border-gray-300 p-2 text-gray-800 shadow-sm focus:border-indigo-500 focus:ring-indigo-500'
        />
        {errors.description && (
          <p className='mt-1 flex items-center text-sm text-red-600'>
            <AlertCircle className='mr-1 h-4 w-4' />
            {errors.description.message}
          </p>
        )}
      </div>
    </div>
  );
}
