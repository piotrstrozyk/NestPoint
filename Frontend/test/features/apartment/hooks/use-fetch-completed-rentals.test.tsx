import useFetchTenantRentals, {
  Address,
  Rental,
} from '@/features/apartment/hooks/use-fetch-completed-rentals';
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

const mockAddress: Address = {
  street: 'Main St',
  apartmentNumber: '12A',
  city: 'Warsaw',
  postalCode: '00-001',
  country: 'Poland',
  fullAddress: 'Main St 12A, 00-001 Warsaw, Poland',
  latitude: 52.2297,
  longitude: 21.0122,
};

const mockRentals: Rental[] = [
  {
    id: 1,
    apartmentId: 101,
    tenantId: 10,
    ownerId: 20,
    startDate: new Date('2025-06-01'),
    endDate: new Date('2025-06-10'),
    nights: 9,
    pricePerNight: 100,
    totalCost: 900,
    status: 'COMPLETED',
    address: mockAddress,
    apartmentOccupied: false,
    rentalFees: 50,
  },
  {
    id: 2,
    apartmentId: 102,
    tenantId: 10,
    ownerId: 21,
    startDate: new Date('2025-05-01'),
    endDate: new Date('2025-05-05'),
    nights: 4,
    pricePerNight: 120,
    totalCost: 480,
    status: 'COMPLETED',
    address: mockAddress,
    apartmentOccupied: true,
    rentalFees: 30,
  },
];

const mockSession = {
  accessToken: 'mock-access-token',
  user: { id: '10', name: 'Test User', role: 'TENANT' },
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
    const { result } = renderHook(() => useFetchTenantRentals(10), {
      wrapper: createWrapper(),
    });
    expect(result.current.rentals).toBeUndefined();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(mockApiClient.get).not.toHaveBeenCalled();
  });

  it('does not fetch if userId is falsy', () => {
    mockedUseSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated',
      update: vi.fn(),
    });
    const { result } = renderHook(() => useFetchTenantRentals(0), {
      wrapper: createWrapper(),
    });
    expect(result.current.rentals).toBeUndefined();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(mockApiClient.get).not.toHaveBeenCalled();
  });

  it('fetches rentals with correct params and headers', async () => {
    mockedUseSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated',
      update: vi.fn(),
    });
    mockApiClient.get.mockResolvedValue({ data: mockRentals });
    const { result } = renderHook(
      () => useFetchTenantRentals(10, 'COMPLETED'),
      { wrapper: createWrapper() },
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockApiClient.get).toHaveBeenCalledWith(
      '/rentals/my-rentals/tenant/10',
      {
        params: { status: 'completed' },
        headers: { Authorization: 'Bearer mock-access-token' },
      },
    );
    expect(result.current.rentals).toEqual(mockRentals);
    expect(result.current.error).toBeNull();
  });

  it('fetches rentals without Authorization header if no accessToken', async () => {
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
    const { result } = renderHook(
      () => useFetchTenantRentals(10, 'COMPLETED'),
      { wrapper: createWrapper() },
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockApiClient.get).toHaveBeenCalledWith(
      '/rentals/my-rentals/tenant/10',
      {
        params: { status: 'completed' },
        headers: undefined,
      },
    );
    expect(result.current.rentals).toEqual(mockRentals);
  });

  it('fetches rentals with custom status', async () => {
    mockedUseSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated',
      update: vi.fn(),
    });
    mockApiClient.get.mockResolvedValue({ data: mockRentals });
    const { result } = renderHook(() => useFetchTenantRentals(10, 'ACTIVE'), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockApiClient.get).toHaveBeenCalledWith(
      '/rentals/my-rentals/tenant/10',
      {
        params: { status: 'active' },
        headers: { Authorization: 'Bearer mock-access-token' },
      },
    );
    expect(result.current.rentals).toEqual(mockRentals);
  });

  it('handles API errors', async () => {
    mockedUseSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated',
      update: vi.fn(),
    });
    const apiError = new Error('API error');
    mockApiClient.get.mockRejectedValue(apiError);
    const { result } = renderHook(() => useFetchTenantRentals(10), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.rentals).toBeUndefined();
    expect(result.current.error).toBe(apiError);
  });

  it('returns empty array if API returns empty', async () => {
    mockedUseSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated',
      update: vi.fn(),
    });
    mockApiClient.get.mockResolvedValue({ data: [] });
    const { result } = renderHook(() => useFetchTenantRentals(10), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.rentals).toEqual([]);
    expect(result.current.error).toBeNull();
  });
});
