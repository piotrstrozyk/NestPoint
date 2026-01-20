import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import { env } from 'next-runtime-env';

export interface UserInfo {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
}

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

export interface Conversation {
  id: number;
  rentalId: number;
  apartmentTitle: string;
  tenant: UserInfo;
  owner: UserInfo;
  createdAt: string;
  lastMessage: Message;
  unreadCount: number;
  active: boolean;
}

const fetchConversations = async (
  accessToken: string,
  currentUserId: number,
): Promise<Conversation[]> => {
  const baseURL = env('NEXT_PUBLIC_API_BASE_URL')!;
  const apiClient = axios.create({ baseURL });
  const { data } = await apiClient.get<Conversation[]>('/chat/conversations', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  // filter on owner or tenant matching current user
  return data.filter(
    (convo) =>
      convo.owner.id === currentUserId || convo.tenant.id === currentUserId,
  );
};

export default function useFetchConversations() {
  const { data: session, status } = useSession();
  const currentUserId = session?.user?.id;

  const query = useQuery<Conversation[], Error>({
    queryKey: ['conversations', session?.accessToken, currentUserId],
    queryFn: async () =>
      fetchConversations(
        session?.accessToken as string,
        currentUserId as number,
      ),
    enabled:
      status === 'authenticated' &&
      !!session?.accessToken &&
      typeof currentUserId === 'number',
  });

  return {
    conversations: query.data ?? null,
    error: query.error ?? null,
    loading: query.isLoading,
  };
}
