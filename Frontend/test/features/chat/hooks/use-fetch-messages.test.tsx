import { act, renderHook, waitFor } from '@testing-library/react';
import axios, { AxiosInstance } from 'axios';
import { useSession } from 'next-auth/react';
import { vi } from 'vitest';
import useFetchMessages from '../../../../src/features/chat/hooks/use-fetch-messages';

vi.mock('next-auth/react');
vi.mock('axios');

const mockedUseSession = vi.mocked(useSession);
const mockedAxiosCreate = vi.mocked(axios.create);

// Mock apiClient.get (axios instance)
const getMock = vi.fn();

describe('useFetchMessages', () => {
  const conversationId = 123;
  const paginatedResponse = {
    content: [
      {
        id: 1,
        conversationId,
        senderId: 2,
        senderName: 'Alice',
        content: 'Hello',
        timestamp: '2024-01-01T00:00:00Z',
        currentUserSender: false,
        read: true,
      },
    ],
    pageable: {
      pageNumber: 0,
      pageSize: 20,
      sort: { unsorted: false, sorted: true, empty: false },
      offset: 0,
      unpaged: false,
      paged: true,
    },
    totalPages: 1,
    totalElements: 1,
    last: true,
    first: true,
    numberOfElements: 1,
    size: 20,
    number: 0,
    sort: { unsorted: false, sorted: true, empty: false },
    empty: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    getMock.mockReset();
    mockedAxiosCreate.mockReturnValue({
      get: getMock,
    } as unknown as AxiosInstance);
  });

  it('fetches messages when authenticated', async () => {
    mockedUseSession.mockReturnValue({
      data: { accessToken: 'token' },
      status: 'authenticated',
    } as ReturnType<typeof useSession>);
    getMock.mockResolvedValue({ data: paginatedResponse });

    const { result } = renderHook(() => useFetchMessages(conversationId));
    await waitFor(() =>
      expect(result.current.pageInfo).toEqual({
        pageNumber: 0,
        pageSize: 20,
        totalPages: 1,
        totalElements: 1,
        last: true,
        first: true,
      }),
    );
    expect(result.current.messages).toEqual(paginatedResponse.content);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(getMock).toHaveBeenCalledWith(
      `/chat/conversations/${conversationId}/messages`,
      expect.objectContaining({ headers: { Authorization: 'Bearer token' } }),
    );
  });

  it('returns empty array and null pageInfo if unauthenticated', async () => {
    mockedUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
    } as ReturnType<typeof useSession>);
    const { result } = renderHook(() => useFetchMessages(conversationId));
    await act(async () => {
      await Promise.resolve();
    });
    expect(result.current.messages).toEqual([]);
    expect(result.current.pageInfo).toBeNull();
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();
    expect(getMock).not.toHaveBeenCalled();
  });

  it('returns empty array and null pageInfo if session is loading', async () => {
    mockedUseSession.mockReturnValue({
      data: null,
      status: 'loading',
    } as ReturnType<typeof useSession>);
    const { result } = renderHook(() => useFetchMessages(conversationId));
    await act(async () => {
      await Promise.resolve();
    });
    expect(result.current.messages).toEqual([]);
    expect(result.current.pageInfo).toBeNull();
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();
    expect(getMock).not.toHaveBeenCalled();
  });

  it('returns empty array and null pageInfo if conversationId is null', async () => {
    mockedUseSession.mockReturnValue({
      data: { accessToken: 'token' },
      status: 'authenticated',
    } as ReturnType<typeof useSession>);
    const { result } = renderHook(() => useFetchMessages(null));
    await act(async () => {
      await Promise.resolve();
    });
    expect(result.current.messages).toEqual([]);
    expect(result.current.pageInfo).toBeNull();
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();
    expect(getMock).not.toHaveBeenCalled();
  });

  it('sets error if API call fails', async () => {
    mockedUseSession.mockReturnValue({
      data: { accessToken: 'token' },
      status: 'authenticated',
    } as ReturnType<typeof useSession>);
    getMock.mockRejectedValue(new Error('API error'));
    const { result } = renderHook(() => useFetchMessages(conversationId));
    await waitFor(() => expect(result.current.error).toBeInstanceOf(Error));
    expect(result.current.messages).toEqual([]);
    expect(result.current.pageInfo).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error && result.current.error.message).toBe(
      'API error',
    );
  });
});
