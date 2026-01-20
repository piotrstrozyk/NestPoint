import useReverseGeocode, {
  ReverseGeocodeResult,
} from '@/features/add-apartment/hooks/use-reverse-geocode';
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

describe('useReverseGeocode', () => {
  const baseURL = 'http://api.test';
  const accessToken = 'test-token';
  const session = { accessToken };
  const lat = 50.1;
  const lon = 19.9;
  const result: ReverseGeocodeResult = {
    address: {
      street: 'Main',
      apartmentNumber: '1',
      city: 'City',
      postalCode: '00-000',
      country: 'PL',
      fullAddress: 'Main 1, City',
      latitude: lat,
      longitude: lon,
    },
    geojson: {
      type: 'Polygon',
      coordinates: [
        [
          [19.9, 50.1],
          [19.91, 50.11],
          [19.9, 50.1],
        ],
      ],
    },
  };
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

  it('fetches reverse geocode data for authenticated user', async () => {
    getMock.mockResolvedValueOnce({ data: result });
    const { result: hook } = renderHook(() => useReverseGeocode(lat, lon), {
      wrapper: createWrapper(),
    });
    await waitFor(() => {
      expect(hook.current.data).not.toBeNull();
    });
    expect(getMock).toHaveBeenCalledWith(
      '/apartments/reverse-geocode',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: `Bearer ${accessToken}`,
        }),
        params: { lat, lon },
      }),
    );
    expect(hook.current.data).toEqual(result);
    expect(hook.current.error).toBeNull();
    expect(hook.current.loading).toBe(false);
  });

  it('returns error if unauthenticated', async () => {
    mockUseSession.mockReturnValue({ data: null, status: 'unauthenticated' });
    const { result: hook } = renderHook(() => useReverseGeocode(lat, lon), {
      wrapper: createWrapper(),
    });
    expect(hook.current.data).toBeNull();
    expect(getMock).not.toHaveBeenCalled();
  });

  it('returns error if no access token', async () => {
    mockUseSession.mockReturnValue({ data: {}, status: 'authenticated' });
    const { result: hook } = renderHook(() => useReverseGeocode(lat, lon), {
      wrapper: createWrapper(),
    });
    expect(hook.current.data).toBeNull();
    expect(getMock).not.toHaveBeenCalled();
  });

  it('returns error if lat or lon is null', async () => {
    const { result: hook } = renderHook(() => useReverseGeocode(null, lon), {
      wrapper: createWrapper(),
    });
    expect(hook.current.data).toBeNull();
    expect(getMock).not.toHaveBeenCalled();

    const { result: hook2 } = renderHook(() => useReverseGeocode(lat, null), {
      wrapper: createWrapper(),
    });
    expect(hook2.current.data).toBeNull();
    expect(getMock).not.toHaveBeenCalled();
  });

  it('handles API error', async () => {
    getMock.mockRejectedValueOnce(new Error('API error'));
    const { result: hook } = renderHook(() => useReverseGeocode(lat, lon), {
      wrapper: createWrapper(),
    });
    await waitFor(() => {
      expect(hook.current.error).not.toBeNull();
    });
    expect(hook.current.data).toBeNull();
    expect(hook.current.error).toBeInstanceOf(Error);
    expect(hook.current.error?.message).toBe('API error');
    expect(hook.current.loading).toBe(false);
  });

  it('shows loading state', async () => {
    let resolve: (v: { data: ReverseGeocodeResult }) => void;
    getMock.mockReturnValue(
      new Promise((r) => {
        resolve = r;
      }),
    );
    const { result: hook } = renderHook(() => useReverseGeocode(lat, lon), {
      wrapper: createWrapper(),
    });
    expect(hook.current.loading).toBe(true);
    resolve!({ data: result });
    await waitFor(() => {
      expect(hook.current.loading).toBe(false);
    });
  });
});
