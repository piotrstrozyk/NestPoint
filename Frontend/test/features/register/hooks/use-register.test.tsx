import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import type { AxiosInstance } from 'axios';
import axios from 'axios';
import type { SignInResponse } from 'next-auth/react';
import { signIn } from 'next-auth/react';
import { env } from 'next-runtime-env';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { vi } from 'vitest';
import { useRegister } from '../../../../src/features/register/hooks/use-register';

vi.mock('axios');
vi.mock('next-auth/react');
vi.mock('next-runtime-env');
vi.mock('next/navigation');
vi.mock('sonner');

const mockedAxiosCreate = vi.mocked(axios.create);
const mockedSignIn = vi.mocked(signIn);
const mockedEnv = vi.mocked(env);
const mockedUseRouter = vi.mocked(useRouter);

describe('useRegister', () => {
  const registrationData = {
    email: 'user@example.com',
    username: 'user',
    password: 'pass',
    firstName: 'Test',
    lastName: 'User',
    phone: '123456789',
    role: 'TENANT' as const,
  };
  const baseURL = 'http://api.test';
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
    mockedEnv.mockReturnValue(baseURL);
    vi.spyOn(toast, 'success').mockImplementation(() => 'toast-id');
    vi.spyOn(toast, 'error').mockImplementation(() => 'toast-id');
  });

  it('registers and logs in successfully', async () => {
    const postMock = vi.fn().mockResolvedValue({});
    mockedAxiosCreate.mockReturnValue({
      post: postMock,
    } as unknown as AxiosInstance);
    const signInResponse: SignInResponse = {
      error: null,
      status: 200,
      ok: true,
      url: '/',
    };
    mockedSignIn.mockResolvedValue(signInResponse);
    const pushMock = vi.fn();
    mockedUseRouter.mockReturnValue({
      push: pushMock,
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
      replace: vi.fn(),
      prefetch: vi.fn(),
    } as unknown as ReturnType<typeof useRouter>);

    const { result } = renderHook(() => useRegister(), {
      wrapper: createWrapper(),
    });
    await act(async () => {
      await result.current.register(registrationData);
    });
    expect(postMock).toHaveBeenCalledWith('/register', registrationData);
    expect(mockedSignIn).toHaveBeenCalledWith(
      'credentials',
      expect.objectContaining({
        username: 'user',
        password: 'pass',
        redirect: false,
      }),
    );
    expect(toast.success).toHaveBeenCalledWith(
      'Registration successful! Logging you in…',
    );
    expect(toast.success).toHaveBeenCalledWith('Logged in successfully!');
    expect(pushMock).toHaveBeenCalledWith('/');
    expect(result.current.error).toBeNull();
  });

  it('shows error toast if registration fails', async () => {
    const postMock = vi
      .fn()
      .mockRejectedValue({ response: { data: { message: 'Username taken' } } });
    mockedAxiosCreate.mockReturnValue({
      post: postMock,
    } as unknown as AxiosInstance);
    const signInResponse: SignInResponse = {
      error: null,
      status: 200,
      ok: true,
      url: '/',
    };
    mockedSignIn.mockResolvedValue(signInResponse);
    mockedUseRouter.mockReturnValue({
      push: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
      replace: vi.fn(),
      prefetch: vi.fn(),
    } as unknown as ReturnType<typeof useRouter>);

    const { result } = renderHook(() => useRegister(), {
      wrapper: createWrapper(),
    });
    await act(async () => {
      await expect(
        result.current.register(registrationData),
      ).rejects.toBeDefined();
    });
    expect(toast.error).toHaveBeenCalled();
  });

  it('shows error toast if registration fails with backend message', async () => {
    const errorObj = {
      response: { data: { message: 'Custom backend error' } },
    };
    const postMock = vi.fn().mockRejectedValue(errorObj);
    mockedAxiosCreate.mockReturnValue({
      post: postMock,
    } as unknown as AxiosInstance);
    const signInResponse: SignInResponse = {
      error: null,
      status: 200,
      ok: true,
      url: '/',
    };
    mockedSignIn.mockResolvedValue(signInResponse);
    mockedUseRouter.mockReturnValue({
      push: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
      replace: vi.fn(),
      prefetch: vi.fn(),
    } as unknown as ReturnType<typeof useRouter>);
    const isAxiosErrorSpy = vi
      .spyOn(axios, 'isAxiosError')
      .mockReturnValue(true);

    const { result } = renderHook(() => useRegister(), {
      wrapper: createWrapper(),
    });
    await act(async () => {
      await expect(
        result.current.register(registrationData),
      ).rejects.toBeDefined();
    });
    expect(toast.error).toHaveBeenCalledWith('Custom backend error');
    isAxiosErrorSpy.mockRestore();
  });

  it('shows error toast if auto-login fails', async () => {
    const postMock = vi.fn().mockResolvedValue({});
    mockedAxiosCreate.mockReturnValue({
      post: postMock,
    } as unknown as AxiosInstance);
    const signInResponse: SignInResponse = {
      error: 'Invalid credentials',
      status: 401,
      ok: false,
      url: null,
    };
    mockedSignIn.mockResolvedValue(signInResponse);
    mockedUseRouter.mockReturnValue({
      push: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
      replace: vi.fn(),
      prefetch: vi.fn(),
    } as unknown as ReturnType<typeof useRouter>);

    const { result } = renderHook(() => useRegister(), {
      wrapper: createWrapper(),
    });
    await act(async () => {
      await expect(result.current.register(registrationData)).rejects.toThrow(
        'Auto-login failed',
      );
    });
    expect(toast.error).toHaveBeenCalledWith('Auto-login failed');
  });
});
