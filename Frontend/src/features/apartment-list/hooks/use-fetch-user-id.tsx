import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import { env } from 'next-runtime-env';

interface Tenant {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  roles: string[];
  ownedApartments: object[];
  rentals: unknown[];
}

async function fetchTenants(token?: string): Promise<Tenant[]> {
  const baseURL = env('NEXT_PUBLIC_API_BASE_URL')!;
  const apiClient = axios.create({ baseURL });
  const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
  const { data } = await apiClient.get<Tenant[]>('/tenants', { headers });
  return data;
}

export default function useFetchUserId() {
  const { data: session, status } = useSession();
  const username = session?.user?.name;

  const query = useQuery<number | null, Error>({
    queryKey: ['userId', session?.accessToken, username],
    queryFn: async () => {
      const tenants = await fetchTenants(session?.accessToken);
      const matchedTenant = tenants.find((t) => t.username === username);
      return matchedTenant ? matchedTenant.id : null;
    },
    enabled: status === 'authenticated' && !!username,
  });

  return {
    userId: query.data ?? null,
    loading: query.isLoading,
    error: query.error ?? null,
  };
}
