import { FieldError, UseFormRegisterReturn } from 'react-hook-form';

interface InputFieldProps {
  type: string;
  placeholder: string;
  registration: UseFormRegisterReturn;
  error?: FieldError;
}

export function InputField({
  type,
  placeholder,
  registration,
  error,
}: InputFieldProps) {
  return (
    <div>
      <input
        type={type}
        placeholder={placeholder}
        className='w-full rounded border px-3 py-2'
        {...registration}
      />
      {error && <p className='mt-1 text-sm text-red-500'>{error.message}</p>}
    </div>
  );
}
