import { ApartmentForm } from '@/features/add-apartment/schemas/add-apartment';
import { FieldErrors, UseFormRegister } from 'react-hook-form';

type Props = {
  register: UseFormRegister<ApartmentForm>;
  errors: FieldErrors<ApartmentForm>;
};

export function TitleDescription({ register, errors }: Props) {
  return (
    <div className='space-y-4'>
      <div>
        <label htmlFor='apartment-title' className='block font-medium'>
          Title
        </label>
        <input
          id='apartment-title'
          {...register('title')}
          className='w-full rounded border px-2 py-1'
        />
        {errors.title && (
          <p className='text-sm text-red-500'>{errors.title.message}</p>
        )}
      </div>
      <div>
        <label htmlFor='apartment-description' className='block font-medium'>
          Description
        </label>
        <textarea
          id='apartment-description'
          {...register('description')}
          className='w-full rounded border px-2 py-1'
        />
        {errors.description && (
          <p className='text-sm text-red-500'>{errors.description.message}</p>
        )}
      </div>
    </div>
  );
}
