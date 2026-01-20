import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import type { AxiosInstance } from 'axios';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import { env } from 'next-runtime-env';
import { vi } from 'vitest';
import { useUpdateApartment } from '../../../../src/features/owner/hooks/use-update-apartment';

vi.mock('next-auth/react');
vi.mock('axios');
vi.mock('next-runtime-env');

const mockedUseSession = vi.mocked(useSession);
const mockedAxiosCreate = vi.mocked(axios.create);
const mockedEnv = vi.mocked(env);

describe('useUpdateApartment', () => {
  const apartmentId = 1;
  const payload = { title: 'Updated Apartment' };
  const response = { id: apartmentId, ...payload };
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

  it('updates apartment successfully', async () => {
    mockedUseSession.mockReturnValue({
      data: { accessToken: 'token' },
    } as ReturnType<typeof useSession>);
    const putMock = vi.fn().mockResolvedValue({ data: response });
    mockedAxiosCreate.mockReturnValue({
      put: putMock,
    } as unknown as AxiosInstance);

    const { result } = renderHook(() => useUpdateApartment(), {
      wrapper: createWrapper(),
    });
    let res;
    await act(async () => {
      res = await result.current.updateApartment(apartmentId, payload);
    });
    expect(res).toEqual(response);
    expect(putMock).toHaveBeenCalledWith(
      `/apartments/${encodeURIComponent(apartmentId)}`,
      { id: apartmentId, ...payload },
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer token' }),
      }),
    );
  });

  it('throws error if no access token', async () => {
    mockedUseSession.mockReturnValue({ data: null } as ReturnType<
      typeof useSession
    >);
    const putMock = vi.fn();
    mockedAxiosCreate.mockReturnValue({
      put: putMock,
    } as unknown as AxiosInstance);

    const { result } = renderHook(() => useUpdateApartment(), {
      wrapper: createWrapper(),
    });
    let error: unknown;
    await act(async () => {
      try {
        await result.current.updateApartment(apartmentId, payload);
      } catch (e) {
        error = e;
      }
    });
    expect(error).toBeDefined();
    expect(error).toBeInstanceOf(Error);
    expect(error && (error as Error).message).toBe('No access token');
    expect(putMock).not.toHaveBeenCalled();
  });

  it('returns error if API call fails', async () => {
    mockedUseSession.mockReturnValue({
      data: { accessToken: 'token' },
    } as ReturnType<typeof useSession>);
    const putMock = vi.fn().mockRejectedValue(new Error('API error'));
    mockedAxiosCreate.mockReturnValue({
      put: putMock,
    } as unknown as AxiosInstance);

    const { result } = renderHook(() => useUpdateApartment(), {
      wrapper: createWrapper(),
    });
    let error: unknown;
    await act(async () => {
      try {
        await result.current.updateApartment(apartmentId, payload);
      } catch (e) {
        error = e;
      }
    });
    expect(error).toBeDefined();
    expect(error).toBeInstanceOf(Error);
    expect(error && (error as Error).message).toBe('API error');
  });
});
