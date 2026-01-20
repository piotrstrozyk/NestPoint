import {
  FieldError,
  FieldPath,
  FieldValues,
  UseFormRegister,
} from 'react-hook-form';

interface NumberFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> {
  name: TName;
  label: string;
  register: UseFormRegister<TFieldValues>;
  error?: FieldError;
  step?: string;
}

export default function NumberField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  name,
  label,
  register,
  error,
  step = '1',
}: NumberFieldProps<TFieldValues, TName>) {
  return (
    <div>
      <label className='block text-sm font-medium'>{label}</label>
      <input
        type='number'
        step={step}
        {...register(name, { valueAsNumber: true })}
        className='w-full rounded border px-3 py-2'
      />
      {error && <p className='text-sm text-red-500'>{error.message}</p>}
    </div>
  );
}
