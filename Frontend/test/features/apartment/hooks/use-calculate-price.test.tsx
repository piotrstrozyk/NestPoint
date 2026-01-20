import {
  PriceCalculationResponse,
  useCalculatePrice,
} from '@/features/apartment/hooks/use-calculate-price';
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

const mockPrice: PriceCalculationResponse = {
  apartmentId: 42,
  title: 'Luxury Flat',
  startDate: new Date('2025-07-01'),
  endDate: new Date('2025-07-10'),
  nights: 9,
  pricePerNight: 100,
  totalPrice: 900,
};

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

describe('useCalculatePrice', () => {
  let mockApiClient: { get: ReturnType<typeof vi.fn> };
  const startDate = new Date('2025-07-01');
  const endDate = new Date('2025-07-10');

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
    const { result } = renderHook(
      () => useCalculatePrice(42, startDate, endDate),
      { wrapper: createWrapper() },
    );
    expect(result.current.data).toBeUndefined();
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
    const { result } = renderHook(
      () => useCalculatePrice(0, startDate, endDate),
      { wrapper: createWrapper() },
    );
    expect(result.current.data).toBeUndefined();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(mockApiClient.get).not.toHaveBeenCalled();
  });

  it('does not fetch if startDate or endDate is null', () => {
    mockedUseSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated',
      update: vi.fn(),
    });
    const { result } = renderHook(() => useCalculatePrice(42, null, endDate), {
      wrapper: createWrapper(),
    });
    expect(result.current.data).toBeUndefined();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(mockApiClient.get).not.toHaveBeenCalled();
    const { result: result2 } = renderHook(
      () => useCalculatePrice(42, startDate, null),
      { wrapper: createWrapper() },
    );
    expect(result2.current.data).toBeUndefined();
    expect(result2.current.loading).toBe(false);
    expect(result2.current.error).toBeNull();
    expect(mockApiClient.get).not.toHaveBeenCalled();
  });

  it('fetches price calculation with correct params and headers', async () => {
    mockedUseSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated',
      update: vi.fn(),
    });
    mockApiClient.get.mockResolvedValue({ data: mockPrice });
    const { result } = renderHook(
      () => useCalculatePrice(42, startDate, endDate),
      { wrapper: createWrapper() },
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockApiClient.get).toHaveBeenCalledWith(
      '/apartments/42/calculate-price',
      {
        params: { startDate: '2025-07-01', endDate: '2025-07-10' },
        headers: { Authorization: 'Bearer mock-access-token' },
      },
    );
    expect(result.current.data).toEqual(mockPrice);
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
    mockApiClient.get.mockResolvedValue({ data: mockPrice });
    const { result } = renderHook(
      () => useCalculatePrice(42, startDate, endDate),
      { wrapper: createWrapper() },
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockApiClient.get).toHaveBeenCalledWith(
      '/apartments/42/calculate-price',
      {
        params: { startDate: '2025-07-01', endDate: '2025-07-10' },
        headers: undefined,
      },
    );
    expect(result.current.data).toEqual(mockPrice);
  });

  it('handles API errors', async () => {
    mockedUseSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated',
      update: vi.fn(),
    });
    const apiError = new Error('API error');
    mockApiClient.get.mockRejectedValue(apiError);
    const { result } = renderHook(
      () => useCalculatePrice(42, startDate, endDate),
      { wrapper: createWrapper() },
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toBe(apiError);
  });
});
