'use client';

import { useRegister } from '@/features/register/hooks/use-register';
import { RegistrationData } from '@/features/register/schemas/registration-schema';
import Link from 'next/link';
import { RegistrationForm } from '../components/registration-form';

export default function RegistrationPage() {
  const { register: registerUser, isLoading, error } = useRegister();

  const handleSubmit = (data: RegistrationData) => {
    registerUser(data);
  };

  return (
    <div className='bg-primary flex min-h-screen items-center justify-center'>
      <div className='w-full max-w-md space-y-8 rounded-xl bg-white p-8 shadow-lg'>
        <h2 className='text-center text-3xl font-bold text-gray-900'>
          Create an Account
        </h2>
        {error && <p className='text-center text-red-500'>{error}</p>}
        <RegistrationForm onSubmit={handleSubmit} isLoading={isLoading} />
        <p className='text-center text-sm text-gray-600'>
          Already have an account?{' '}
          <Link href='/login' className='text-indigo-600 hover:underline'>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
