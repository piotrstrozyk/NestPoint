import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import { env } from 'next-runtime-env';

type Auction = { id: number; apartmentId: number; [key: string]: unknown };

export default function useAuctionExists(apartmentId: number) {
  const { data: session, status } = useSession();

  const query = useQuery<Auction[], Error>({
    queryKey: ['auctions', apartmentId, session?.accessToken],
    queryFn: async () => {
      const baseURL = env('NEXT_PUBLIC_API_BASE_URL')!;
      const apiClient = axios.create({ baseURL });
      const headers = session?.accessToken
        ? { Authorization: `Bearer ${session.accessToken}` }
        : undefined;
      const { data } = await apiClient.get<Auction[]>('/auctions', { headers });
      return data;
    },
    enabled: !!apartmentId && status !== 'loading',
  });

  const exists = query.data
    ? query.data.some((auc) => auc.apartmentId === apartmentId)
    : false;

  return {
    exists,
    loading: query.isLoading,
    error: query.error ?? null,
  };
}
