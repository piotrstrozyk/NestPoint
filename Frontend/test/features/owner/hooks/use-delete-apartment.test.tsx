import useDeleteApartment from '@/features/owner/hooks/use-delete-apartment';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';
import axios, { AxiosInstance } from 'axios';
import { useSession } from 'next-auth/react';
import { env } from 'next-runtime-env';
import { ReactNode } from 'react';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

// Mock dependencies
vi.mock('next-auth/react');
vi.mock('next-runtime-env');
vi.mock('axios');

const mockedUseSession = useSession as Mock;
const mockedEnv = env as Mock;
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Test wrapper component
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  Wrapper.displayName = 'QueryClientTestWrapper';
  return Wrapper;
};

describe('useDeleteApartment', () => {
  const mockAxiosInstance = {
    delete: vi.fn(),
  } as unknown as AxiosInstance & { delete: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mocks
    mockedEnv.mockReturnValue('https://api.example.com');
    mockedAxios.create.mockReturnValue(mockAxiosInstance);
  });

  it('should delete apartment successfully when user is authenticated', async () => {
    // Arrange
    const mockSession = {
      accessToken: 'mock-access-token',
    };
    mockedUseSession.mockReturnValue({ data: mockSession });
    mockAxiosInstance.delete.mockResolvedValue({ status: 204 });

    // Act
    const { result } = renderHook(() => useDeleteApartment(), {
      wrapper: createWrapper(),
    });

    await result.current.deleteApartment(123);

    // Assert
    expect(mockedAxios.create).toHaveBeenCalledWith({
      baseURL: 'https://api.example.com',
    });

    expect(mockAxiosInstance.delete).toHaveBeenCalledWith('/apartments/123', {
      headers: {
        Authorization: 'Bearer mock-access-token',
      },
    });
  });

  it('should delete apartment without authorization header when user is not authenticated', async () => {
    // Arrange
    mockedUseSession.mockReturnValue({ data: null });
    mockAxiosInstance.delete.mockResolvedValue({ status: 204 });

    // Act
    const { result } = renderHook(() => useDeleteApartment(), {
      wrapper: createWrapper(),
    });

    await result.current.deleteApartment(456);

    // Assert
    expect(mockAxiosInstance.delete).toHaveBeenCalledWith('/apartments/456', {
      headers: {},
    });
  });

  it('should delete apartment without authorization header when session has no access token', async () => {
    // Arrange
    const mockSession = {
      accessToken: null,
    };
    mockedUseSession.mockReturnValue({ data: mockSession });
    mockAxiosInstance.delete.mockResolvedValue({ status: 204 });

    // Act
    const { result } = renderHook(() => useDeleteApartment(), {
      wrapper: createWrapper(),
    });

    await result.current.deleteApartment(789);

    // Assert
    expect(mockAxiosInstance.delete).toHaveBeenCalledWith('/apartments/789', {
      headers: {},
    });
  });

  it('should handle deletion errors properly', async () => {
    // Arrange
    const mockSession = {
      accessToken: 'mock-access-token',
    };
    mockedUseSession.mockReturnValue({ data: mockSession });
    const mockError = new Error(
      'Forbidden: You can only delete your own apartment',
    );
    mockAxiosInstance.delete.mockRejectedValue(mockError);

    // Act
    const { result } = renderHook(() => useDeleteApartment(), {
      wrapper: createWrapper(),
    });

    // Assert
    await expect(result.current.deleteApartment(123)).rejects.toThrow(
      'Forbidden: You can only delete your own apartment',
    );
  });

  it('should return mutation object with correct properties', () => {
    // Arrange
    mockedUseSession.mockReturnValue({ data: null });

    // Act
    const { result } = renderHook(() => useDeleteApartment(), {
      wrapper: createWrapper(),
    });

    // Assert
    expect(result.current).toHaveProperty('deleteApartment');
    expect(result.current).toHaveProperty('mutate');
    expect(result.current).toHaveProperty('mutateAsync');
    expect(result.current).toHaveProperty('isError');
    expect(result.current).toHaveProperty('isSuccess');
    expect(result.current).toHaveProperty('error');
    expect(typeof result.current.deleteApartment).toBe('function');
  });

  it('should use correct API base URL from environment', async () => {
    // Arrange
    const customBaseURL = 'https://custom-api.example.com';
    mockedEnv.mockReturnValue(customBaseURL);
    mockedUseSession.mockReturnValue({ data: null });
    mockAxiosInstance.delete.mockResolvedValue({ status: 204 });

    // Act
    const { result } = renderHook(() => useDeleteApartment(), {
      wrapper: createWrapper(),
    });

    await result.current.deleteApartment(123);

    // Assert
    expect(mockedAxios.create).toHaveBeenCalledWith({
      baseURL: customBaseURL,
    });
  });
});
