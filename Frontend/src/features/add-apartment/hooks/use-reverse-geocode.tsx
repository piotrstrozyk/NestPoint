import { Address } from '@/features/apartment-list/types/apartment';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import { env } from 'next-runtime-env';

export interface ReverseGeocodeResult {
  address: Address;
  geojson: PolygonGeoJSON;
}

export interface PolygonGeoJSON {
  type: 'Polygon';
  coordinates: [number, number][][];
}

export const fetchReverseGeocode = async (
  accessToken: string,
  lat: number,
  lon: number,
): Promise<ReverseGeocodeResult> => {
  const baseURL = env('NEXT_PUBLIC_API_BASE_URL')!;
  const apiClient = axios.create({ baseURL });
  const { data } = await apiClient.get<ReverseGeocodeResult>(
    '/apartments/reverse-geocode',
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: { lat, lon },
    },
  );
  return data;
};

export default function useReverseGeocode(
  lat: number | null,
  lon: number | null,
) {
  const { data: session, status } = useSession();

  const query = useQuery<ReverseGeocodeResult, Error>({
    queryKey: ['reverseGeocode', session?.accessToken, lat, lon],
    queryFn: async () =>
      fetchReverseGeocode(
        session?.accessToken as string,
        lat as number,
        lon as number,
      ),
    enabled:
      status === 'authenticated' &&
      !!session?.accessToken &&
      lat != null &&
      lon != null,
    retry: false,
  });

  return {
    data: query.data ?? null,
    error: query.error ?? null,
    loading: query.isLoading,
  };
}
