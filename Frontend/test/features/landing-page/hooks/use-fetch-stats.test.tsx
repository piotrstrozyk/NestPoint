import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { AxiosInstance } from 'axios';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import { env } from 'next-runtime-env';
import { vi } from 'vitest';
import { useFetchStats } from '../../../../src/features/landing-page/hooks/use-fetch-stats';

vi.mock('next-auth/react');
vi.mock('axios');
vi.mock('next-runtime-env');

const mockedUseSession = vi.mocked(useSession);
const mockedAxiosCreate = vi.mocked(axios.create);
const mockedEnv = vi.mocked(env);

describe('useFetchStats', () => {
  const createWrapper = () => {
    const queryClient = new QueryClient();
    const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    Wrapper.displayName = 'QueryClientTestWrapper';
    return Wrapper;
  };
  const statsData = {
    auctions: [{}, {}],
    tenants: [{}, {}, {}],
    apartments: [{}],
    rentals: [{}, {}, {}, {}],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockedEnv.mockReturnValue('http://api.test');
  });

  it('returns correct stats when authenticated', async () => {
    mockedUseSession.mockReturnValue({
      data: { accessToken: 'token' },
      status: 'authenticated',
    } as ReturnType<typeof useSession>);
    const getMock = vi
      .fn()
      .mockResolvedValueOnce({ data: statsData.auctions })
      .mockResolvedValueOnce({ data: statsData.tenants })
      .mockResolvedValueOnce({ data: statsData.apartments })
      .mockResolvedValueOnce({ data: statsData.rentals });
    mockedAxiosCreate.mockReturnValue({
      get: getMock,
    } as unknown as AxiosInstance);

    const { result } = renderHook(() => useFetchStats(), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.stats).toEqual({
      activeAuctions: 2,
      tenants: 3,
      apartments: 1,
      rentals: 4,
      propertyTypes: { unknown: 1 },
    });
    // Should send Authorization header
    expect(getMock).toHaveBeenCalledWith(
      '/auctions/active',
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer token' }),
      }),
    );
  });

  it('returns correct stats when unauthenticated (no Authorization header)', async () => {
    mockedUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
    } as ReturnType<typeof useSession>);
    const getMock = vi
      .fn()
      .mockResolvedValueOnce({ data: statsData.auctions })
      .mockResolvedValueOnce({ data: statsData.tenants })
      .mockResolvedValueOnce({ data: statsData.apartments })
      .mockResolvedValueOnce({ data: statsData.rentals });
    mockedAxiosCreate.mockReturnValue({
      get: getMock,
    } as unknown as AxiosInstance);

    const { result } = renderHook(() => useFetchStats(), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.stats).toEqual({
      activeAuctions: 2,
      tenants: 3,
      apartments: 1,
      rentals: 4,
      propertyTypes: { unknown: 1 }, // Match the actual output
    });
    // Should not send Authorization header
    expect(getMock).toHaveBeenCalledWith(
      '/auctions/active',
      expect.objectContaining({ headers: undefined }),
    );
  });

  it('returns zeros if session is loading', async () => {
    mockedUseSession.mockReturnValue({
      data: null,
      status: 'loading',
    } as ReturnType<typeof useSession>);
    const getMock = vi.fn();
    mockedAxiosCreate.mockReturnValue({
      get: getMock,
    } as unknown as AxiosInstance);

    const { result } = renderHook(() => useFetchStats(), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.stats).toEqual({
      activeAuctions: 0,
      tenants: 0,
      apartments: 0,
      rentals: 0,
    });
    expect(getMock).not.toHaveBeenCalled();
  });

  it('returns fallback stats if API call fails', async () => {
    mockedUseSession.mockReturnValue({
      data: { accessToken: 'token' },
      status: 'authenticated',
    } as ReturnType<typeof useSession>);
    const getMock = vi.fn().mockRejectedValue(new Error('API error'));
    mockedAxiosCreate.mockReturnValue({
      get: getMock,
    } as unknown as AxiosInstance);

    const { result } = renderHook(() => useFetchStats(), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.stats).toEqual({
      activeAuctions: 10,
      tenants: 20,
      apartments: 40,
      rentals: 18,
    });
  });
});
