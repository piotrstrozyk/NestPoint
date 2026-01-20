import useFetchUserId from '@/features/apartment-list/hooks/use-fetch-user-id';
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

describe('useFetchUserId', () => {
  const baseURL = 'http://api.test';
  const accessToken = 'test-token';
  const username = 'testuser';
  const session = { accessToken, user: { name: username } };
  const tenants = [
    {
      id: 1,
      username: 'testuser',
      email: '',
      firstName: '',
      lastName: '',
      phone: '',
      roles: [],
      ownedApartments: [],
      rentals: [],
    },
    {
      id: 2,
      username: 'other',
      email: '',
      firstName: '',
      lastName: '',
      phone: '',
      roles: [],
      ownedApartments: [],
      rentals: [],
    },
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

  it('fetches user id for authenticated user', async () => {
    getMock.mockResolvedValueOnce({ data: tenants });
    const { result } = renderHook(() => useFetchUserId(), {
      wrapper: createWrapper(),
    });
    await waitFor(() => {
      expect(result.current.userId).toBe(1);
    });
    expect(getMock).toHaveBeenCalledWith(
      '/tenants',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: `Bearer ${accessToken}`,
        }),
      }),
    );
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('returns null if user not found', async () => {
    getMock.mockResolvedValueOnce({ data: [{ ...tenants[1] }] });
    const { result } = renderHook(() => useFetchUserId(), {
      wrapper: createWrapper(),
    });
    await waitFor(() => {
      expect(result.current.userId).toBeNull();
    });
    expect(result.current.error).toBeNull();
  });

  it('returns null if unauthenticated', async () => {
    mockUseSession.mockReturnValue({ data: null, status: 'unauthenticated' });
    const { result } = renderHook(() => useFetchUserId(), {
      wrapper: createWrapper(),
    });
    await waitFor(() => {
      expect(result.current.userId).toBeNull();
    });
    expect(getMock).not.toHaveBeenCalled();
  });

  it('returns null if username is missing', async () => {
    mockUseSession.mockReturnValue({
      data: { accessToken },
      status: 'authenticated',
    });
    const { result } = renderHook(() => useFetchUserId(), {
      wrapper: createWrapper(),
    });
    await waitFor(() => {
      expect(result.current.userId).toBeNull();
    });
    expect(getMock).not.toHaveBeenCalled();
  });

  it('handles API error', async () => {
    getMock.mockRejectedValueOnce(new Error('API error'));
    const { result } = renderHook(() => useFetchUserId(), {
      wrapper: createWrapper(),
    });
    expect(result.current.userId).toBeNull();
  });

  it('shows loading state', async () => {
    let resolve: (v: { data: typeof tenants }) => void;
    getMock.mockReturnValue(
      new Promise((r) => {
        resolve = r;
      }),
    );
    const { result } = renderHook(() => useFetchUserId(), {
      wrapper: createWrapper(),
    });
    expect(result.current.loading).toBe(true);
    resolve!({ data: tenants });
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it('fetches tenants without token (public fetch)', async () => {
    // Simulate a session with a username but no accessToken
    mockUseSession.mockReturnValue({
      data: { user: { name: username } },
      status: 'authenticated',
    });
    getMock.mockResolvedValueOnce({ data: tenants });
    const { result } = renderHook(() => useFetchUserId(), {
      wrapper: createWrapper(),
    });
    await waitFor(() => {
      expect(result.current.userId).toBe(1);
    });
    expect(getMock).toHaveBeenCalledWith(
      '/tenants',
      expect.objectContaining({ headers: undefined }),
    );
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
  });
});
