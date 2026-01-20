import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import { env } from 'next-runtime-env';
import { Apartment } from '../types/apartment';

export const fetchAvailableApartments = async (
  startDate: string,
  endDate: string,
  token?: string,
): Promise<Apartment[]> => {
  const baseURL = env('NEXT_PUBLIC_API_BASE_URL')!;
  const apiClient = axios.create({ baseURL });
  const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

  const { data } = await apiClient.get<Apartment[]>(
    `/apartments/available/range`,
    {
      headers,
      params: { startDate, endDate },
    },
  );
  return data;
};

export default function useFetchAvailableApartments(
  startDate: string,
  endDate: string,
) {
  const { data: session, status } = useSession();

  const query = useQuery<Apartment[], Error>({
    queryKey: [
      'apartments-available',
      startDate,
      endDate,
      session?.accessToken,
    ],
    queryFn: () =>
      fetchAvailableApartments(startDate, endDate, session?.accessToken),
    enabled: !!startDate && !!endDate && status !== 'loading',
  });

  return {
    apartments: query.data ?? null,
    loading: query.isLoading,
    error: query.error ?? null,
  };
}
