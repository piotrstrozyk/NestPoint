import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { AxiosInstance } from 'axios';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import { env } from 'next-runtime-env';
import { vi } from 'vitest';
import useFetchRentals from '../../../../src/features/owner/hooks/use-fetch-rentals';

vi.mock('next-auth/react');
vi.mock('axios');
vi.mock('next-runtime-env');

const mockedUseSession = vi.mocked(useSession);
const mockedAxiosCreate = vi.mocked(axios.create);
const mockedEnv = vi.mocked(env);

describe('useFetchRentals', () => {
  const rentals = [
    {
      id: 1,
      apartmentId: 2,
      tenantId: 3,
      ownerId: 4,
      startDate: new Date(),
      endDate: new Date(),
      nights: 2,
      pricePerNight: 100,
      totalCost: 200,
      status: 'ACTIVE',
      address: {
        street: 'Main',
        apartmentNumber: '1',
        city: 'City',
        postalCode: '12345',
        country: 'Country',
        fullAddress: 'Main 1, City',
        latitude: 0,
        longitude: 0,
      },
      apartmentOccupied: true,
      rentalFees: 10,
    },
  ];
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

  it('fetches rentals when authenticated', async () => {
    mockedUseSession.mockReturnValue({
      data: { accessToken: 'token' },
      status: 'authenticated',
    } as ReturnType<typeof useSession>);
    const getMock = vi.fn().mockResolvedValue({ data: rentals });
    mockedAxiosCreate.mockReturnValue({
      get: getMock,
    } as unknown as AxiosInstance);

    const { result } = renderHook(() => useFetchRentals(), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.rentals).toEqual(rentals);
    expect(result.current.error).toBeNull();
  });

  it('returns empty array if unauthenticated', async () => {
    mockedUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
    } as ReturnType<typeof useSession>);
    const getMock = vi.fn();
    mockedAxiosCreate.mockReturnValue({
      get: getMock,
    } as unknown as AxiosInstance);

    const { result } = renderHook(() => useFetchRentals(), {
      wrapper: createWrapper(),
    });
    expect(result.current.rentals).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(getMock).not.toHaveBeenCalled();
  });

  it('returns empty array if session is loading', async () => {
    mockedUseSession.mockReturnValue({
      data: null,
      status: 'loading',
    } as ReturnType<typeof useSession>);
    const getMock = vi.fn();
    mockedAxiosCreate.mockReturnValue({
      get: getMock,
    } as unknown as AxiosInstance);

    const { result } = renderHook(() => useFetchRentals(), {
      wrapper: createWrapper(),
    });
    expect(result.current.rentals).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(getMock).not.toHaveBeenCalled();
  });

  it('returns error if API call fails', async () => {
    mockedUseSession.mockReturnValue({
      data: { accessToken: 'token' },
      status: 'authenticated',
    } as ReturnType<typeof useSession>);
    const getMock = vi.fn().mockRejectedValue(new Error('API error'));
    mockedAxiosCreate.mockReturnValue({
      get: getMock,
    } as unknown as AxiosInstance);

    const { result } = renderHook(() => useFetchRentals(), {
      wrapper: createWrapper(),
    });
    expect(result.current.rentals).toEqual([]);
  });

  it('fetches rentals without Authorization header if no accessToken', async () => {
    mockedUseSession.mockReturnValue({
      data: {},
      status: 'authenticated',
    } as ReturnType<typeof useSession>);
    const getMock = vi.fn().mockResolvedValue({ data: [] });
    mockedAxiosCreate.mockReturnValue({
      get: getMock,
    } as unknown as AxiosInstance);

    const { result } = renderHook(() => useFetchRentals(), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.rentals).toEqual([]);
    expect(result.current.error).toBeNull();
    expect(getMock).toHaveBeenCalledWith(
      '/rentals',
      expect.objectContaining({ headers: undefined }),
    );
  });
});
