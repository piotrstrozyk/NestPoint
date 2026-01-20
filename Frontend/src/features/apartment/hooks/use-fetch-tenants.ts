import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import { env } from 'next-runtime-env';

export interface Tenant {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  roles: string[];
  ownedApartments: unknown[];
  rentals: unknown[];
}

export default function useFetchTenants() {
  const baseURL = env('NEXT_PUBLIC_API_BASE_URL')!;
  const apiClient = axios.create({ baseURL });
  const { data: session, status } = useSession();

  const query = useQuery<Tenant[], Error>({
    queryKey: ['tenants', session?.accessToken],
    queryFn: async () => {
      const headers = session?.accessToken
        ? { Authorization: `Bearer ${session.accessToken}` }
        : undefined;
      const { data } = await apiClient.get<Tenant[]>('/tenants', { headers });
      return data;
    },
    enabled: status !== 'loading',
  });

  return {
    tenants: query.data ?? [],
    loading: query.isLoading,
    error: query.error ?? null,
    refetch: query.refetch,
  };
}
