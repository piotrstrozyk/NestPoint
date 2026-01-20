import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import { env } from 'next-runtime-env';

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface AvailabilityResponse {
  occupiedRanges: DateRange[];
  availableRanges: DateRange[];
}

export function useFetchOccupiedRanges(apartmentId: number): {
  availability: AvailabilityResponse | undefined;
  loading: boolean;
  error: Error | null;
} {
  const { data: session, status } = useSession();

  const enabled = status === 'authenticated' && !!apartmentId;

  const {
    data: availability,
    isLoading: loading,
    error,
  } = useQuery<AvailabilityResponse, Error>({
    queryKey: ['apartment-availability', apartmentId, session?.accessToken],
    queryFn: async () => {
      const baseURL = env('NEXT_PUBLIC_API_BASE_URL')!;
      const apiClient = axios.create({ baseURL });
      const res = await apiClient.get<AvailabilityResponse>(
        `/apartments/${apartmentId}/availability`,
        {
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

  return { availability, loading, error: error ?? null };
}
