import useFetchApartmentsByAuction from '@/features/apartment-list/hooks/use-fetch-by-auction';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import { env } from 'next-runtime-env';
import { Mock, vi } from 'vitest';

vi.mock('axios');
vi.mock('next-auth/react', () => ({ useSession: vi.fn() }));
vi.mock('next-runtime-env', () => ({ env: vi.fn() }));

const mockUseSession = useSession as unknown as Mock;
const mockEnv = env as unknown as Mock;
const mockAxios = axios as unknown as { create: typeof axios.create };

const createWrapper = () => {
  const queryClient = new QueryClient();
  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  Wrapper.displayName = 'QueryClientTestWrapper';
  return Wrapper;
};

describe('useFetchApartmentsByAuction', () => {
  const baseURL = 'http://api.test';
  const accessToken = 'test-token';
  const session = { accessToken };
  const apartments = [
    { id: 1, title: 'Apt 1' },
    { id: 2, title: 'Apt 2' },
  ];
  let getMock: Mock;
  let apiClient: { get: Mock };

  beforeEach(() => {
    mockEnv.mockReturnValue(baseURL);
    getMock = vi.fn();
    apiClient = { get: getMock };
    mockAxios.create = vi.fn(() => apiClient) as unknown as typeof axios.create;
    mockUseSession.mockReturnValue({ data: session, status: 'authenticated' });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('fetches apartments by auction for authenticated user', async () => {
    getMock.mockResolvedValueOnce({ data: apartments });
    const { result } = renderHook(() => useFetchApartmentsByAuction(true, false), {
      wrapper: createWrapper(),
    });
    await waitFor(() => {
      expect(result.current.apartments).not.toBeNull();
    });
    expect(getMock).toHaveBeenCalledWith(
      '/apartments/auctions',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: `Bearer ${accessToken}`,
        }),
        params: { hasUpcomingAuction: true, hasCompletedAuction: false },
      }),
    );
    expect(result.current.apartments).toEqual(apartments);
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('fetches apartments by auction for unauthenticated user (no token)', async () => {
    mockUseSession.mockReturnValue({ data: null, status: 'unauthenticated' });
    getMock.mockResolvedValueOnce({ data: apartments });
    const { result } = renderHook(() => useFetchApartmentsByAuction(false, true), {
      wrapper: createWrapper(),
    });
    await waitFor(() => {
      expect(result.current.apartments).not.toBeNull();
    });
    expect(getMock).toHaveBeenCalledWith(
      '/apartments/auctions',
      expect.objectContaining({
        headers: undefined,
        params: { hasUpcomingAuction: false, hasCompletedAuction: true },
      }),
    );
    expect(result.current.apartments).toEqual(apartments);
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('handles API error', async () => {
    getMock.mockRejectedValueOnce(new Error('API error'));
    const { result } = renderHook(() => useFetchApartmentsByAuction(true, true), {
      wrapper: createWrapper(),
    });
    expect(result.current.apartments).toBeNull();
  });

  it('shows loading state', async () => {
    let resolve: (v: { data: typeof apartments }) => void;
    getMock.mockReturnValue(
      new Promise((r) => {
        resolve = r;
      }),
    );
    const { result } = renderHook(() => useFetchApartmentsByAuction(false, false), {
      wrapper: createWrapper(),
    });
    expect(result.current.loading).toBe(true);
    resolve!({ data: apartments });
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });
});
