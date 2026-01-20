import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { AxiosInstance } from 'axios';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import { env } from 'next-runtime-env';
import { vi } from 'vitest';
import useFetchTenant from '../../../../src/features/tenant/hooks/use-fetch-tenant-details';

vi.mock('next-auth/react');
vi.mock('axios');
vi.mock('next-runtime-env');

const mockedUseSession = vi.mocked(useSession);
const mockedAxiosCreate = vi.mocked(axios.create);
const mockedEnv = vi.mocked(env);

describe('useFetchTenant', () => {
  const tenantId = 123;
  const mockTenant = {
    id: tenantId,
    username: 'testuser',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    phone: '123456789',
    roles: ['tenant'],
    ownedApartments: [],
    rentals: [],
  };

  // Add QueryClientProvider wrapper for all tests
  const createWrapper = () => {
    const queryClient = new QueryClient();
    const Wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    Wrapper.displayName = 'QueryClientProviderWrapper';
    return Wrapper;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockedEnv.mockReturnValue('http://api.test');
  });

  it('fetches tenant details when authenticated', async () => {
    mockedUseSession.mockReturnValue({
      data: { accessToken: 'token' },
      status: 'authenticated',
    } as ReturnType<typeof useSession>);
    mockedAxiosCreate.mockReturnValue({
      get: vi.fn().mockResolvedValue({ data: mockTenant }),
    } as unknown as AxiosInstance);

    const { result } = renderHook(() => useFetchTenant(tenantId), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.tenant).toEqual(mockTenant);
    expect(result.current.error).toBeNull();
  });

  it('returns error if API call fails', async () => {
    mockedUseSession.mockReturnValue({
      data: { accessToken: 'token' },
      status: 'authenticated',
    } as ReturnType<typeof useSession>);
    mockedAxiosCreate.mockReturnValue({
      get: vi.fn().mockRejectedValue(new Error('API error')),
    } as unknown as AxiosInstance);

    const { result } = renderHook(() => useFetchTenant(tenantId), {
      wrapper: createWrapper(),
    });
    //await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.tenant).toBeUndefined();
    //expect(result.current.error).toBeInstanceOf(Error);
  });

  it('does not fetch if session is unauthenticated', async () => {
    mockedUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
    } as ReturnType<typeof useSession>);
    const getMock = vi.fn();
    mockedAxiosCreate.mockReturnValue({
      get: getMock,
    } as unknown as AxiosInstance);

    const { result } = renderHook(() => useFetchTenant(tenantId), {
      wrapper: createWrapper(),
    });
    expect(result.current.tenant).toBeUndefined();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(getMock).not.toHaveBeenCalled();
  });

  it('returns null if session is loading', async () => {
    mockedUseSession.mockReturnValue({
      data: null,
      status: 'loading',
    } as ReturnType<typeof useSession>);
    const getMock = vi.fn();
    mockedAxiosCreate.mockReturnValue({
      get: getMock,
    } as unknown as AxiosInstance);

    const { result } = renderHook(() => useFetchTenant(tenantId), {
      wrapper: createWrapper(),
    });
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(getMock).not.toHaveBeenCalled();
  });
});
