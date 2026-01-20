import { ApartmentForm } from '@/features/add-apartment/schemas/add-apartment';
import { FieldErrors, UseFormRegister } from 'react-hook-form';

export const specs: Array<[keyof ApartmentForm, number]> = [
  ['size', 1],
  ['rentalPrice', 0],
  ['numberOfRooms', 1],
  ['numberOfBeds', 1],
  ['poolFee', 0],
];

type Props = {
  register: UseFormRegister<ApartmentForm>;
  errors: FieldErrors<ApartmentForm>;
};

export function NumericInputs({ register, errors }: Props) {
  return (
    <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
      {specs.map(([name, min]) => {
        const inputId = `numeric-input-${name}`;
        return (
          <div key={name}>
            <label className='block font-medium capitalize' htmlFor={inputId}>
              {name}
            </label>
            <input
              id={inputId}
              type='number'
              {...register(name, { valueAsNumber: true })}
              min={min}
              className='w-full rounded border px-2 py-1'
            />
            {errors[name]?.message && (
              <p className='text-sm text-red-500' data-testid={`${name}-error`}>
                {errors[name]?.message as string}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
