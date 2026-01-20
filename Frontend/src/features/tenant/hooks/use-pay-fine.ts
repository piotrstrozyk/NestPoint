import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import { env } from 'next-runtime-env';

export interface PayFinePayload {
  cardNumber: string;
}

export function usePayAuctionFine() {
  const { data: session } = useSession();

  const mutation = useMutation({
    mutationFn: async ({ rentalId, cardNumber }: { rentalId: number; cardNumber: string }) => {
      const baseURL = env('NEXT_PUBLIC_API_BASE_URL')!;
      const apiClient = axios.create({ baseURL });
      if (!session?.accessToken) throw new Error('No access token');
      if (!/^\d{10}$/.test(cardNumber)) throw new Error('Card number must be 10 digits');
      const { data } = await apiClient.post(
        `/rentals/${rentalId}/pay-auction-fine`,
        { cardNumber },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.accessToken}`,
          },
        },
      );
      return data;
    },
  });

  return {
    payFine: mutation.mutateAsync,
    loading: mutation.isPending,
    error: mutation.error as Error | null,
    data: mutation.data,
  };
}
