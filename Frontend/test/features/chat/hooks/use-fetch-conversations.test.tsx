import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import axios from 'axios';
import { Mock, vi } from 'vitest';
import useFetchConversations, {
  Conversation,
} from '../../../../src/features/chat/hooks/use-fetch-conversations';

vi.mock('axios');
vi.mock('next-auth/react', () => ({
  useSession: vi.fn(),
}));
vi.mock('next-runtime-env', () => ({
  env: vi.fn(),
}));

import { useSession } from 'next-auth/react';
import { env } from 'next-runtime-env';

const mockUseSession = useSession as unknown as Mock;
const mockEnv = env as unknown as Mock;
const mockAxios = axios as unknown as { create: typeof axios.create };

const createWrapper = () => {
  const queryClient = new QueryClient();
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  Wrapper.displayName = 'QueryClientProviderWrapper';
  return Wrapper;
};

describe('useFetchConversations', () => {
  const baseURL = 'http://api.test';
  const accessToken = 'test-token';
  const userId = 42;
  const session = {
    accessToken,
    user: { id: userId },
  };

  const conversations: Conversation[] = [
    {
      id: 1,
      rentalId: 10,
      apartmentTitle: 'Apt 1',
      tenant: { id: userId, username: 'tenant', firstName: 'T', lastName: 'N' },
      owner: { id: 99, username: 'owner', firstName: 'O', lastName: 'W' },
      createdAt: '2024-01-01',
      lastMessage: {
        id: 100,
        conversationId: 1,
        senderId: userId,
        senderName: 'tenant',
        content: 'Hello',
        timestamp: '2024-01-01T00:00:00Z',
        currentUserSender: true,
        read: false,
      },
      unreadCount: 1,
      active: true,
    },
    {
      id: 2,
      rentalId: 11,
      apartmentTitle: 'Apt 2',
      tenant: { id: 88, username: 'other', firstName: 'O', lastName: 'T' },
      owner: { id: userId, username: 'owner', firstName: 'O', lastName: 'W' },
      createdAt: '2024-01-02',
      lastMessage: {
        id: 101,
        conversationId: 2,
        senderId: 88,
        senderName: 'other',
        content: 'Hi',
        timestamp: '2024-01-02T00:00:00Z',
        currentUserSender: false,
        read: true,
      },
      unreadCount: 0,
      active: false,
    },
    {
      id: 3,
      rentalId: 12,
      apartmentTitle: 'Apt 3',
      tenant: { id: 77, username: 'notme', firstName: 'N', lastName: 'M' },
      owner: { id: 66, username: 'notme2', firstName: 'N', lastName: 'M' },
      createdAt: '2024-01-03',
      lastMessage: {
        id: 102,
        conversationId: 3,
        senderId: 77,
        senderName: 'notme',
        content: 'Yo',
        timestamp: '2024-01-03T00:00:00Z',
        currentUserSender: false,
        read: false,
      },
      unreadCount: 2,
      active: true,
    },
  ];

  let getMock: Mock;
  let apiClient: { get: Mock };

  beforeEach(() => {
    mockEnv.mockReturnValue(baseURL);
    getMock = vi.fn();
    apiClient = { get: getMock };
    mockAxios.create = vi.fn(() => apiClient) as unknown as typeof axios.create;
    // Default: authenticated
    mockUseSession.mockReturnValue({ data: session, status: 'authenticated' });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('fetches and filters conversations for authenticated user', async () => {
    getMock.mockResolvedValue({ data: conversations });
    const { result } = renderHook(() => useFetchConversations(), {
      wrapper: createWrapper(),
    });
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    // Only conversations where user is owner or tenant
    expect(result.current.conversations).toHaveLength(2);
    expect(result.current.conversations?.[0].id).toBe(1);
    expect(result.current.conversations?.[1].id).toBe(2);
    expect(result.current.error).toBeNull();
  });

  it('returns error if unauthenticated', async () => {
    mockUseSession.mockReturnValue({ data: null, status: 'unauthenticated' });
    const { result } = renderHook(() => useFetchConversations(), {
      wrapper: createWrapper(),
    });
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.conversations).toBeNull();
    expect(result.current.error).toBeNull();
    expect(getMock).not.toHaveBeenCalled();
  });

  it('returns error if user id is not a number', async () => {
    mockUseSession.mockReturnValue({
      data: { ...session, user: { id: undefined } },
      status: 'authenticated',
    });
    const { result } = renderHook(() => useFetchConversations(), {
      wrapper: createWrapper(),
    });
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.conversations).toBeNull();
    expect(result.current.error).toBeNull();
    expect(getMock).not.toHaveBeenCalled();
  });

  it('returns error if API call fails', async () => {
    getMock.mockRejectedValue(new Error('API error'));
    const { result } = renderHook(() => useFetchConversations(), {
      wrapper: createWrapper(),
    });
    expect(result.current.conversations).toBeNull();
  });

  it('shows loading state initially', async () => {
    getMock.mockResolvedValue({ data: conversations });
    const { result } = renderHook(() => useFetchConversations(), {
      wrapper: createWrapper(),
    });
    expect(result.current.loading).toBe(true);
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it('does not call API if no access token', async () => {
    mockUseSession.mockReturnValue({
      data: { ...session, accessToken: undefined },
      status: 'authenticated',
    });
    const { result } = renderHook(() => useFetchConversations(), {
      wrapper: createWrapper(),
    });
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.conversations).toBeNull();
    expect(result.current.error).toBeNull();
    expect(getMock).not.toHaveBeenCalled();
  });
});
