import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import { env } from 'next-runtime-env';

export interface Review {
  id: number;
  content: string;
  score: number;
  authorId: number;
  apartmentId: number;
  targetUserId: number | null;
}

interface ReviewsResponse {
  reviews: Review[];
  reviewCount: number;
  averageRating: number;
}

export default function useFetchReviews(apartmentId: number) {
  const { data: session, status } = useSession();

  const query = useQuery<ReviewsResponse, Error>({
    queryKey: ['apartmentReviews', apartmentId, session?.accessToken],
    queryFn: async () => {
      const baseURL = env('NEXT_PUBLIC_API_BASE_URL')!;
      const apiClient = axios.create({ baseURL });
      const headers = session?.accessToken
        ? { Authorization: `Bearer ${session.accessToken}` }
        : undefined;
      const res = await apiClient.get<ReviewsResponse>(
        `/reviews/apartment/${apartmentId}`,
        { headers },
      );
      return res.data;
    },
    enabled: !!apartmentId && status !== 'loading',
  });

  return {
    reviews: query.data?.reviews ?? [],
    reviewCount: query.data?.reviewCount ?? 0,
    averageRating: query.data?.averageRating ?? 0,
    loading: query.isLoading,
    error: query.error ?? null,
    refetch: query.refetch,
  };
}
