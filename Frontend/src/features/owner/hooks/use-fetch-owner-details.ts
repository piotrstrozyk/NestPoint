import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import { env } from 'next-runtime-env';

export interface Owner {
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

export default function useFetchOwner(ownerId: number) {
  const { data: session, status: sessStatus } = useSession();

  const query = useQuery({
    queryKey: ['ownerDetails', ownerId, session?.accessToken],
    queryFn: async () => {
      const baseURL = env('NEXT_PUBLIC_API_BASE_URL')!;
      const apiClient = axios.create({ baseURL });
      const headers = session?.accessToken
        ? { Authorization: `Bearer ${session.accessToken}` }
        : undefined;
      const res = await apiClient.get<Owner>(`/owners/${ownerId}`, { headers });
      return res.data;
    },
    enabled: !!ownerId && sessStatus === 'authenticated',
  });

  return {
    owner: query.data,
    loading: query.isLoading,
    error: query.error as Error | null,
  };
}
