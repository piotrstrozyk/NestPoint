import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import { env } from 'next-runtime-env';

export default function useDeleteReview() {
  const { data: session } = useSession();

  const mutation = useMutation({
    mutationFn: async (reviewId: number) => {
      const baseURL = env('NEXT_PUBLIC_API_BASE_URL')!;
      const apiClient = axios.create({ baseURL });
      const headers: Record<string, string> = {
        ...(session?.accessToken && {
          Authorization: `Bearer ${session.accessToken}`,
        }),
      };
      const res = await apiClient.delete(`/reviews/${reviewId}`, { headers });
      return res.data;
    },
  });

  return {
    deleteReview: (reviewId: number) => mutation.mutateAsync(reviewId),
    loading: mutation.isPending,
    error: mutation.error as Error | null,
    data: mutation.data,
  };
}
