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

export default function useUpdateReview() {
  const { data: session } = useSession();

  const mutation = useMutation({
    mutationFn: async ({
      reviewId,
      review,
    }: {
      reviewId: number;
      review: ApartmentReviewInput;
    }) => {
      const baseURL = env('NEXT_PUBLIC_API_BASE_URL')!;
      const apiClient = axios.create({ baseURL });
      const headers: Record<string, string> = {
        'Content-Type': 'multipart/form-data',
        ...(session?.accessToken && {
          Authorization: `Bearer ${session.accessToken}`,
        }),
      };
      const detailsParam = JSON.stringify(review);
      const res = await apiClient.put(
        `/reviews/${reviewId}?details=${encodeURIComponent(detailsParam)}`,
        new FormData(),
        { headers },
      );
      return res.data;
    },
  });

  return {
    putReview: (reviewId: number, review: ApartmentReviewInput) =>
      mutation.mutateAsync({ reviewId, review }),
    loading: mutation.isPending,
    error: mutation.error as Error | null,
    data: mutation.data,
  };
}
