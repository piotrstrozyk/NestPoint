import useFetchOwners from '@/features/add-apartment/hooks/use-fetch-owners';
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

describe('useFetchOwners', () => {
  const baseURL = 'http://api.test';
  const accessToken = 'test-token';
  const session = { accessToken };
  const owners = [
    { id: 1, name: 'Owner 1' },
    { id: 2, name: 'Owner 2' },
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

  it('fetches owners for authenticated user', async () => {
    getMock.mockResolvedValueOnce({ data: owners });
    const { result } = renderHook(() => useFetchOwners(), {
      wrapper: createWrapper(),
    });
    await waitFor(() => {
      expect(result.current.owners).not.toBeUndefined();
    });
    expect(getMock).toHaveBeenCalledWith(
      '/owners',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: `Bearer ${accessToken}`,
        }),
      }),
    );
    expect(result.current.owners).toEqual(owners);
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('does not call API if unauthenticated', async () => {
    mockUseSession.mockReturnValue({ data: null, status: 'unauthenticated' });
    const { result } = renderHook(() => useFetchOwners(), {
      wrapper: createWrapper(),
    });
    await waitFor(() => {
      expect(result.current.owners).toBeUndefined();
    });
    expect(getMock).not.toHaveBeenCalled();
  });

  it('does not call API if no access token', async () => {
    mockUseSession.mockReturnValue({ data: {}, status: 'authenticated' });
    const { result } = renderHook(() => useFetchOwners(), {
      wrapper: createWrapper(),
    });
    await waitFor(() => {
      expect(result.current.owners).toBeUndefined();
    });
    expect(getMock).not.toHaveBeenCalled();
  });

  it('handles API error', async () => {
    getMock.mockRejectedValueOnce(new Error('API error'));
    const { result } = renderHook(() => useFetchOwners(), {
      wrapper: createWrapper(),
    });
    expect(result.current.owners).toBeUndefined();
  });

  it('shows loading state', async () => {
    let resolve: (v: { data: typeof owners }) => void;
    getMock.mockReturnValue(
      new Promise((r) => {
        resolve = r;
      }),
    );
    const { result } = renderHook(() => useFetchOwners(), {
      wrapper: createWrapper(),
    });
    expect(result.current.loading).toBe(true);
    resolve!({ data: owners });
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });
});
