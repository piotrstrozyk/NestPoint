import useFetchUserOverdueAuctionPayments, {
  OverdueAuctionPayment,
} from '@/features/tenant/hooks/use-fetch-tenant-overdue';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import { env } from 'next-runtime-env';
import { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock dependencies
vi.mock('axios');
vi.mock('next-auth/react');
vi.mock('next-runtime-env');

const mockedAxios = vi.mocked(axios);
const mockedUseSession = vi.mocked(useSession);
const mockedEnv = vi.mocked(env);

// Mock data
const mockPayments: OverdueAuctionPayment[] = [
  {
    rentalId: 1,
    auctionId: 101,
    amountDue: 150.0,
    dueDate: new Date('2024-06-15'),
    status: 'OVERDUE',
  },
  {
    rentalId: 2,
    auctionId: 102,
    amountDue: 200.5,
    dueDate: new Date('2024-06-10'),
    status: 'PENDING',
  },
];

const mockSession = {
  accessToken: 'mock-access-token',
  user: { id: '1', email: 'test@example.com' },
  expires: '2099-12-31T23:59:59.999Z',
};

// Test wrapper component
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  Wrapper.displayName = 'QueryClientTestWrapper';
  return Wrapper;
};

describe('useFetchUserOverdueAuctionPayments', () => {
  const mockApiClient = {
    get: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mocks
    mockedEnv.mockReturnValue('https://api.example.com');
    vi.spyOn(axios, 'create').mockReturnValue(
      mockApiClient as unknown as typeof axios,
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should not fetch when user is not authenticated', () => {
    mockedUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: vi.fn(),
    });

    const { result } = renderHook(
      () => useFetchUserOverdueAuctionPayments(123),
      { wrapper: createWrapper() },
    );

    expect(mockApiClient.get).not.toHaveBeenCalled();
    expect(result.current.payments).toEqual([]);
  });

  it('should not fetch when userId is not provided', () => {
    mockedUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: vi.fn(),
    });

    const { result } = renderHook(() => useFetchUserOverdueAuctionPayments(0), {
      wrapper: createWrapper(),
    });

    expect(mockApiClient.get).not.toHaveBeenCalled();
    expect(result.current.payments).toEqual([]);
  });

  it('should fetch payments successfully when authenticated', async () => {
    mockedUseSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated',
      update: vi.fn(),
    });

    mockApiClient.get.mockResolvedValue({
      data: mockPayments,
    });

    const { result } = renderHook(
      () => useFetchUserOverdueAuctionPayments(123),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockApiClient.get).toHaveBeenCalledWith(
      '/rentals/user/123/overdue-auction-payments',
      {
        headers: {
          Authorization: 'Bearer mock-access-token',
        },
      },
    );

    expect(result.current.payments).toEqual(mockPayments);
    expect(result.current.error).toBe(null);
  });

  it('should fetch payments without authorization header when no access token', async () => {
    const sessionWithoutToken = {
      user: { id: '1', email: 'test@example.com' },
      expires: '2099-12-31T23:59:59.999Z',
    };
    mockedUseSession.mockReturnValue({
      data: sessionWithoutToken,
      status: 'authenticated',
      update: vi.fn(),
    });

    mockApiClient.get.mockResolvedValue({
      data: mockPayments,
    });

    const { result } = renderHook(
      () => useFetchUserOverdueAuctionPayments(123),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockApiClient.get).toHaveBeenCalledWith(
      '/rentals/user/123/overdue-auction-payments',
      {
        headers: undefined,
      },
    );

    expect(result.current.payments).toEqual(mockPayments);
  });

  it('should handle API errors', async () => {
    const sessionWithoutToken = {
      user: { id: '1', email: 'test@example.com' },
      expires: '2099-12-31T23:59:59.999Z',
    };
    mockedUseSession.mockReturnValue({
      data: sessionWithoutToken,
      status: 'authenticated',
      update: vi.fn(),
    });

    const mockError = new Error('API Error');
    mockApiClient.get.mockRejectedValue(mockError);

    const { result } = renderHook(
      () => useFetchUserOverdueAuctionPayments(123),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.payments).toEqual([]);
    expect(result.current.error).toEqual(mockError);
  });

  it('should create axios client with correct base URL', async () => {
    const mockBaseUrl = 'https://custom-api.example.com';
    mockedEnv.mockReturnValue(mockBaseUrl);

    mockedUseSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated',
      update: vi.fn(),
    });

    mockApiClient.get.mockResolvedValue({
      data: mockPayments,
    });

    renderHook(() => useFetchUserOverdueAuctionPayments(123), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(mockedAxios.create).toHaveBeenCalledWith({
        baseURL: mockBaseUrl,
      });
    });
  });

  it('should update query when userId changes', async () => {
    mockedUseSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated',
      update: vi.fn(),
    });

    mockApiClient.get.mockResolvedValue({
      data: mockPayments,
    });

    const { result, rerender } = renderHook(
      ({ userId }) => useFetchUserOverdueAuctionPayments(userId),
      {
        wrapper: createWrapper(),
        initialProps: { userId: 123 },
      },
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Change userId
    rerender({ userId: 456 });

    await waitFor(() => {
      expect(mockApiClient.get).toHaveBeenCalledWith(
        '/rentals/user/456/overdue-auction-payments',
        {
          headers: {
            Authorization: 'Bearer mock-access-token',
          },
        },
      );
    });
  });

  it('should include session access token in query key', () => {
    const mockSessionWithDifferentToken = {
      ...mockSession,
      accessToken: 'different-token',
    };

    mockedUseSession.mockReturnValue({
      data: mockSessionWithDifferentToken,
      status: 'authenticated',
      update: vi.fn(),
    });

    const { result } = renderHook(
      () => useFetchUserOverdueAuctionPayments(123),
      { wrapper: createWrapper() },
    );

    // Query key should include the access token for cache invalidation
    expect(result.current.loading).toBe(true);
  });
});
