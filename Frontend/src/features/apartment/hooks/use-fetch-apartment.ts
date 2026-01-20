import { Apartment } from '@/features/apartment-list/types/apartment';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import { env } from 'next-runtime-env';

export default function useFetchApartment(apartmentId: number) {
  const { data: session, status } = useSession();

  const enabled = (status === 'authenticated' || status === 'unauthenticated') && !!apartmentId;

  const {
    data: apartment,
    isLoading: loading,
    error,
    refetch,
  } = useQuery<Apartment, Error>({
    queryKey: ['apartment', apartmentId, session?.accessToken],
    queryFn: async () => {
      const baseURL = env('NEXT_PUBLIC_API_BASE_URL')!;
      const apiClient = axios.create({ baseURL });
      const res = await apiClient.get<Apartment>(`/apartments/${apartmentId}`, {
        headers: session?.accessToken
          ? { Authorization: `Bearer ${session.accessToken}` }
          : undefined,
      });
      return res.data;
    },
    enabled,
    staleTime: 60 * 1000,
  });

  return { apartment, loading, error: error ?? null, refetch };
}
