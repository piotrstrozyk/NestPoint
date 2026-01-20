import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import { env } from 'next-runtime-env';

export interface PhotoResponse {
  id: number;
  url: string;
}

export default function usePostApartmentPhoto() {
  const { data: session } = useSession();

  const mutation = useMutation({
    mutationFn: async ({
      apartmentId,
      file,
    }: {
      apartmentId: number;
      file: File;
    }): Promise<PhotoResponse> => {
      const baseURL = env('NEXT_PUBLIC_API_BASE_URL')!;
      const apiClient = axios.create({ baseURL });
      const formData = new FormData();
      formData.append('photo', file);
      const headers: Record<string, string> = {
        'Content-Type': 'multipart/form-data',
        ...(session?.accessToken && {
          Authorization: `Bearer ${session.accessToken}`,
        }),
      };
      const res = await apiClient.post<PhotoResponse>(
        `/apartments/${apartmentId}/photos`,
        formData,
        { headers },
      );
      return res.data;
    },
  });

  return {
    postPhoto: (apartmentId: number, file: File) =>
      mutation.mutateAsync({ apartmentId, file }),
    loading: mutation.isPending,
    error: mutation.error as Error | null,
    data: mutation.data,
  };
}
