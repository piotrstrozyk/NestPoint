import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import { env } from 'next-runtime-env';

export interface ApartmentReviewInput {
  content: string;
  score: number;
  authorId: number;
  apartmentId: number;
}

export default function usePostReview() {
  const baseURL = env('NEXT_PUBLIC_API_BASE_URL')!;
  const apiClient = axios.create({ baseURL });
  const { data: session } = useSession();

  const mutation = useMutation({
    mutationFn: async (review: ApartmentReviewInput) => {
      const headers = {
        'Content-Type': 'multipart/form-data',
        ...(session?.accessToken && {
          Authorization: `Bearer ${session.accessToken}`,
        }),
      };
      const detailsParam = JSON.stringify(review);
      const res = await apiClient.post(
        `/reviews/apartment?details=${encodeURIComponent(detailsParam)}`,
        new FormData(),
        { headers },
      );
      return res.data;
    },
  });

  return {
    postReview: mutation.mutateAsync,
    loading: mutation.isPending,
    error: mutation.error as Error | null,
    data: mutation.data,
  };
}
