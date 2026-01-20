import { useFetchAuction, Auction } from '@/features/apartment/hooks/use-fetch-auction';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import axios, { AxiosInstance } from 'axios';
import { useSession } from 'next-auth/react';
import { env } from 'next-runtime-env';
import { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, Mock, vi } from 'vitest';

vi.mock('axios');
vi.mock('next-auth/react');
vi.mock('next-runtime-env');

const mockedAxios = vi.mocked(axios);
const mockedUseSession = vi.mocked(useSession);
const mockedEnv = vi.mocked(env);

const mockAuction: Auction = {
  id: 1,
  apartmentId: 42,
  apartmentTitle: 'Luxury Flat',
  startTime: '2025-06-29T10:00:00Z',
  endTime: '2025-06-29T12:00:00Z',
  startingPrice: 1000,
  minimumBidIncrement: 100,
  rentalStartDate: '2025-07-01',
  rentalEndDate: '2026-07-01',
  status: 'ACTIVE',
  maxBidders: 5,
  currentHighestBid: 1500,
  currentBidderCount: 2,
  bids: [
    {
      bidderId: 1,
      bidderUsername: 'alice',
      amount: 1200,
      timestamp: '2025-06-29T10:10:00Z',
      bidTime: new Date('2025-06-29T10:10:00Z'),
    },
    {
      bidderId: 2,
      bidderUsername: 'bob',
      amount: 1500,
      timestamp: '2025-06-29T10:20:00Z',
      bidTime: new Date('2025-06-29T10:20:00Z'),
    },
  ],
  resultingRentalId: null,
  active: true,
};

const mockSession = {
  accessToken: 'mock-access-token',
  user: { id: '1', name: 'Test User', role: 'TENANT' },
  expires: '2099-01-01T00:00:00.000Z',
} satisfies import('next-auth').Session;

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  Wrapper.displayName = 'ReactQueryTestWrapper';
  return Wrapper;
};

describe('useFetchAuction', () => {
  let mockApiClient: { get: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    vi.clearAllMocks();
    mockedEnv.mockReturnValue('https://api.example.com');
    mockApiClient = { get: vi.fn() };
    (mockedAxios.create as unknown as Mock).mockReturnValue(
      mockApiClient as unknown as AxiosInstance,
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('returns null and does not fetch if not authenticated', () => {
    mockedUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: vi.fn(),
    });
    const { result } = renderHook(() => useFetchAuction(42), {
      wrapper: createWrapper(),
    });
    expect(result.current.auction).toBeUndefined();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(mockApiClient.get).not.toHaveBeenCalled();
  });

  it('returns null and does not fetch if apartmentId is falsy', () => {
    mockedUseSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated',
      update: vi.fn(),
    });
    const { result } = renderHook(() => useFetchAuction(0), {
      wrapper: createWrapper(),
    });
    expect(result.current.auction).toBeUndefined();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(mockApiClient.get).not.toHaveBeenCalled();
  });

  it('fetches auction and returns the correct auction', async () => {
    mockedUseSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated',
      update: vi.fn(),
    });
    mockApiClient.get.mockResolvedValue({
      data: mockAuction,
    });
    const { result } = renderHook(() => useFetchAuction(1), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockApiClient.get).toHaveBeenCalledWith('/auctions/1', {
      headers: { Authorization: 'Bearer mock-access-token' },
    });
    expect(result.current.auction).toEqual(mockAuction);
    expect(result.current.error).toBeNull();
  });

  it('returns null if API returns null', async () => {
    mockedUseSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated',
      update: vi.fn(),
    });
    mockApiClient.get.mockResolvedValue({ data: null });
    const { result } = renderHook(() => useFetchAuction(1), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.auction).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('fetches without Authorization header if no accessToken', async () => {
    const sessionNoToken = {
      user: { id: '1', name: 'Test User', role: 'TENANT' },
      expires: '2099-01-01T00:00:00.000Z',
    };
    mockedUseSession.mockReturnValue({
      data: sessionNoToken,
      status: 'authenticated',
      update: vi.fn(),
    });
    mockApiClient.get.mockResolvedValue({ data: mockAuction });
    const { result } = renderHook(() => useFetchAuction(1), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockApiClient.get).toHaveBeenCalledWith('/auctions/1', {
      headers: undefined,
    });
    expect(result.current.auction).toEqual(mockAuction);
  });

  it('handles API errors', async () => {
    mockedUseSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated',
      update: vi.fn(),
    });
    const apiError = new Error('API error');
    mockApiClient.get.mockRejectedValue(apiError);
    const { result } = renderHook(() => useFetchAuction(42), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe(apiError);
  });

  it('refetch returns latest auction', async () => {
    mockedUseSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated',
      update: vi.fn(),
    });
    mockApiClient.get.mockResolvedValueOnce({ data: [mockAuction] });
    const { result } = renderHook(() => useFetchAuction(42), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    // Change API response
    const updatedAuction = { ...mockAuction, currentHighestBid: 2000 };
    mockApiClient.get.mockResolvedValueOnce({ data: [updatedAuction] });
    await result.current.refetch();
  });
});
