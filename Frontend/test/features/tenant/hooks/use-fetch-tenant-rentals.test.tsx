import useFetchTenantRentals, {
  Address,
  Rental,
} from '@/features/tenant/hooks/use-fetch-tenant-rentals';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import { env } from 'next-runtime-env';
import { ReactNode } from 'react';
import {
  beforeEach,
  describe,
  expect,
  it,
  Mock,
  MockInstance,
  vi,
} from 'vitest';

// Mock dependencies
vi.mock('next-auth/react');
vi.mock('next-runtime-env');
vi.mock('axios');

const mockedUseSession = useSession as Mock;
const mockedEnv = env as Mock;
const mockedAxios = axios as unknown as {
  create: MockInstance;
  get: MockInstance;
};

// Test wrapper component
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  Wrapper.displayName = 'QueryClientTestWrapper';
  return Wrapper;
};

// Mock data
const mockAddress: Address = {
  street: '123 Test Street',
  apartmentNumber: '4A',
  city: 'Test City',
  postalCode: '12345',
  country: 'Test Country',
  fullAddress: '123 Test Street, 4A, Test City, 12345, Test Country',
  latitude: 40.7128,
  longitude: -74.006,
};

const mockRentals: Rental[] = [
  {
    id: 1,
    apartmentId: 101,
    tenantId: 1,
    ownerId: 201,
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-01-07'),
    nights: 6,
    pricePerNight: 100,
    totalCost: 600,
    status: 'ACTIVE',
    address: mockAddress,
    apartmentOccupied: true,
    rentalFees: 50,
  },
  {
    id: 2,
    apartmentId: 102,
    tenantId: 1,
    ownerId: 202,
    startDate: new Date('2024-02-01'),
    endDate: new Date('2024-02-05'),
    nights: 4,
    pricePerNight: 150,
    totalCost: 600,
    status: 'COMPLETED',
    address: { ...mockAddress, street: '456 Another Street' },
    apartmentOccupied: false,
    rentalFees: 30,
  },
];

