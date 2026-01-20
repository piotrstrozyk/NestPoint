import axios from 'axios';
import { useSession } from 'next-auth/react';
import { env } from 'next-runtime-env';
import { useEffect, useState } from 'react';

export interface Message {
  id: number;
  conversationId: number;
  senderId: number;
  senderName: string;
  content: string;
  timestamp: string;
  currentUserSender: boolean;
  read: boolean;
}

export interface PageInfo {
  pageNumber: number;
  pageSize: number;
  sort: {
    unsorted: boolean;
    sorted: boolean;
    empty: boolean;
  };
  offset: number;
  unpaged: boolean;
  paged: boolean;
}

export interface PaginatedResponse<T> {
  content: T[];
  pageable: PageInfo;
  totalPages: number;
  totalElements: number;
  last: boolean;
  first: boolean;
  numberOfElements: number;
  size: number;
  number: number;
  sort: {
    unsorted: boolean;
    sorted: boolean;
    empty: boolean;
  };
  empty: boolean;
}

const fetchMessages = async (
  accessToken: string,
  conversationId: number,
  page = 0,
  size = 20,
  sort: 'asc' | 'desc' = 'asc',
): Promise<PaginatedResponse<Message>> => {
  const baseURL = env('NEXT_PUBLIC_API_BASE_URL')!;
  const apiClient = axios.create({ baseURL });
  const { data } = await apiClient.get<PaginatedResponse<Message>>(
    `/chat/conversations/${conversationId}/messages`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: { page, size, sort },
    },
  );
  return data;
};

export default function useFetchMessages(
  conversationId: number | null,
  page = 0,
  size = 20,
  sort: 'asc' | 'desc' = 'asc',
) {
  const { data: session, status } = useSession();
  const [response, setResponse] = useState<PaginatedResponse<Message> | null>(
    null,
  );
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (
      status !== 'authenticated' ||
      !session?.accessToken ||
      conversationId === null
    ) {
      return;
    }

    fetchMessages(session.accessToken, conversationId, page, size, sort)
      .then(setResponse)
      .catch(setError);
  }, [session, status, conversationId, page, size, sort]);

  return {
    messages: response?.content ?? [],
    pageInfo: response
      ? {
          pageNumber: response.pageable.pageNumber,
          pageSize: response.pageable.pageSize,
          totalPages: response.totalPages,
          totalElements: response.totalElements,
          last: response.last,
          first: response.first,
        }
      : null,
    loading: status === 'loading' || (response === null && !error),
    error,
  };
}
