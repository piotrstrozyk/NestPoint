import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import { env } from 'next-runtime-env';
import { Mock, vi } from 'vitest';
import {
  CreateRentalWithPaymentPayload,
  useCreateRentalWithPayment,
} from '../../../../src/features/booking/hooks/use-create-rental-with-payment';

vi.mock('axios');
vi.mock('next-auth/react', () => ({ useSession: vi.fn() }));
vi.mock('next-runtime-env', () => ({ env: vi.fn() }));

const mockUseSession = useSession as unknown as Mock;
const mockEnv = env as unknown as Mock;
const mockAxios = axios as unknown as { create: typeof axios.create };

const createWrapper = () => {
  const queryClient = new QueryClient();
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  Wrapper.displayName = 'QueryClientTestWrapper';
  return Wrapper;
};

describe('useCreateRentalWithPayment', () => {
  const baseURL = 'http://api.test';
  const accessToken = 'test-token';
  const session = { accessToken };
  const payload: CreateRentalWithPaymentPayload = {
    rental: {
      apartmentId: 1,
      tenantId: 2,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-10'),
    },
    payment: { cardNumber: '1234' },
  };
  let postMock: Mock;
  let apiClient: { post: Mock };

  beforeEach(() => {
    mockEnv.mockReturnValue(baseURL);
    postMock = vi.fn();
    apiClient = { post: postMock };
    mockAxios.create = vi.fn(() => apiClient) as unknown as typeof axios.create;
    mockUseSession.mockReturnValue({ data: session });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('successfully creates rental with payment', async () => {
    const response = { id: 123, status: 'ok' };
    postMock.mockResolvedValueOnce({ data: response });
    const { result } = renderHook(() => useCreateRentalWithPayment(), {
      wrapper: createWrapper(),
    });
    let data;
    await act(async () => {
      data = await result.current.createRentalWithPayment(payload);
    });
    expect(postMock).toHaveBeenCalledWith(
      '/rentals/create-with-payment',
      payload,
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        }),
      }),
    );
    expect(data).toEqual(response);
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('throws error if no access token', async () => {
    mockUseSession.mockReturnValue({ data: {} });
    const { result } = renderHook(() => useCreateRentalWithPayment(), {
      wrapper: createWrapper(),
    });
    await expect(
      result.current.createRentalWithPayment(payload),
    ).rejects.toThrow('No access token');
    expect(postMock).not.toHaveBeenCalled();
  });

  it('handles API error', async () => {
    mockUseSession.mockReturnValue({ data: session });
    postMock.mockRejectedValueOnce(new Error('API error'));
    const { result } = renderHook(() => useCreateRentalWithPayment(), {
      wrapper: createWrapper(),
    });
    await act(async () => {
      await expect(
        result.current.createRentalWithPayment(payload),
      ).rejects.toThrow('API error');
    });
    expect(result.current.loading).toBe(false);
  });

  it('sets loading state', async () => {
    let resolve: (v: unknown) => void;
    postMock.mockReturnValue(
      new Promise((r) => {
        resolve = r;
      }),
    );
    const { result } = renderHook(() => useCreateRentalWithPayment(), {
      wrapper: createWrapper(),
    });
    act(() => {
      result.current.createRentalWithPayment(payload);
    });
    resolve!({ data: { id: 1 } });
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });
});
