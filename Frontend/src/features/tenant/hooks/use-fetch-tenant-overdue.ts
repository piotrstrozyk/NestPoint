import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import { env } from 'next-runtime-env';

export interface OverdueAuctionPayment {
  rentalId: number;
  apartmentId: number;
  tenantId: number;
  ownerId: number;
  startDate: string;
  endDate: string;
  nights: number;
  pricePerNight: number;
  totalCost: number;
  status: 'PENDING' | 'OVERDUE' | 'PAID';
  address: {
    street: string;
    apartmentNumber: string | null;
    city: string;
    postalCode: string;
    country: string;
    fullAddress: string;
    latitude: number;
    longitude: number;
  };
  apartmentOccupied: boolean;
  rentalFees: number;
  isAuction: boolean | null;
  auctionPaymentConfirmed: boolean;
  auctionPaymentDeadline: string;
  auctionFineIssued: boolean;
  auctionFineAmount: number;
}

export default function useFetchUserOverdueAuctionPayments(userId: number) {
  const { data: session, status: sessStatus } = useSession();

  const query = useQuery({
    queryKey: ['overdueAuctionPayments', userId, session?.accessToken],
    queryFn: async () => {
      const baseURL = env('NEXT_PUBLIC_API_BASE_URL')!;
      const apiClient = axios.create({ baseURL });
      const headers = session?.accessToken
        ? { Authorization: `Bearer ${session.accessToken}` }
        : undefined;
      const res = await apiClient.get<OverdueAuctionPayment[]>(
        `/rentals/user/${userId}/overdue-auction-payments`,
        { headers },
      );
      return res.data;
    },
    enabled: !!userId && sessStatus === 'authenticated',
  });

  return {
    payments: query.data ?? [],
    loading: query.isLoading,
    error: query.error as Error | null,
  };
}
