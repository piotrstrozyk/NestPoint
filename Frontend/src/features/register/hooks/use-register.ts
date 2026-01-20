'use client';

import { RegistrationData } from '@/features/register/schemas/registration-schema';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { signIn } from 'next-auth/react';
import { env } from 'next-runtime-env';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export function useRegister() {
  const router = useRouter();

  const mutation = useMutation({
    mutationFn: async (data: RegistrationData) => {
      const baseURL = env('NEXT_PUBLIC_API_BASE_URL')!;
      const apiClient = axios.create({ baseURL });
      await apiClient.post('/register', data);
      toast.success('Registration successful! Logging you in…');
      // Automatically log in the user
      const result = await signIn('credentials', {
        redirect: false,
        username: data.username,
        password: data.password,
      });
      if (result?.error) {
        toast.error('Auto-login failed');
        throw new Error('Auto-login failed');
      } else {
        toast.success('Logged in successfully!');
        router.push('/');
      }
    },
    onError: (err: unknown) => {
      let msg = 'Registration failed';
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        msg = err.response.data.message;
      }
      toast.error(msg);
    },
  });

  return {
    register: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error
      ? mutation.error instanceof Error
        ? mutation.error.message
        : String(mutation.error)
      : null,
  };
}
