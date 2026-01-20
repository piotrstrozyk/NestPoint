import useAuctionExists from '@/features/apartment/hooks/use-auction-exists';
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

describe('useAuctionExists', () => {
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

  it('does not fetch if apartmentId is falsy', () => {
    mockedUseSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated',
      update: vi.fn(),
    });
    const { result } = renderHook(() => useAuctionExists(0), {
      wrapper: createWrapper(),
    });
    expect(result.current.exists).toBe(false);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(mockApiClient.get).not.toHaveBeenCalled();
  });

  it('does not fetch if session is loading', () => {
    mockedUseSession.mockReturnValue({
      data: null,
      status: 'loading',
      update: vi.fn(),
    });
    const { result } = renderHook(() => useAuctionExists(42), {
      wrapper: createWrapper(),
    });
    expect(result.current.exists).toBe(false);
    expect(result.current.error).toBeNull();
    expect(mockApiClient.get).not.toHaveBeenCalled();
  });

  it('returns true if auction exists for apartment', async () => {
    mockedUseSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated',
      update: vi.fn(),
    });
    mockApiClient.get.mockResolvedValue({
      data: [
        { id: 1, apartmentId: 42 },
        { id: 2, apartmentId: 99 },
      ],
    });
    const { result } = renderHook(() => useAuctionExists(42), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.exists).toBe(true);
    expect(result.current.error).toBeNull();
    expect(mockApiClient.get).toHaveBeenCalledWith('/auctions', {
      headers: { Authorization: 'Bearer mock-access-token' },
    });
  });

  it('returns false if auction does not exist for apartment', async () => {
    mockedUseSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated',
      update: vi.fn(),
    });
    mockApiClient.get.mockResolvedValue({
      data: [
        { id: 1, apartmentId: 99 },
        { id: 2, apartmentId: 100 },
      ],
    });
    const { result } = renderHook(() => useAuctionExists(42), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.exists).toBe(false);
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
    mockApiClient.get.mockResolvedValue({ data: [{ id: 1, apartmentId: 42 }] });
    const { result } = renderHook(() => useAuctionExists(42), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockApiClient.get).toHaveBeenCalledWith('/auctions', {
      headers: undefined,
    });
    expect(result.current.exists).toBe(true);
  });

  it('handles API errors', async () => {
    mockedUseSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated',
      update: vi.fn(),
    });
    const apiError = new Error('API error');
    mockApiClient.get.mockRejectedValue(apiError);
    const { result } = renderHook(() => useAuctionExists(42), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.exists).toBe(false);
    expect(result.current.error).toBe(apiError);
  });
});
