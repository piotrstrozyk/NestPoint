import {
  RegistrationData,
  registrationSchema,
} from '@/features/register/schemas/registration-schema';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { FormField } from './form-field';
import { SelectField } from './select-field';

type RegistrationFormProps = {
  onSubmit: (data: RegistrationData) => void;
  isLoading: boolean;
};

export function RegistrationForm({
  onSubmit,
  isLoading,
}: RegistrationFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<RegistrationData>({
    resolver: zodResolver(registrationSchema),
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: { role: 'TENANT' },
  });

  const roleOptions = [
    { value: 'OWNER', label: 'Owner' },
    { value: 'TENANT', label: 'Tenant' },
  ];

  return (
    <form className='space-y-6' onSubmit={handleSubmit(onSubmit)}>
      <FormField
        type='text'
        placeholder='Username'
        register={register}
        name='username'
        error={errors.username?.message}
      />
      <FormField
        type='email'
        placeholder='Email'
        register={register}
        name='email'
        error={errors.email?.message}
      />
      <FormField
        type='password'
        placeholder='Password'
        register={register}
        name='password'
        error={errors.password?.message}
      />
      <FormField
        type='text'
        placeholder='First Name'
        register={register}
        name='firstName'
        error={errors.firstName?.message}
      />
      <FormField
        type='text'
        placeholder='Last Name'
        register={register}
        name='lastName'
        error={errors.lastName?.message}
      />
      <FormField
        type='text'
        placeholder='Phone (xxx-xxx-xxxx)'
        register={register}
        name='phone'
        error={errors.phone?.message}
      />
      <SelectField
        register={register}
        name='role'
        error={errors.role?.message}
        options={roleOptions}
      />
      <button
        type='submit'
        disabled={!isValid || isLoading}
        className='w-full rounded bg-indigo-600 py-2 text-white disabled:opacity-50'
      >
        {isLoading ? 'Registering…' : 'Register'}
      </button>
    </form>
  );
}
