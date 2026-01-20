import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import { env } from 'next-runtime-env';

export default function useDeleteApartmentPhoto() {
  const { data: session } = useSession();

  const mutation = useMutation({
    mutationFn: async ({
      apartmentId,
      photoId,
    }: {
      apartmentId: number;
      photoId: number;
    }) => {
      const baseURL = env('NEXT_PUBLIC_API_BASE_URL')!;
      const apiClient = axios.create({ baseURL });
      const headers: Record<string, string> = {
        ...(session?.accessToken && {
          Authorization: `Bearer ${session.accessToken}`,
        }),
      };
      await apiClient.delete(`/apartments/${apartmentId}/photos/${photoId}`, {
        headers,
      });
    },
  });

  return {
    deletePhoto: (apartmentId: number, photoId: number) =>
      mutation.mutateAsync({ apartmentId, photoId }),
    loading: mutation.isPending,
    error: mutation.error as Error | null,
  };
}
