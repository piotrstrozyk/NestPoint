import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import { env } from 'next-runtime-env';
import { Apartment } from '../types/apartment';

export const fetchApartmentsByAuction = async (
  hasUpcomingAuction: boolean,
  hasCompletedAuction: boolean,
  token?: string,
): Promise<Apartment[]> => {
  const baseURL = env('NEXT_PUBLIC_API_BASE_URL')!;
  const apiClient = axios.create({ baseURL });
  const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

  const { data } = await apiClient.get<Apartment[]>(
    `/apartments/auctions`,
    {
      headers,
      params: { hasUpcomingAuction, hasCompletedAuction },
    },
  );
  return data;
};

export default function useFetchApartmentsByAuction(
  hasUpcomingAuction: boolean,
  hasCompletedAuction: boolean,
) {
  const { data: session, status } = useSession();

  const query = useQuery<Apartment[], Error>({
    queryKey: [
      'apartments-by-auction',
      hasUpcomingAuction,
      hasCompletedAuction,
      session?.accessToken,
    ],
    queryFn: () =>
      fetchApartmentsByAuction(
        hasUpcomingAuction,
        hasCompletedAuction,
        session?.accessToken,
      ),
    enabled: status !== 'loading',
  });

  return {
    apartments: query.data ?? null,
    loading: query.isLoading,
    error: query.error ?? null,
  };
}
