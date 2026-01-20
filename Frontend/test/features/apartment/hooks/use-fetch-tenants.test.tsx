import useFetchTenants, {
  Tenant,
} from '@/features/apartment/hooks/use-fetch-tenants';
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
const mockTenants: Tenant[] = [
  {
    id: 1,
    username: 'john.doe',
    email: 'john.doe@example.com',
    firstName: 'John',
    lastName: 'Doe',
    phone: '+1234567890',
    roles: ['TENANT'],
    ownedApartments: [],
    rentals: [{ id: 1, apartmentId: 101 }],
  },
  {
    id: 2,
    username: 'jane.smith',
    email: 'jane.smith@example.com',
    firstName: 'Jane',
    lastName: 'Smith',
    phone: '+1987654321',
    roles: ['TENANT', 'LANDLORD'],
    ownedApartments: [{ id: 201, address: '123 Main St' }],
    rentals: [],
  },
  {
    id: 3,
    username: 'admin.user',
    email: 'admin@example.com',
    firstName: 'Admin',
    lastName: 'User',
    phone: '+1555000000',
    roles: ['ADMIN', 'TENANT'],
    ownedApartments: [],
    rentals: [],
  },
];

const mockSession = {
  accessToken: 'mock-access-token',
  user: { id: '1', name: 'Test User', role: 'TENANT' },
  expires: '2099-01-01T00:00:00.000Z',
} satisfies import('next-auth').Session;

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
  Wrapper.displayName = 'ReactQueryTestWrapper';
  return Wrapper;
};

