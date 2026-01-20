import useFetchTenantRentals from '@/features/apartment/hooks/use-fetch-apt-rentals';
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
  user: { id: '10', name: 'Test User', role: 'TENANT' },
  expires: '2099-01-01T00:00:00.000Z',
} satisfies import('next-auth').Session;

const mockRentals = [{ apartmentId: 42 }, { apartmentId: 99 }];

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

describe('useFetchTenantRentals', () => {
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

  it('does not fetch if not authenticated', () => {
    mockedUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: vi.fn(),
    });
    const { result } = renderHook(() => useFetchTenantRentals(42), {
      wrapper: createWrapper(),
    });
    expect(result.current.hasCompletedRental).toBe(false);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(mockApiClient.get).not.toHaveBeenCalled();
  });

  it('does not fetch if apartmentId is falsy', () => {
    mockedUseSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated',
      update: vi.fn(),
    });
    const { result } = renderHook(() => useFetchTenantRentals(0), {
      wrapper: createWrapper(),
    });
    expect(result.current.hasCompletedRental).toBe(false);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(mockApiClient.get).not.toHaveBeenCalled();
  });

  it('does not fetch if session.user.id is falsy', () => {
    const sessionNoUserId = {
      ...mockSession,
      user: { ...mockSession.user, id: '' },
    };
    mockedUseSession.mockReturnValue({
      data: sessionNoUserId,
      status: 'authenticated',
      update: vi.fn(),
    });
    const { result } = renderHook(() => useFetchTenantRentals(42), {
      wrapper: createWrapper(),
    });
    expect(result.current.hasCompletedRental).toBe(false);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(mockApiClient.get).not.toHaveBeenCalled();
  });

  it('fetches rentals and returns true if completed rental exists', async () => {
    mockedUseSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated',
      update: vi.fn(),
    });
    mockApiClient.get.mockResolvedValue({ data: mockRentals });
    const { result } = renderHook(() => useFetchTenantRentals(42), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockApiClient.get).toHaveBeenCalledWith(
      '/rentals/my-rentals/tenant/10',
      {
        params: { status: 'COMPLETED' },
        headers: { Authorization: 'Bearer mock-access-token' },
      },
    );
    expect(result.current.hasCompletedRental).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('returns false if no completed rental for apartment', async () => {
    mockedUseSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated',
      update: vi.fn(),
    });
    mockApiClient.get.mockResolvedValue({ data: [{ apartmentId: 99 }] });
    const { result } = renderHook(() => useFetchTenantRentals(42), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.hasCompletedRental).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('fetches without Authorization header if no accessToken', async () => {
    const sessionNoToken = {
      user: { id: '10', name: 'Test User', role: 'TENANT' },
      expires: '2099-01-01T00:00:00.000Z',
    };
    mockedUseSession.mockReturnValue({
      data: sessionNoToken,
      status: 'authenticated',
      update: vi.fn(),
    });
    mockApiClient.get.mockResolvedValue({ data: mockRentals });
    const { result } = renderHook(() => useFetchTenantRentals(42), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockApiClient.get).toHaveBeenCalledWith(
      '/rentals/my-rentals/tenant/10',
      {
        params: { status: 'COMPLETED' },
        headers: undefined,
      },
    );
    expect(result.current.hasCompletedRental).toBe(true);
  });

  it('handles API errors', async () => {
    mockedUseSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated',
      update: vi.fn(),
    });
    const apiError = new Error('API error');
    mockApiClient.get.mockRejectedValue(apiError);
    const { result } = renderHook(() => useFetchTenantRentals(42), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.hasCompletedRental).toBe(false);
    expect(result.current.error).toBe(apiError);
  });
});
