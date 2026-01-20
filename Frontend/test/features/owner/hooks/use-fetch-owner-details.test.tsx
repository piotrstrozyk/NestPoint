import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { AxiosInstance } from 'axios';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import { env } from 'next-runtime-env';
import { vi } from 'vitest';
import useFetchOwner from '../../../../src/features/owner/hooks/use-fetch-owner-details';

vi.mock('next-auth/react');
vi.mock('axios');
vi.mock('next-runtime-env');

const mockedUseSession = vi.mocked(useSession);
const mockedAxiosCreate = vi.mocked(axios.create);
const mockedEnv = vi.mocked(env);

describe('useFetchOwner', () => {
  const ownerId = 42;
  const owner = {
    id: ownerId,
    username: 'owner',
    email: 'owner@example.com',
    firstName: 'Test',
    lastName: 'Owner',
    phone: '123456789',
    roles: ['OWNER'],
    ownedApartments: [],
    rentals: [],
  };
  const createWrapper = () => {
    const queryClient = new QueryClient();
    const Wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    Wrapper.displayName = 'QueryClientTestWrapper';
    return Wrapper;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockedEnv.mockReturnValue('http://api.test');
  });

  it('fetches owner details when authenticated', async () => {
    mockedUseSession.mockReturnValue({
      data: { accessToken: 'token' },
      status: 'authenticated',
    } as ReturnType<typeof useSession>);
    const getMock = vi.fn().mockResolvedValue({ data: owner });
    mockedAxiosCreate.mockReturnValue({
      get: getMock,
    } as unknown as AxiosInstance);

    const { result } = renderHook(() => useFetchOwner(ownerId), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.owner).toEqual(owner);
    expect(result.current.error).toBeNull();
    expect(getMock).toHaveBeenCalledWith(
      `/owners/${ownerId}`,
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer token' }),
      }),
    );
  });

  it('fetches owner details without Authorization header if no accessToken', async () => {
    mockedUseSession.mockReturnValue({
      data: {},
      status: 'authenticated',
    } as ReturnType<typeof useSession>);
    const getMock = vi.fn().mockResolvedValue({ data: owner });
    mockedAxiosCreate.mockReturnValue({
      get: getMock,
    } as unknown as AxiosInstance);

    const { result } = renderHook(() => useFetchOwner(ownerId), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.owner).toEqual(owner);
    expect(result.current.error).toBeNull();
    expect(getMock).toHaveBeenCalledWith(
      `/owners/${ownerId}`,
      expect.objectContaining({ headers: undefined }),
    );
  });

  it('returns null if unauthenticated', async () => {
    mockedUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
    } as ReturnType<typeof useSession>);
    const getMock = vi.fn();
    mockedAxiosCreate.mockReturnValue({
      get: getMock,
    } as unknown as AxiosInstance);

    const { result } = renderHook(() => useFetchOwner(ownerId), {
      wrapper: createWrapper(),
    });
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

    const { result } = renderHook(() => useFetchOwner(ownerId), {
      wrapper: createWrapper(),
    });
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(getMock).not.toHaveBeenCalled();
  });

  it('returns null if ownerId is falsy', async () => {
    mockedUseSession.mockReturnValue({
      data: { accessToken: 'token' },
      status: 'authenticated',
    } as ReturnType<typeof useSession>);
    const getMock = vi.fn();
    mockedAxiosCreate.mockReturnValue({
      get: getMock,
    } as unknown as AxiosInstance);

    const { result } = renderHook(() => useFetchOwner(0), {
      wrapper: createWrapper(),
    });
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(getMock).not.toHaveBeenCalled();
  });
});