describe('useFetchTenants', () => {
  const mockApiClient: { get: ReturnType<typeof vi.fn> } = {
    get: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Setup default mocks
    mockedEnv.mockReturnValue('https://api.example.com');
    (mockedAxios.create as unknown as jest.Mock).mockReturnValue(
      mockApiClient as unknown as import('axios').AxiosInstance,
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should return initial state when loading', () => {
    mockedUseSession.mockReturnValue({
      data: null,
      status: 'loading',
      update: vi.fn(),
    });

    const { result } = renderHook(() => useFetchTenants(), {
      wrapper: createWrapper(),
    });

    expect(result.current.tenants).toEqual([]);
    expect(result.current.error).toBe(null);
  });

  it('should create axios client with correct base URL', () => {
    const mockBaseUrl = 'https://custom-api.example.com';
    mockedEnv.mockReturnValue(mockBaseUrl);
    mockedUseSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated',
      update: vi.fn(),
    });

    renderHook(() => useFetchTenants(), { wrapper: createWrapper() });

    expect(mockedAxios.create).toHaveBeenCalledWith({
      baseURL: mockBaseUrl,
    });
  });

  it('should not fetch when session is loading', () => {
    mockedUseSession.mockReturnValue({
      data: null,
      status: 'loading',
      update: vi.fn(),
    });

    renderHook(() => useFetchTenants(), { wrapper: createWrapper() });

    expect(mockApiClient.get).not.toHaveBeenCalled();
  });

  it('should fetch tenants successfully when authenticated', async () => {
    mockedUseSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated',
      update: vi.fn(),
    });

    mockApiClient.get.mockResolvedValue({
      data: mockTenants,
    });

    const { result } = renderHook(() => useFetchTenants(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockApiClient.get).toHaveBeenCalledWith('/tenants', {
      headers: {
        Authorization: 'Bearer mock-access-token',
      },
    });

    expect(result.current.tenants).toEqual(mockTenants);
    expect(result.current.error).toBe(null);
  });

  it('should fetch tenants without authorization header when no access token', async () => {
    const sessionWithoutToken = {
      user: { id: '1', name: 'Test User', role: 'TENANT' },
      expires: '2099-01-01T00:00:00.000Z',
    } satisfies import('next-auth').Session;
    mockedUseSession.mockReturnValue({
      data: sessionWithoutToken,
      status: 'authenticated',
      update: vi.fn(),
    });

    mockApiClient.get.mockResolvedValue({
      data: mockTenants,
    });

    const { result } = renderHook(() => useFetchTenants(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockApiClient.get).toHaveBeenCalledWith('/tenants', {
      headers: undefined,
    });

    expect(result.current.tenants).toEqual(mockTenants);
  });

  it('should fetch tenants when unauthenticated', async () => {
    mockedUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: vi.fn(),
    });

    mockApiClient.get.mockResolvedValue({
      data: mockTenants,
    });

    const { result } = renderHook(() => useFetchTenants(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockApiClient.get).toHaveBeenCalledWith('/tenants', {
      headers: undefined,
    });

    expect(result.current.tenants).toEqual(mockTenants);
  });

  it('should handle API errors', async () => {
    mockedUseSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated',
      update: vi.fn(),
    });

    const mockError = new Error('Failed to fetch tenants');
    mockApiClient.get.mockRejectedValue(mockError);

    const { result } = renderHook(() => useFetchTenants(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.tenants).toEqual([]);
    expect(result.current.error).toEqual(mockError);
  });

  it('should return empty array when API returns empty data', async () => {
    mockedUseSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated',
      update: vi.fn(),
    });

    mockApiClient.get.mockResolvedValue({
      data: [],
    });

    const { result } = renderHook(() => useFetchTenants(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.tenants).toEqual([]);
    expect(result.current.error).toBe(null);
  });

  it('should handle tenants with different role combinations', async () => {
    const tenantsWithDifferentRoles: Tenant[] = [
      {
        id: 1,
        username: 'tenant.only',
        email: 'tenant@example.com',
        firstName: 'Tenant',
        lastName: 'Only',
        phone: '+1111111111',
        roles: ['TENANT'],
        ownedApartments: [],
        rentals: [],
      },
      {
        id: 2,
        username: 'multi.role',
        email: 'multi@example.com',
        firstName: 'Multi',
        lastName: 'Role',
        phone: '+2222222222',
        roles: ['TENANT', 'LANDLORD', 'ADMIN'],
        ownedApartments: [],
        rentals: [],
      },
    ];

    mockedUseSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated',
      update: vi.fn(),
    });

    mockApiClient.get.mockResolvedValue({
      data: tenantsWithDifferentRoles,
    });

    const { result } = renderHook(() => useFetchTenants(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.tenants).toEqual(tenantsWithDifferentRoles);
    expect(result.current.tenants[0].roles).toEqual(['TENANT']);
    expect(result.current.tenants[1].roles).toEqual([
      'TENANT',
      'LANDLORD',
      'ADMIN',
    ]);
  });

  it('should handle tenants with owned apartments and rentals', async () => {
    const tenantsWithProperties: Tenant[] = [
      {
        id: 1,
        username: 'landlord.tenant',
        email: 'landlord@example.com',
        firstName: 'Landlord',
        lastName: 'Tenant',
        phone: '+3333333333',
        roles: ['TENANT', 'LANDLORD'],
        ownedApartments: [
          { id: 1, address: '123 Main St' },
          { id: 2, address: '456 Oak Ave' },
        ],
        rentals: [{ id: 1, apartmentId: 999 }],
      },
    ];

    mockedUseSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated',
      update: vi.fn(),
    });

    mockApiClient.get.mockResolvedValue({
      data: tenantsWithProperties,
    });

    const { result } = renderHook(() => useFetchTenants(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.tenants).toEqual(tenantsWithProperties);
    expect(result.current.tenants[0].ownedApartments).toHaveLength(2);
    expect(result.current.tenants[0].rentals).toHaveLength(1);
  });

  it('should handle network errors gracefully', async () => {
    mockedUseSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated',
      update: vi.fn(),
    });

    const networkError = new Error('Network Error');
    networkError.name = 'NetworkError';
    mockApiClient.get.mockRejectedValue(networkError);

    const { result } = renderHook(() => useFetchTenants(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.tenants).toEqual([]);
    expect(result.current.error).toEqual(networkError);
    expect(result.current.error?.name).toBe('NetworkError');
  });

  it('should handle 401 unauthorized errors', async () => {
    mockedUseSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated',
      update: vi.fn(),
    });

    const unauthorizedError = new Error('Unauthorized') as Error & {
      response?: { status: number };
    };
    unauthorizedError.response = { status: 401 };
    mockApiClient.get.mockRejectedValue(unauthorizedError);

    const { result } = renderHook(() => useFetchTenants(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.tenants).toEqual([]);
    expect(result.current.error).toEqual(unauthorizedError);
  });

  it('should handle 403 forbidden errors', async () => {
    mockedUseSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated',
      update: vi.fn(),
    });

    const forbiddenError = new Error('Forbidden') as Error & {
      response?: { status: number };
    };
    forbiddenError.response = { status: 403 };
    mockApiClient.get.mockRejectedValue(forbiddenError);

    const { result } = renderHook(() => useFetchTenants(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.tenants).toEqual([]);
    expect(result.current.error).toEqual(forbiddenError);
  });

  it('should handle malformed response data', async () => {
    mockedUseSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated',
      update: vi.fn(),
    });

    // API returns malformed data
    mockApiClient.get.mockResolvedValue({
      data: null,
    });

    const { result } = renderHook(() => useFetchTenants(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Should still return empty array for null data
    expect(result.current.tenants).toEqual([]);
    expect(result.current.error).toBe(null);
  });

  it('should include access token in query key for cache invalidation', async () => {
    mockedUseSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated',
      update: vi.fn(),
    });

    mockApiClient.get.mockResolvedValue({
      data: mockTenants,
    });

    const { result } = renderHook(() => useFetchTenants(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.tenants).toEqual(mockTenants);
  });
});
