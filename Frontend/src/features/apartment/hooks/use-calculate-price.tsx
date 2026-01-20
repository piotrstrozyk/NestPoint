import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import { env } from 'next-runtime-env';

export interface PriceCalculationResponse {
  apartmentId: number;
  title: string;
  startDate: Date;
  endDate: Date;
  nights: number;
  pricePerNight: number;
  totalPrice: number;
}

export function useCalculatePrice(
  apartmentId: number,
  startDate: Date | null,
  endDate: Date | null,
): {
  data: PriceCalculationResponse | undefined;
  loading: boolean;
  error: Error | null;
} {
  const { data: session, status } = useSession();

  const enabled =
    status === 'authenticated' && !!startDate && !!endDate && !!apartmentId;

  const {
    data,
    isLoading: loading,
    error,
  } = useQuery<PriceCalculationResponse, Error>({
    queryKey: [
      'calculate-price',
      apartmentId,
      startDate?.toISOString(),
      endDate?.toISOString(),
      session?.accessToken,
    ],
    queryFn: async () => {
      const baseURL = env('NEXT_PUBLIC_API_BASE_URL')!;
      const apiClient = axios.create({ baseURL });
      const params = {
        startDate: startDate!.toISOString().split('T')[0],
        endDate: endDate!.toISOString().split('T')[0],
      };
      const res = await apiClient.get<PriceCalculationResponse>(
        `/apartments/${apartmentId}/calculate-price`,
        {
          params,
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

  return { data, loading, error: error ?? null };
}
