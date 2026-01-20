import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import { env } from 'next-runtime-env';

export interface Address {
  street: string;
  apartmentNumber: string | null;
  city: string;
  postalCode: string;
  country: string;
  fullAddress: string;
  latitude: number;
  longitude: number;
}

export interface Rental {
  id: number;
  apartmentId: number;
  tenantId: number;
  ownerId: number;
  startDate: Date;
  endDate: Date;
  nights: number;
  pricePerNight: number;
  totalCost: number;
  status: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  address: Address;
  apartmentOccupied: boolean;
  rentalFees: number;
}

export default function useFetchTenantRentals(
  userId: number,
  status: Rental['status'] = 'COMPLETED',
) {
  const { data: session, status: sessStatus } = useSession();

  const enabled = sessStatus === 'authenticated' && !!userId;

  const {
    data: rentals,
    isLoading: loading,
    error,
  } = useQuery<Rental[], Error>({
    queryKey: [
      'tenant-completed-rentals',
      userId,
      status,
      session?.accessToken,
    ],
    queryFn: async () => {
      const baseURL = env('NEXT_PUBLIC_API_BASE_URL')!;
      const apiClient = axios.create({ baseURL });
      const res = await apiClient.get<Rental[]>(
        `/rentals/my-rentals/tenant/${userId}`,
        {
          params: { status: status.toLowerCase() },
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

  return { rentals, loading, error: error ?? null };
}
