import { ApartmentForm } from '@/features/add-apartment/schemas/add-apartment';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import { env } from 'next-runtime-env';

export function useUpdateApartment() {
  const { data: session } = useSession();

  const mutation = useMutation({
    mutationFn: async ({
      apartmentId,
      payload,
    }: {
      apartmentId: number;
      payload: Partial<ApartmentForm>;
    }) => {
      const baseURL = env('NEXT_PUBLIC_API_BASE_URL')!;
      const apiClient = axios.create({ baseURL });
      if (!session?.accessToken) throw new Error('No access token');
      const apartmentResponse = await apiClient.put(
        `/apartments/${encodeURIComponent(apartmentId)}`,
        { id: apartmentId, ...payload },
        {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      );
      return apartmentResponse.data;
    },
  });

  return {
    updateApartment: (apartmentId: number, payload: Partial<ApartmentForm>) =>
      mutation.mutateAsync({ apartmentId, payload }),
    loading: mutation.isPending,
    error: mutation.error as Error | null,
    data: mutation.data,
  };
}
