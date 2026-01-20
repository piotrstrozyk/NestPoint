import useFetchReviews, {
  Review,
} from '@/features/apartment/hooks/use-fetch-reviews';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import { env } from 'next-runtime-env';
import { ReactNode } from 'react';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type Mock,
} from 'vitest';

vi.mock('axios');
vi.mock('next-auth/react');
vi.mock('next-runtime-env');

const mockedAxios = vi.mocked(axios);
const mockedUseSession = useSession as unknown as Mock;
const mockedEnv = env as unknown as Mock;

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  Wrapper.displayName = 'QueryClientTestWrapper';
  return Wrapper;
};

describe('useFetchReviews', () => {
  const mockApiClient = { get: vi.fn() };
  const mockSession = {
    accessToken: 'token',
    user: { id: '1' },
    expires: '2099-12-31T23:59:59.999Z',
  };
  const mockReviews: Review[] = [
    {
      id: 1,
      content: 'Great!',
      score: 5,
      authorId: 1,
      apartmentId: 2,
      targetUserId: null,
    },
    {
      id: 2,
      content: 'Ok',
      score: 3,
      authorId: 2,
      apartmentId: 2,
      targetUserId: null,
    },
  ];
  const mockResponse = {
    reviews: mockReviews,
    reviewCount: 2,
    averageRating: 4,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockedEnv.mockReturnValue('https://api.example.com');
    (mockedAxios.create as unknown as Mock).mockReturnValue(
      mockApiClient as { get: Mock },
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('returns reviews on success with token', async () => {
    mockedUseSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated',
      update: vi.fn(),
    });
    mockApiClient.get.mockResolvedValueOnce({ data: mockResponse });
    const { result } = renderHook(() => useFetchReviews(2), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.reviews).toEqual(mockReviews);
    expect(result.current.reviewCount).toBe(2);
    expect(result.current.averageRating).toBe(4);
    expect(result.current.error).toBeNull();
    expect(mockApiClient.get).toHaveBeenCalledWith('/reviews/apartment/2', {
      headers: { Authorization: 'Bearer token' },
    });
  });

  it('returns reviews on success without token', async () => {
    mockedUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: vi.fn(),
    });
    mockApiClient.get.mockResolvedValueOnce({ data: mockResponse });
    const { result } = renderHook(() => useFetchReviews(2), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.reviews).toEqual(mockReviews);
    expect(result.current.reviewCount).toBe(2);
    expect(result.current.averageRating).toBe(4);
    expect(result.current.error).toBeNull();
    expect(mockApiClient.get).toHaveBeenCalledWith('/reviews/apartment/2', {
      headers: undefined,
    });
  });

  it('handles API error', async () => {
    mockedUseSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated',
      update: vi.fn(),
    });
    const error = new Error('fail');
    mockApiClient.get.mockRejectedValueOnce(error);
    const { result } = renderHook(() => useFetchReviews(2), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.reviews).toEqual([]);
    expect(result.current.reviewCount).toBe(0);
    expect(result.current.averageRating).toBe(0);
    expect(result.current.error).toBe(error);
  });

  it('does not fetch while session is loading', async () => {
    mockedUseSession.mockReturnValue({
      data: null,
      status: 'loading',
      update: vi.fn(),
    });
    expect(mockApiClient.get).not.toHaveBeenCalled();
  });

  it('returns empty array and zero counts if no data', async () => {
    mockedUseSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated',
      update: vi.fn(),
    });
    mockApiClient.get.mockResolvedValueOnce({ data: undefined });
    const { result } = renderHook(() => useFetchReviews(2), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.reviews).toEqual([]);
    expect(result.current.reviewCount).toBe(0);
    expect(result.current.averageRating).toBe(0);
  });

  it('does not fetch if apartmentId is falsy', async () => {
    mockedUseSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated',
      update: vi.fn(),
    });
    expect(mockApiClient.get).not.toHaveBeenCalled();
  });
});
