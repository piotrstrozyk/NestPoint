import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import { env } from 'next-runtime-env';

export interface Photo {
  id: number;
  url: string;
}

export default function useFetchApartmentPhotos(apartmentId: number) {
  const { data: session, status } = useSession();

  const query = useQuery<Photo[], Error>({
    queryKey: ['apartmentPhotos', apartmentId, session?.accessToken],
    queryFn: async () => {
      const baseURL = env('NEXT_PUBLIC_API_BASE_URL')!;
      const apiClient = axios.create({ baseURL });
      const response = await apiClient.get<Photo[]>(
        `/apartments/${apartmentId}/photos`,
        {
          headers: session?.accessToken
            ? { Authorization: `Bearer ${session.accessToken}` }
            : undefined,
        },
      );
      return response.data;
    },
    enabled: !!apartmentId && status !== 'loading',
  });

  return {
    photos: query.data ? query.data.map((p) => p.url) : null,
    photoObjects: query.data ?? null,
    loading: query.isLoading,
    error: query.error ?? null,
    refetch: query.refetch,
  };
}
