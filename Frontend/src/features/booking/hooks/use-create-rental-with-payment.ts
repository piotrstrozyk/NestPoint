import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import { env } from 'next-runtime-env';

export interface Address {
  street: string;
  apartmentNumber: string;
  city: string;
  postalCode: string;
  country: string;
  fullAddress: string;
  latitude: number;
  longitude: number;
}

export interface Rental {
  apartmentId: number;
  tenantId: number;
  startDate: Date;
  endDate: Date;
}

export interface Payment {
  cardNumber: string;
}

export interface CreateRentalWithPaymentPayload {
  rental: Rental;
  payment: Payment;
}

export function useCreateRentalWithPayment() {
  const { data: session } = useSession();

  const mutation = useMutation({
    mutationFn: async (payload: CreateRentalWithPaymentPayload) => {
      const baseURL = env('NEXT_PUBLIC_API_BASE_URL')!;
      const apiClient = axios.create({ baseURL });
      if (!session?.accessToken) throw new Error('No access token');
      const { data } = await apiClient.post(
        '/rentals/create-with-payment',
        payload,
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
    createRentalWithPayment: mutation.mutateAsync,
    loading: mutation.isPending,
    error: mutation.error as Error | null,
    data: mutation.data,
  };
}