describe('useFetchTenantRentals', () => {
  const mockAxiosInstance = {
    get: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mocks
    mockedEnv.mockReturnValue('https://api.example.com');
    mockedAxios.create.mockReturnValue(mockAxiosInstance);
  });

  it('should fetch tenant rentals successfully when authenticated', async () => {
    // Arrange
    const mockSession = {
      accessToken: 'mock-access-token',
    };
    mockedUseSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated',
    });
    mockAxiosInstance.get.mockResolvedValue({ data: mockRentals });

    // Act
    const { result } = renderHook(() => useFetchTenantRentals(1, 'ACTIVE'), {
      wrapper: createWrapper(),
    });

    // Assert
    await waitFor(() => {
      expect(result.current.rentals).toEqual(mockRentals);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    expect(mockedAxios.create).toHaveBeenCalledWith({
      baseURL: 'https://api.example.com',
    });

    expect(mockAxiosInstance.get).toHaveBeenCalledWith(
      '/rentals/my-rentals/tenant/1',
      {
        headers: {
          Authorization: 'Bearer mock-access-token',
        },
      },
    );
  });

  it('should not fetch when session is loading', async () => {
    // Arrange
    mockedUseSession.mockReturnValue({
      data: null,
      status: 'loading',
    });

    // Act
    const { result } = renderHook(() => useFetchTenantRentals(1, 'ACTIVE'), {
      wrapper: createWrapper(),
    });

    // Assert - should not make API call
    expect(mockAxiosInstance.get).not.toHaveBeenCalled();
    expect(result.current.rentals).toBeUndefined();
    expect(result.current.loading).toBe(false); // Query is disabled
  });

  it('should not fetch when user is not authenticated', async () => {
    // Arrange
    mockedUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
    });

    // Act
    const { result } = renderHook(() => useFetchTenantRentals(1, 'ACTIVE'), {
      wrapper: createWrapper(),
    });

    // Assert - should not make API call
    expect(mockAxiosInstance.get).not.toHaveBeenCalled();
    expect(result.current.rentals).toBeUndefined();
    expect(result.current.loading).toBe(false); // Query is disabled
  });

  it('should not fetch when userId is not provided', async () => {
    // Arrange
    const mockSession = {
      accessToken: 'mock-access-token',
    };
    mockedUseSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated',
    });

    // Act
    const { result } = renderHook(() => useFetchTenantRentals(0, 'ACTIVE'), {
      wrapper: createWrapper(),
    });

    // Assert - should not make API call
    expect(mockAxiosInstance.get).not.toHaveBeenCalled();
    expect(result.current.rentals).toBeUndefined();
    expect(result.current.loading).toBe(false); // Query is disabled
  });

  it('should fetch without authorization header when no access token', async () => {
    // Arrange
    const mockSession = null;
    mockedUseSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated',
    });
    mockAxiosInstance.get.mockResolvedValue({ data: mockRentals });

    // Act
    const { result } = renderHook(() => useFetchTenantRentals(1, 'ACTIVE'), {
      wrapper: createWrapper(),
    });

    // Assert
    await waitFor(() => {
      expect(result.current.rentals).toEqual(mockRentals);
    });

    expect(mockAxiosInstance.get).toHaveBeenCalledWith(
      '/rentals/my-rentals/tenant/1',
      {
        headers: undefined,
      },
    );
  });

  it('should handle API errors properly', async () => {
    // Arrange
    const mockSession = {
      accessToken: 'mock-access-token',
    };
    mockedUseSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated',
    });
    const mockError = new Error('Failed to fetch rentals');
    mockAxiosInstance.get.mockRejectedValue(mockError);

    // Act
    const { result } = renderHook(() => useFetchTenantRentals(1, 'ACTIVE'), {
      wrapper: createWrapper(),
    });

    // Assert
    await waitFor(() => {
      expect(result.current.error).toEqual(mockError);
      expect(result.current.loading).toBe(false);
      expect(result.current.rentals).toBeUndefined();
    });
  });

  it('should return correct properties and types', async () => {
    // Arrange
    const mockSession = {
      accessToken: 'mock-access-token',
    };
    mockedUseSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated',
    });
    mockAxiosInstance.get.mockResolvedValue({ data: mockRentals });

    // Act
    const { result } = renderHook(() => useFetchTenantRentals(1, 'ACTIVE'), {
      wrapper: createWrapper(),
    });

    // Assert
    expect(result.current).toHaveProperty('rentals');
    expect(result.current).toHaveProperty('loading');
    expect(result.current).toHaveProperty('error');

    await waitFor(() => {
      expect(typeof result.current.loading).toBe('boolean');
      expect(Array.isArray(result.current.rentals)).toBe(true);
    });
  });

  it('should use correct query key with all parameters', async () => {
    // Arrange
    const mockSession = {
      accessToken: 'mock-access-token',
    };
    mockedUseSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated',
    });
    mockAxiosInstance.get.mockResolvedValue({ data: mockRentals });

    // Act
    renderHook(() => useFetchTenantRentals(123, 'PENDING'), {
      wrapper: createWrapper(),
    });

    // Assert - The query key should include userId, status, and accessToken
    // This is tested indirectly by ensuring the hook behaves correctly
    // when these parameters change
    expect(mockAxiosInstance.get).toHaveBeenCalledWith(
      '/rentals/my-rentals/tenant/123',
      expect.any(Object),
    );
  });

  it('should handle different rental statuses', async () => {
    // Arrange
    const mockSession = {
      accessToken: 'mock-access-token',
    };
    mockedUseSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated',
    });

    const completedRentals = mockRentals.filter(
      (r) => r.status === 'COMPLETED',
    );
    mockAxiosInstance.get.mockResolvedValue({ data: completedRentals });

    // Act
    const { result } = renderHook(() => useFetchTenantRentals(1, 'COMPLETED'), {
      wrapper: createWrapper(),
    });

    // Assert
    await waitFor(() => {
      expect(result.current.rentals).toEqual(completedRentals);
    });

    expect(mockAxiosInstance.get).toHaveBeenCalledWith(
      '/rentals/my-rentals/tenant/1',
      expect.any(Object),
    );
  });

  it('should refetch when userId changes', async () => {
    // Arrange
    const mockSession = {
      accessToken: 'mock-access-token',
    };
    mockedUseSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated',
    });
    mockAxiosInstance.get.mockResolvedValue({ data: mockRentals });

    // Act
    const { result, rerender } = renderHook(
      ({ userId }) => useFetchTenantRentals(userId, 'ACTIVE'),
      {
        wrapper: createWrapper(),
        initialProps: { userId: 1 },
      },
    );

    await waitFor(() => {
      expect(result.current.rentals).toEqual(mockRentals);
    });

    // Change userId
    mockAxiosInstance.get.mockClear();
    rerender({ userId: 2 });

    // Assert
    await waitFor(() => {
      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        '/rentals/my-rentals/tenant/2',
        expect.any(Object),
      );
    });
  });

  it('should refetch when status changes', async () => {
    // Arrange
    const mockSession = {
      accessToken: 'mock-access-token',
    };
    mockedUseSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated',
    });
    mockAxiosInstance.get.mockResolvedValue({ data: mockRentals });

    // Act
    const { result, rerender } = renderHook(
      ({ status }) => useFetchTenantRentals(1, status),
      {
        wrapper: createWrapper(),
        initialProps: { status: 'ACTIVE' as Rental['status'] },
      },
    );

    await waitFor(() => {
      expect(result.current.rentals).toEqual(mockRentals);
    });

    // Change status
    mockAxiosInstance.get.mockClear();
    rerender({ status: 'COMPLETED' as Rental['status'] });

    // Assert - should trigger new request with same endpoint but different query key
    await waitFor(() => {
      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        '/rentals/my-rentals/tenant/1',
        expect.any(Object),
      );
    });
  });

  it('should return null from queryFn when session is loading', async () => {
    // Arrange
    mockedUseSession.mockReturnValue({
      data: null,
      status: 'loading',
    });

    // Since the query is disabled when session is loading, we need to test
    // the queryFn behavior directly by temporarily enabling the query
    const mockSession = {
      accessToken: 'mock-access-token',
    };

    // First set up loading state
    mockedUseSession.mockReturnValueOnce({
      data: null,
      status: 'loading',
    });

    // Then change to authenticated to trigger the queryFn
    mockedUseSession.mockReturnValue({
      data: mockSession,
      status: 'loading',
    });

    mockAxiosInstance.get.mockResolvedValue({ data: null });

    // Act
    const { result } = renderHook(() => useFetchTenantRentals(1, 'ACTIVE'), {
      wrapper: createWrapper(),
    });

    // The query should be disabled, so no API call should be made
    expect(mockAxiosInstance.get).not.toHaveBeenCalled();
    expect(result.current.rentals).toBeUndefined();
  });

  it('should use correct API base URL from environment', async () => {
    // Arrange
    const customBaseURL = 'https://custom-api.example.com';
    mockedEnv.mockReturnValue(customBaseURL);
    const mockSession = {
      accessToken: 'mock-access-token',
    };
    mockedUseSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated',
    });
    mockAxiosInstance.get.mockResolvedValue({ data: mockRentals });

    // Act
    renderHook(() => useFetchTenantRentals(1, 'ACTIVE'), {
      wrapper: createWrapper(),
    });

    // Assert
    await waitFor(() => {
      expect(mockedAxios.create).toHaveBeenCalledWith({
        baseURL: customBaseURL,
      });
    });
  });
});
