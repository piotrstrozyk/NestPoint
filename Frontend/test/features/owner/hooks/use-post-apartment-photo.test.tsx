import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import type { AxiosInstance } from 'axios';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import { env } from 'next-runtime-env';
import { vi } from 'vitest';
import usePostApartmentPhoto from '../../../../src/features/owner/hooks/use-post-apartment-photo';

vi.mock('next-auth/react');
vi.mock('axios');
vi.mock('next-runtime-env');

const mockedUseSession = vi.mocked(useSession);
const mockedAxiosCreate = vi.mocked(axios.create);
const mockedEnv = vi.mocked(env);

describe('usePostApartmentPhoto', () => {
  const apartmentId = 1;
  const file = new File(['dummy'], 'photo.jpg', { type: 'image/jpeg' });
  const response = { id: 1, url: 'http://test/photo.jpg' };
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

  it('uploads photo successfully with auth', async () => {
    mockedUseSession.mockReturnValue({
      data: { accessToken: 'token' },
    } as ReturnType<typeof useSession>);
    const postMock = vi.fn().mockResolvedValue({ data: response });
    mockedAxiosCreate.mockReturnValue({
      post: postMock,
    } as unknown as AxiosInstance);

    const { result } = renderHook(() => usePostApartmentPhoto(), {
      wrapper: createWrapper(),
    });
    let res;
    await act(async () => {
      res = await result.current.postPhoto(apartmentId, file);
    });
    expect(res).toEqual(response);
    expect(postMock).toHaveBeenCalledWith(
      `/apartments/${apartmentId}/photos`,
      expect.any(FormData),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer token' }),
      }),
    );
  });

  it('uploads photo successfully without auth', async () => {
    mockedUseSession.mockReturnValue({ data: null } as ReturnType<
      typeof useSession
    >);
    const postMock = vi.fn().mockResolvedValue({ data: response });
    mockedAxiosCreate.mockReturnValue({
      post: postMock,
    } as unknown as AxiosInstance);

    const { result } = renderHook(() => usePostApartmentPhoto(), {
      wrapper: createWrapper(),
    });
    let res;
    await act(async () => {
      res = await result.current.postPhoto(apartmentId, file);
    });
    expect(res).toEqual(response);
    expect(postMock).toHaveBeenCalledWith(
      `/apartments/${apartmentId}/photos`,
      expect.any(FormData),
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

    const { result } = renderHook(() => usePostApartmentPhoto(), {
      wrapper: createWrapper(),
    });
    let error: unknown;
    await act(async () => {
      try {
        await result.current.postPhoto(apartmentId, file);
      } catch (e) {
        error = e;
      }
    });
    expect(error).toBeDefined();
    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toBe('API error');
  });
});
