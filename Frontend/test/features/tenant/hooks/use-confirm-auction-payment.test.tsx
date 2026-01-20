import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import type { AxiosInstance } from 'axios';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import { env } from 'next-runtime-env';
import { vi } from 'vitest';
import usePostConfirmAuctionPayment from '../../../../src/features/tenant/hooks/use-confirm-auction-payment';

vi.mock('next-auth/react');
vi.mock('axios');
vi.mock('next-runtime-env');

const mockedUseSession = vi.mocked(useSession);
const mockedAxiosCreate = vi.mocked(axios.create);
const mockedEnv = vi.mocked(env);

describe('usePostConfirmAuctionPayment', () => {
  const rentalId = 42;
  const payment = { cardNumber: '1234-5678-9012-3456' };
  const response = { success: true, transactionId: 'tx-1', message: 'ok' };

  const createWrapper = () => {
    const queryClient = new QueryClient();
    const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    Wrapper.displayName = 'QueryClientTestWrapper';
    return Wrapper;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockedEnv.mockReturnValue('http://api.test');
  });

  it('confirms auction payment successfully with auth', async () => {
    mockedUseSession.mockReturnValue({
      data: { accessToken: 'token' },
    } as ReturnType<typeof useSession>);
    const postMock = vi.fn().mockResolvedValue({ data: response });
    mockedAxiosCreate.mockReturnValue({
      post: postMock,
    } as unknown as AxiosInstance);

    const { result } = renderHook(() => usePostConfirmAuctionPayment(), {
      wrapper: createWrapper(),
    });
    let res;
    await act(async () => {
      res = await result.current.confirmAuctionPayment(rentalId, payment);
    });
    expect(res).toEqual(response);
    expect(postMock).toHaveBeenCalledWith(
      `/rentals/${rentalId}/confirm-auction-payment`,
      payment,
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer token' }),
      }),
    );
  });

  it('confirms auction payment successfully without auth', async () => {
    mockedUseSession.mockReturnValue({ data: null } as ReturnType<
      typeof useSession
    >);
    const postMock = vi.fn().mockResolvedValue({ data: response });
    mockedAxiosCreate.mockReturnValue({
      post: postMock,
    } as unknown as AxiosInstance);

    const { result } = renderHook(() => usePostConfirmAuctionPayment(), {
      wrapper: createWrapper(),
    });
    let res;
    await act(async () => {
      res = await result.current.confirmAuctionPayment(rentalId, payment);
    });
    expect(res).toEqual(response);
    expect(postMock).toHaveBeenCalledWith(
      `/rentals/${rentalId}/confirm-auction-payment`,
      payment,
      expect.objectContaining({
        headers: expect.not.objectContaining({
          Authorization: expect.any(String),
        }),
      }),
    );
  });

  it('returns error if API call fails', async () => {
    mockedUseSession.mockReturnValue({
      data: { accessToken: 'token' },
    } as ReturnType<typeof useSession>);
    const postMock = vi.fn().mockRejectedValue(new Error('API error'));
    mockedAxiosCreate.mockReturnValue({
      post: postMock,
    } as unknown as AxiosInstance);

    const { result } = renderHook(() => usePostConfirmAuctionPayment(), {
      wrapper: createWrapper(),
    });
    let error: unknown;
    await act(async () => {
      try {
        await result.current.confirmAuctionPayment(rentalId, payment);
      } catch (e) {
        error = e;
      }
    });
    expect(error).toBeInstanceOf(Error);
    expect(error && error instanceof Error ? error.message : undefined).toBe(
      'API error',
    );
  });
});
