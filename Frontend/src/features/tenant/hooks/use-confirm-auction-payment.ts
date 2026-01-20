import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import { env } from 'next-runtime-env';

export interface ConfirmAuctionPaymentInput {
  cardNumber: string;
  [key: string]: unknown;
}

export interface ConfirmAuctionPaymentResponse {
  success: boolean;
  transactionId?: string;
  message?: string;
}

export default function usePostConfirmAuctionPayment() {
  const { data: session } = useSession();

  const mutation = useMutation({
    mutationFn: async ({
      rentalId,
      payment,
    }: {
      rentalId: number;
      payment: ConfirmAuctionPaymentInput;
    }): Promise<ConfirmAuctionPaymentResponse> => {
      const baseURL = env('NEXT_PUBLIC_API_BASE_URL')!;
      const apiClient = axios.create({ baseURL });
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(session?.accessToken && {
          Authorization: `Bearer ${session.accessToken}`,
        }),
      };
      const res = await apiClient.post<ConfirmAuctionPaymentResponse>(
        `/rentals/${rentalId}/confirm-auction-payment`,
        payment,
        { headers },
      );
      return res.data;
    },
  });

  return {
    confirmAuctionPayment: (
      rentalId: number,
      payment: ConfirmAuctionPaymentInput,
    ) => mutation.mutateAsync({ rentalId, payment }),
    loading: mutation.isPending,
    error: mutation.error as Error | null,
  };
}
