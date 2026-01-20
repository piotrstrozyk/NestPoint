import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import { env } from 'next-runtime-env';

export interface Auction {
  id: number;
  apartmentId: number;
  apartmentTitle: string;
  startTime: string;
  endTime: string;
  startingPrice: number;
  minimumBidIncrement: number;
  rentalStartDate: string;
  rentalEndDate: string;
  status: 'PENDING' | 'ACTIVE' | 'COMPLETED' | string;
  maxBidders: number;
  currentHighestBid: number;
  currentBidderCount: number;
  bids: Array<{
    bidderId: number;
    bidderUsername: string;
    amount: number;
    timestamp: string;
    bidTime: Date;
  }>;
  resultingRentalId: number | null;
  active: boolean;
}

export default function useFetchAuctions(apartmentId: number) {
  const { data: session, status } = useSession();

  const enabled = status === 'authenticated' && !!apartmentId;

  const {
    data: auctions,
    isLoading: loading,
    error,
    refetch,
  } = useQuery<Auction[] | null, Error>({
    queryKey: ['auctions', apartmentId, session?.accessToken],
    queryFn: async () => {
      const baseURL = env('NEXT_PUBLIC_API_BASE_URL')!;
      const apiClient = axios.create({ baseURL });
      const res = await apiClient.get<Auction[]>('/auctions', {
        headers: session?.accessToken
          ? { Authorization: `Bearer ${session.accessToken}` }
          : undefined,
      });
      // Return all non-completed auctions for this apartment
      return res.data.filter(
        (a) => a.apartmentId === apartmentId && a.status !== 'COMPLETED',
      );
    },
    enabled,
    staleTime: 60 * 1000,
  });

  return { auctions: auctions ?? [], loading, error: error ?? null, refetch };
}

export function useFetchAuction(auctionId: number) {
  const { data: session, status } = useSession();
  const enabled = status === 'authenticated' && !!auctionId;
  const {
    data: auction,
    isLoading: loading,
    error,
    refetch,
  } = useQuery<Auction | null, Error>({
    queryKey: ['auction', auctionId, session?.accessToken],
    queryFn: async () => {
      const baseURL = env('NEXT_PUBLIC_API_BASE_URL')!;
      const apiClient = axios.create({ baseURL });
      const res = await apiClient.get<Auction>(`/auctions/${auctionId}`, {
        headers: session?.accessToken
          ? { Authorization: `Bearer ${session.accessToken}` }
          : undefined,
      });
      return res.data;
    },
    enabled,
    staleTime: 60 * 1000,
  });
  return { auction, loading, error: error ?? null, refetch };
}

export { useFetchAuctions };
