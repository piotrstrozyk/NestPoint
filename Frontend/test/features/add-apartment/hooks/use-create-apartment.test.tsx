import { useCreateApartment } from '@/features/add-apartment/hooks/use-create-apartment';
import { ApartmentForm } from '@/features/add-apartment/schemas/add-apartment';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import axios from 'axios';
import { env } from 'next-runtime-env';
import { Mock, vi } from 'vitest';

vi.mock('axios');
vi.mock('next-runtime-env', () => ({ env: vi.fn() }));

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

describe('useCreateApartment', () => {
  const baseURL = 'http://api.test';
  const accessToken = 'test-token';
  const payload: ApartmentForm = {
    title: 'Test Apartment',
    description: 'A nice apartment for testing. Lorem ipsum dolor sit amet.',
    address: {
      street: 'Main St',
      apartmentNumber: '1',
      city: 'Testville',
      postalCode: '12345',
      country: 'Testland',
    },
    size: 50,
    rentalPrice: 1200,
    numberOfRooms: 2,
    numberOfBeds: 2,
    furnished: true,
    kitchen: 'PRIVATE',
    wifi: true,
    petsAllowed: false,
    parkingSpace: true,
    yardAccess: 'SHARED',
    poolAccess: 'NONE',
    disabilityFriendly: false,
    poolFee: 0,
    propertyType: 'APARTMENT',
    ownerId: 1,
  };
  const photos = [new File(['a'], 'a.jpg'), new File(['b'], 'b.jpg')];
  const response = { id: 1, status: 'ok' };
  let postMock: Mock;
  let apiClient: { post: Mock };

  beforeEach(() => {
    mockEnv.mockReturnValue(baseURL);
    postMock = vi.fn();
    apiClient = { post: postMock };
    mockAxios.create = vi.fn(() => apiClient) as unknown as typeof axios.create;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('creates apartment with photos', async () => {
    postMock.mockResolvedValueOnce({ data: response });
    const { result } = renderHook(() => useCreateApartment(), {
      wrapper: createWrapper(),
    });
    let data;
    await act(async () => {
      data = await result.current.mutateAsync({ accessToken, payload, photos });
    });
    expect(postMock).toHaveBeenCalledWith(
      '/apartments',
      expect.any(FormData),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: `Bearer ${accessToken}`,
        }),
      }),
    );
    expect(data).toEqual(response);
    expect(result.current.error).toBeNull();
    expect(result.current.isPending).toBeFalsy();
  });

  it('creates apartment without photos', async () => {
    postMock.mockResolvedValueOnce({ data: response });
    const { result } = renderHook(() => useCreateApartment(), {
      wrapper: createWrapper(),
    });
    let data;
    await act(async () => {
      data = await result.current.mutateAsync({ accessToken, payload });
    });
    expect(postMock).toHaveBeenCalledWith(
      '/apartments',
      expect.any(FormData),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: `Bearer ${accessToken}`,
        }),
      }),
    );
    expect(data).toEqual(response);
  });

  it('handles API error', async () => {
    postMock.mockRejectedValueOnce(new Error('API error'));
    const { result } = renderHook(() => useCreateApartment(), {
      wrapper: createWrapper(),
    });
    await act(async () => {
      await expect(
        result.current.mutateAsync({ accessToken, payload, photos }),
      ).rejects.toThrow('API error');
    });
    expect(
      result.current.error instanceof Error ||
        typeof result.current.error === 'object',
    ).toBeTruthy();
    if (result.current.error && result.current.error instanceof Error) {
      expect(result.current.error.message).toBe('API error');
    }
  });

  it('sets loading state', async () => {
    let resolve: (v: { data: typeof response }) => void;
    postMock.mockReturnValue(
      new Promise((r) => {
        resolve = r;
      }),
    );
    const { result } = renderHook(() => useCreateApartment(), {
      wrapper: createWrapper(),
    });
    act(() => {
      result.current.mutateAsync({ accessToken, payload, photos });
    });
    resolve!({ data: response });
    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
    });
  });
});
