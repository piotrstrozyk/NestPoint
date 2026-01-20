import { RegisterFormFields } from '../types/register';

type SelectFieldProps = {
  register: (name: keyof RegisterFormFields) => { [key: string]: unknown };
  name: keyof RegisterFormFields;
  error?: string;
  options: { value: string; label: string }[];
};

export function SelectField({
  register,
  name,
  error,
  options,
}: SelectFieldProps) {
  return (
    <div>
      <select {...register(name)} className='w-full rounded border px-3 py-2'>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className='mt-1 text-sm text-red-500'>{error}</p>}
    </div>
  );
}
