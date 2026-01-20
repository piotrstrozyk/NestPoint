import { UseFormRegister } from 'react-hook-form';

type FormFieldProps = {
  type: string;
  placeholder: string;
  register: UseFormRegister<{
    email: string;
    password: string;
    username: string;
    firstName: string;
    lastName: string;
    phone: string;
    role: 'OWNER' | 'TENANT';
  }>;
  name:
    | 'email'
    | 'password'
    | 'username'
    | 'firstName'
    | 'lastName'
    | 'phone'
    | 'role';
  error?: string;
};

export function FormField({
  type,
  placeholder,
  register,
  name,
  error,
}: FormFieldProps) {
  return (
    <div>
      <input
        type={type}
        placeholder={placeholder}
        {...register(name)}
        className='w-full rounded border px-3 py-2'
      />
      {error && <p className='mt-1 text-sm text-red-500'>{error}</p>}
    </div>
  );
}
