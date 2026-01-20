import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import { env } from 'next-runtime-env';

type Rental = { apartmentId: number };

export default function useFetchTenantRentals(apartmentId: number) {
  const { data: session, status } = useSession();

  const enabled =
    status === 'authenticated' && !!session?.user?.id && !!apartmentId;

  const {
    data: rentals,
    isLoading: loading,
    error,
  } = useQuery<Rental[], Error>({
    queryKey: [
      'tenant-completed-rentals',
      session?.user?.id,
      apartmentId,
      session?.accessToken,
    ],
    queryFn: async () => {
      const baseURL = env('NEXT_PUBLIC_API_BASE_URL')!;
      const apiClient = axios.create({ baseURL });
      const res = await apiClient.get<Rental[]>(
        `/rentals/my-rentals/tenant/${session!.user!.id}`,
        {
          params: { status: 'COMPLETED' },
          headers: session?.accessToken
            ? { Authorization: `Bearer ${session.accessToken}` }
            : undefined,
        },
      );
      return res.data;
    },
    enabled,
    staleTime: 60 * 1000,
  });

  const hasCompletedRental = !!rentals?.some(
    (r) => r.apartmentId === apartmentId,
  );

  return { hasCompletedRental, loading, error: error ?? null };
}
