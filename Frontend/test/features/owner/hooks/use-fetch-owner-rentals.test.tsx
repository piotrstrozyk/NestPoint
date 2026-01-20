import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { AxiosInstance } from 'axios';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import { env } from 'next-runtime-env';
import { vi } from 'vitest';
import useFetchOwnerRentals from '../../../../src/features/owner/hooks/use-fetch-owner-rentals';

vi.mock('next-auth/react');
vi.mock('axios');
vi.mock('next-runtime-env');

const mockedUseSession = vi.mocked(useSession);
const mockedAxiosCreate = vi.mocked(axios.create);
const mockedEnv = vi.mocked(env);

describe('useFetchOwnerRentals', () => {
  const userId = 42;
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
      status: 'COMPLETED',
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
    Wrapper.displayName = 'QueryClientProviderWrapper';
    return Wrapper;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockedEnv.mockReturnValue('http://api.test');
  });

  it('fetches owner rentals when authenticated', async () => {
    mockedUseSession.mockReturnValue({
      data: { accessToken: 'token' },
      status: 'authenticated',
    } as ReturnType<typeof useSession>);
    const getMock = vi.fn().mockResolvedValue({ data: rentals });
    mockedAxiosCreate.mockReturnValue({
      get: getMock,
    } as unknown as AxiosInstance);

    const { result } = renderHook(
      () => useFetchOwnerRentals(userId, 'COMPLETED'),
      { wrapper: createWrapper() },
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.rentals).toEqual(rentals);
    expect(result.current.error).toBeNull();
    expect(getMock).toHaveBeenCalledWith(
      `/rentals/my-rentals/owner/${userId}`,
      expect.objectContaining({ params: { status: 'completed' } }),
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

    const { result } = renderHook(
      () => useFetchOwnerRentals(userId, 'COMPLETED'),
      { wrapper: createWrapper() },
    );
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

    const { result } = renderHook(
      () => useFetchOwnerRentals(userId, 'COMPLETED'),
      { wrapper: createWrapper() },
    );
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(getMock).not.toHaveBeenCalled();
  });

  it('returns null if userId is falsy', async () => {
    mockedUseSession.mockReturnValue({
      data: { accessToken: 'token' },
      status: 'authenticated',
    } as ReturnType<typeof useSession>);
    const getMock = vi.fn();
    mockedAxiosCreate.mockReturnValue({
      get: getMock,
    } as unknown as AxiosInstance);

    const { result } = renderHook(() => useFetchOwnerRentals(0, 'COMPLETED'), {
      wrapper: createWrapper(),
    });
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(getMock).not.toHaveBeenCalled();
  });
});
