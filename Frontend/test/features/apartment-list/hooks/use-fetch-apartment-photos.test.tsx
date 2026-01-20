import useFetchApartmentPhotos from '@/features/apartment-list/hooks/use-fetch-apartment-photos';
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

describe('useFetchApartmentPhotos', () => {
  const baseURL = 'http://api.test';
  const accessToken = 'test-token';
  const session = { accessToken };
  const apartmentId = 123;
  const photos = [
    { id: 1, url: 'url1' },
    { id: 2, url: 'url2' },
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

  it('fetches photos for authenticated user', async () => {
    getMock.mockResolvedValueOnce({ data: photos });
    const { result } = renderHook(() => useFetchApartmentPhotos(apartmentId), {
      wrapper: createWrapper(),
    });
    await waitFor(() => {
      expect(result.current.photos).not.toBeNull();
    });
    expect(getMock).toHaveBeenCalledWith(
      `/apartments/${apartmentId}/photos`,
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: `Bearer ${accessToken}`,
        }),
      }),
    );
    expect(result.current.photos).toEqual(['url1', 'url2']);
    expect(result.current.photoObjects).toEqual(photos);
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('fetches photos for unauthenticated user (no token)', async () => {
    mockUseSession.mockReturnValue({ data: null, status: 'unauthenticated' });
    getMock.mockResolvedValueOnce({ data: photos });
    const { result } = renderHook(() => useFetchApartmentPhotos(apartmentId), {
      wrapper: createWrapper(),
    });
    await waitFor(() => {
      expect(result.current.photos).not.toBeNull();
    });
    expect(getMock).toHaveBeenCalledWith(
      `/apartments/${apartmentId}/photos`,
      expect.objectContaining({ headers: undefined }),
    );
    expect(result.current.photos).toEqual(['url1', 'url2']);
    expect(result.current.photoObjects).toEqual(photos);
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('returns empty array if status is loading', async () => {
    mockUseSession.mockReturnValue({ data: session, status: 'loading' });
    getMock.mockResolvedValueOnce({ data: photos });
    expect(getMock).not.toHaveBeenCalled();
  });

  it('handles API error', async () => {
    getMock.mockRejectedValueOnce(new Error('API error'));
    const { result } = renderHook(() => useFetchApartmentPhotos(apartmentId), {
      wrapper: createWrapper(),
    });
    expect(result.current.photos).toBeNull();
    expect(result.current.photoObjects).toBeNull();
  });

  it('shows loading state', async () => {
    let resolve: (v: { data: typeof photos }) => void;
    getMock.mockReturnValue(
      new Promise((r) => {
        resolve = r;
      }),
    );
    const { result } = renderHook(() => useFetchApartmentPhotos(apartmentId), {
      wrapper: createWrapper(),
    });
    expect(result.current.loading).toBe(true);
    resolve!({ data: photos });
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it('returns null if apartmentId is falsy', async () => {
    const { result } = renderHook(() => useFetchApartmentPhotos(0), {
      wrapper: createWrapper(),
    });
    await waitFor(() => {
      expect(result.current.photos).toBeNull();
    });
    expect(getMock).not.toHaveBeenCalled();
  });
});
