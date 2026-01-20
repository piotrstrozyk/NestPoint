import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import { env } from 'next-runtime-env';

export function useFetchStats() {
  const { data: session, status: sessStatus } = useSession();

  const query = useQuery({
    queryKey: ['stats', session?.accessToken],
    queryFn: async () => {
      const baseURL = env('NEXT_PUBLIC_API_BASE_URL')!;
      const apiClient = axios.create({ baseURL });
      const headers = session?.accessToken
        ? { Authorization: `Bearer ${session.accessToken}` }
        : undefined;
      try {
        const [auctionsRes, tenantsRes, apartmentsRes, rentalsRes] =
          await Promise.all([
            apiClient.get('/auctions/active', { headers }),
            apiClient.get('/tenants', { headers }),
            apiClient.get('/apartments', { headers }),
            apiClient.get('/rentals', { headers }),
          ]);
        return {
          activeAuctions: auctionsRes.data.length,
          tenants: tenantsRes.data.length,
          apartments: apartmentsRes.data.length,
          rentals: rentalsRes.data.length,
          propertyTypes: apartmentsRes.data.reduce(
            (
              acc: Record<string, number>,
              apartment: { propertyType?: string }
            ) => {
              const type = apartment.propertyType || 'unknown';
              acc[type] = (acc[type] || 0) + 1;
              return acc;
            },
            {}
          ),
        };
      } catch (err) {
        console.warn('Failed to fetch stats, falling back to defaults', err);
        return {
          activeAuctions: 10,
          tenants: 20,
          apartments: 40,
          rentals: 18,
        };
      }
    },
    enabled: sessStatus === 'authenticated' || sessStatus === 'unauthenticated',
  });

  return {
    stats: query.data ?? {
      activeAuctions: 0,
      tenants: 0,
      apartments: 0,
      rentals: 0,
    },
    loading: query.isLoading,
  };
}
