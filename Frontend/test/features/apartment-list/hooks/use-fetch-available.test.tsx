import useFetchAvailableApartments from '@/features/apartment-list/hooks/use-fetch-available';
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

describe('useFetchAvailableApartments', () => {
  const baseURL = 'http://api.test';
  const accessToken = 'test-token';
  const session = { accessToken };
  const apartments = [
    { id: 1, title: 'Apt 1' },
    { id: 2, title: 'Apt 2' },
  ];
  let getMock: Mock;
  let apiClient: { get: Mock };
  const startDate = '2025-07-01';
  const endDate = '2025-07-10';

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

  it('fetches available apartments for authenticated user', async () => {
    getMock.mockResolvedValueOnce({ data: apartments });
    const { result } = renderHook(() => useFetchAvailableApartments(startDate, endDate), {
      wrapper: createWrapper(),
    });
    await waitFor(() => {
      expect(result.current.apartments).not.toBeNull();
    });
    expect(getMock).toHaveBeenCalledWith(
      '/apartments/available/range',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: `Bearer ${accessToken}`,
        }),
        params: { startDate, endDate },
      }),
    );
    expect(result.current.apartments).toEqual(apartments);
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('fetches available apartments for unauthenticated user (no token)', async () => {
    mockUseSession.mockReturnValue({ data: null, status: 'unauthenticated' });
    getMock.mockResolvedValueOnce({ data: apartments });
    const { result } = renderHook(() => useFetchAvailableApartments(startDate, endDate), {
      wrapper: createWrapper(),
    });
    await waitFor(() => {
      expect(result.current.apartments).not.toBeNull();
    });
    expect(getMock).toHaveBeenCalledWith(
      '/apartments/available/range',
      expect.objectContaining({
        headers: undefined,
        params: { startDate, endDate },
      }),
    );
    expect(result.current.apartments).toEqual(apartments);
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('handles API error', async () => {
    getMock.mockRejectedValueOnce(new Error('API error'));
    const { result } = renderHook(() => useFetchAvailableApartments(startDate, endDate), {
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
    const { result } = renderHook(() => useFetchAvailableApartments(startDate, endDate), {
      wrapper: createWrapper(),
    });
    expect(result.current.loading).toBe(true);
    resolve!({ data: apartments });
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it('does not fetch if startDate or endDate is missing', async () => {
    const { result } = renderHook(() => useFetchAvailableApartments('', endDate), {
      wrapper: createWrapper(),
    });
    expect(result.current.apartments).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(getMock).not.toHaveBeenCalled();
  });
});
