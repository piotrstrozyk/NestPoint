import { User } from '@/core/types/user';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import { env } from 'next-runtime-env';

export default function useFetchUsers() {
  const { data: session, status } = useSession();

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-users', session?.accessToken],
    queryFn: async () => {
      const baseURL = env('NEXT_PUBLIC_API_BASE_URL')!;
      const apiClient = axios.create({ baseURL });
      const res = await apiClient.get<User[]>('/admin/users', {
        headers: session?.accessToken
          ? { Authorization: `Bearer ${session.accessToken}` }
          : undefined,
      });
      return res.data;
    },
    enabled: status === 'authenticated' || status === 'unauthenticated',
    retry: false,
  });

  return {
    users: data ?? [],
    loading: isLoading,
    error: error as Error | null,
  };
}
