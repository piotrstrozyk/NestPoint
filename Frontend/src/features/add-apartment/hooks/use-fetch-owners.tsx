import { Owner } from '@/features/add-apartment/types/owner';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import { env } from 'next-runtime-env';

export const fetchOwners = async (accessToken: string): Promise<Owner[]> => {
  const baseURL = env('NEXT_PUBLIC_API_BASE_URL')!;
  const apiClient = axios.create({ baseURL });
  const { data } = await apiClient.get<Owner[]>('/owners', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return data;
};

export default function useFetchOwners() {
  const { data: session, status } = useSession();

  const {
    data: owners,
    error,
    isLoading: loading,
  } = useQuery({
    queryKey: ['owners', session?.accessToken],
    // Only call fetchOwners if accessToken is defined
    queryFn: () => fetchOwners(session?.accessToken as string),
    enabled: status === 'authenticated' && !!session?.accessToken,
  });

  return { owners, error, loading };
}
