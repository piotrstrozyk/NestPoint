import type { User } from '@/core/types/user';
import useFetchUsers from '@/features/apartment/hooks/use-fetch-users';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import { env } from 'next-runtime-env';
import { ReactNode } from 'react';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type Mock,
} from 'vitest';

vi.mock('axios');
vi.mock('next-auth/react');
vi.mock('next-runtime-env');

const mockedAxios = vi.mocked(axios);
const mockedUseSession = useSession as unknown as Mock;
const mockedEnv = env as unknown as Mock;

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  Wrapper.displayName = 'QueryClientTestWrapper';
  return Wrapper;
};

describe('useFetchUsers', () => {
  const mockApiClient = { get: vi.fn() };
  const mockUsers: User[] = [
    {
      id: 1,
      username: 'alice',
      password: 'pw',
      email: 'alice@example.com',
      firstName: 'Alice',
      lastName: 'Smith',
      phone: '123456789',
      roles: ['admin'],
      ownedApartments: [],
      rentals: [],
      ownedRentals: [],
      admin: true,
      owner: false,
      tenant: false,
    },
    {
      id: 2,
      username: 'bob',
      password: 'pw',
      email: 'bob@example.com',
      firstName: 'Bob',
      lastName: 'Brown',
      phone: '987654321',
      roles: ['user'],
      ownedApartments: [],
      rentals: [],
      ownedRentals: [],
      admin: false,
      owner: false,
      tenant: false,
    },
  ];
  const mockSession = {
    accessToken: 'token',
    user: { id: '1' },
    expires: '2099-12-31T23:59:59.999Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockedEnv.mockReturnValue('https://api.example.com');
    (mockedAxios.create as unknown as Mock).mockReturnValue(
      mockApiClient as { get: Mock },
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('returns users on success with token', async () => {
    mockedUseSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated',
      update: vi.fn(),
    });
    mockApiClient.get.mockResolvedValueOnce({ data: mockUsers });
    const { result } = renderHook(() => useFetchUsers(), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.users).toEqual(mockUsers);
    expect(result.current.error).toBeNull();
    expect(mockApiClient.get).toHaveBeenCalledWith('/admin/users', {
      headers: { Authorization: 'Bearer token' },
    });
  });

  it('returns users on success without token', async () => {
    mockedUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: vi.fn(),
    });
    mockApiClient.get.mockResolvedValueOnce({ data: mockUsers });
    const { result } = renderHook(() => useFetchUsers(), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.users).toEqual(mockUsers);
    expect(result.current.error).toBeNull();
    expect(mockApiClient.get).toHaveBeenCalledWith('/admin/users', {
      headers: undefined,
    });
  });

  it('handles API error', async () => {
    mockedUseSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated',
      update: vi.fn(),
    });
    const error = new Error('fail');
    mockApiClient.get.mockRejectedValueOnce(error);
    const { result } = renderHook(() => useFetchUsers(), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.users).toEqual([]);
    expect(result.current.error).toBe(error);
  });

  it('does not fetch while session is loading', async () => {
    mockedUseSession.mockReturnValue({
      data: null,
      status: 'loading',
      update: vi.fn(),
    });
    expect(mockApiClient.get).not.toHaveBeenCalled();
  });

  it('returns empty array if no data', async () => {
    mockedUseSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated',
      update: vi.fn(),
    });
    mockApiClient.get.mockResolvedValueOnce({ data: undefined });
    const { result } = renderHook(() => useFetchUsers(), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.users).toEqual([]);
  });
});
