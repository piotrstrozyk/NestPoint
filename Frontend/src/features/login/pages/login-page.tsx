'use client';

import { AuthContainer } from '@/features/login/components/auth-container';
import { AuthFooter } from '@/features/login/components/auth-footer';
import { FormErrorMessage } from '@/features/login/components/form-error-message';
import { InputField } from '@/features/login/components/input-field';
import { LoadingButton } from '@/features/login/components/loading-button';
import {
  LoginFormData,
  loginSchema,
} from '@/features/login/schemas/login-schema';
import { zodResolver } from '@hookform/resolvers/zod';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onChange',
    reValidateMode: 'onChange',
  });

  useEffect(() => {
    const errorCode = params.get('error');
    if (errorCode) {
      setErrorMsg('Session expired, please sign in again.');
    }
  }, [params]);

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setErrorMsg(null);

    const result = await signIn('credentials', {
      redirect: false,
      username: data.username,
      password: data.password,
    });

    if (result?.error) {
      setErrorMsg('Invalid username or password');
    } else {
      router.push('/');
    }

    setIsLoading(false);
  };

  return (
    <AuthContainer title='Sign in'>
      <FormErrorMessage message={errorMsg} />
      <form className='space-y-6' onSubmit={handleSubmit(onSubmit)}>
        <InputField
          type='text'
          placeholder='Username'
          registration={register('username')}
          error={errors.username}
        />
        <InputField
          type='password'
          placeholder='Password'
          registration={register('password')}
          error={errors.password}
        />
        <LoadingButton
          isLoading={isLoading}
          disabled={!isValid}
          loadingText='Signing in…'
          text='Sign In'
        />
      </form>
      <AuthFooter
        text="Don't have an account?"
        linkText='Register'
        linkHref='/register'
      />
    </AuthContainer>
  );
}
