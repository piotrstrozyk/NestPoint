import useDeleteApartmentPhoto from '@/features/owner/hooks/use-delete-apartment-photo';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
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

describe('useDeleteApartmentPhoto', () => {
  const mockAxiosInstance = {
    delete: vi.fn(),
  } as unknown as AxiosInstance & { delete: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mocks
    mockedEnv.mockReturnValue('https://api.example.com');
    mockedAxios.create.mockReturnValue(mockAxiosInstance);
  });

  it('should delete apartment photo successfully when user is authenticated', async () => {
    // Arrange
    const mockSession = {
      accessToken: 'mock-access-token',
    };
    mockedUseSession.mockReturnValue({ data: mockSession });
    mockAxiosInstance.delete.mockResolvedValue({ status: 204 });

    // Act
    const { result } = renderHook(() => useDeleteApartmentPhoto(), {
      wrapper: createWrapper(),
    });

    await result.current.deletePhoto(123, 456);

    // Assert
    expect(mockedAxios.create).toHaveBeenCalledWith({
      baseURL: 'https://api.example.com',
    });

    expect(mockAxiosInstance.delete).toHaveBeenCalledWith(
      '/apartments/123/photos/456',
      {
        headers: {
          Authorization: 'Bearer mock-access-token',
        },
      },
    );
  });

  it('should delete apartment photo without authorization header when user is not authenticated', async () => {
    // Arrange
    mockedUseSession.mockReturnValue({ data: null });
    mockAxiosInstance.delete.mockResolvedValue({ status: 204 });

    // Act
    const { result } = renderHook(() => useDeleteApartmentPhoto(), {
      wrapper: createWrapper(),
    });

    await result.current.deletePhoto(789, 101);

    // Assert
    expect(mockAxiosInstance.delete).toHaveBeenCalledWith(
      '/apartments/789/photos/101',
      {
        headers: {},
      },
    );
  });

  it('should delete apartment photo without authorization header when session has no access token', async () => {
    // Arrange
    const mockSession = {
      accessToken: null,
    };
    mockedUseSession.mockReturnValue({ data: mockSession });
    mockAxiosInstance.delete.mockResolvedValue({ status: 204 });

    // Act
    const { result } = renderHook(() => useDeleteApartmentPhoto(), {
      wrapper: createWrapper(),
    });

    await result.current.deletePhoto(111, 222);

    // Assert
    expect(mockAxiosInstance.delete).toHaveBeenCalledWith(
      '/apartments/111/photos/222',
      {
        headers: {},
      },
    );
  });

  it('should handle deletion errors properly', async () => {
    // Arrange
    const mockSession = {
      accessToken: 'mock-access-token',
    };
    mockedUseSession.mockReturnValue({ data: mockSession });
    const mockError = new Error(
      'Forbidden: You can only delete photos from your own apartment',
    );
    mockAxiosInstance.delete.mockRejectedValue(mockError);

    // Act
    const { result } = renderHook(() => useDeleteApartmentPhoto(), {
      wrapper: createWrapper(),
    });

    // Assert
    await expect(result.current.deletePhoto(123, 456)).rejects.toThrow(
      'Forbidden: You can only delete photos from your own apartment',
    );
  });

  it('should return correct properties and types', () => {
    // Arrange
    mockedUseSession.mockReturnValue({ data: null });

    // Act
    const { result } = renderHook(() => useDeleteApartmentPhoto(), {
      wrapper: createWrapper(),
    });

    // Assert
    expect(result.current).toHaveProperty('deletePhoto');
    expect(result.current).toHaveProperty('loading');
    expect(result.current).toHaveProperty('error');
    expect(typeof result.current.deletePhoto).toBe('function');
    expect(typeof result.current.loading).toBe('boolean');
    expect(result.current.error).toBeNull();
  });

  it('should track loading state correctly during deletion', async () => {
    // Arrange
    const mockSession = {
      accessToken: 'mock-access-token',
    };
    mockedUseSession.mockReturnValue({ data: mockSession });

    // Create a promise we can control
    let resolveDelete: () => void;
    const deletePromise = new Promise<void>((resolve) => {
      resolveDelete = resolve;
    });
    mockAxiosInstance.delete.mockReturnValue(deletePromise);

    // Act
    const { result } = renderHook(() => useDeleteApartmentPhoto(), {
      wrapper: createWrapper(),
    });

    // Start the mutation
    const mutationPromise = result.current.deletePhoto(123, 456);

    // Assert loading state
    await waitFor(() => {
      expect(result.current.loading).toBe(true);
    });

    // Resolve the deletion
    resolveDelete!();
    await mutationPromise;

    // Assert loading state is false after completion
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it('should track error state correctly when deletion fails', async () => {
    // Arrange
    const mockSession = {
      accessToken: 'mock-access-token',
    };
    mockedUseSession.mockReturnValue({ data: mockSession });
    const mockError = new Error('Photo not found');
    mockAxiosInstance.delete.mockRejectedValue(mockError);

    // Act
    const { result } = renderHook(() => useDeleteApartmentPhoto(), {
      wrapper: createWrapper(),
    });

    try {
      await result.current.deletePhoto(123, 999);
    } catch {
      // Expected to throw
    }

    // Assert error state
    await waitFor(() => {
      expect(result.current.error).toEqual(mockError);
      expect(result.current.loading).toBe(false);
    });
  });

  it('should use correct API base URL from environment', async () => {
    // Arrange
    const customBaseURL = 'https://custom-api.example.com';
    mockedEnv.mockReturnValue(customBaseURL);
    mockedUseSession.mockReturnValue({ data: null });
    mockAxiosInstance.delete.mockResolvedValue({ status: 204 });

    // Act
    const { result } = renderHook(() => useDeleteApartmentPhoto(), {
      wrapper: createWrapper(),
    });

    await result.current.deletePhoto(123, 456);

    // Assert
    expect(mockedAxios.create).toHaveBeenCalledWith({
      baseURL: customBaseURL,
    });
  });

  it('should handle multiple photo deletions with different IDs', async () => {
    // Arrange
    const mockSession = {
      accessToken: 'mock-access-token',
    };
    mockedUseSession.mockReturnValue({ data: mockSession });
    mockAxiosInstance.delete.mockResolvedValue({ status: 204 });

    // Act
    const { result } = renderHook(() => useDeleteApartmentPhoto(), {
      wrapper: createWrapper(),
    });

    await result.current.deletePhoto(100, 1);
    await result.current.deletePhoto(200, 2);
    await result.current.deletePhoto(300, 3);

    // Assert
    expect(mockAxiosInstance.delete).toHaveBeenCalledTimes(3);
    expect(mockAxiosInstance.delete).toHaveBeenNthCalledWith(
      1,
      '/apartments/100/photos/1',
      {
        headers: { Authorization: 'Bearer mock-access-token' },
      },
    );
    expect(mockAxiosInstance.delete).toHaveBeenNthCalledWith(
      2,
      '/apartments/200/photos/2',
      {
        headers: { Authorization: 'Bearer mock-access-token' },
      },
    );
    expect(mockAxiosInstance.delete).toHaveBeenNthCalledWith(
      3,
      '/apartments/300/photos/3',
      {
        headers: { Authorization: 'Bearer mock-access-token' },
      },
    );
  });

  it('should clear error state on successful deletion after previous error', async () => {
    // Arrange
    const mockSession = {
      accessToken: 'mock-access-token',
    };
    mockedUseSession.mockReturnValue({ data: mockSession });

    const { result } = renderHook(() => useDeleteApartmentPhoto(), {
      wrapper: createWrapper(),
    });

    // First deletion fails
    mockAxiosInstance.delete.mockRejectedValueOnce(new Error('First error'));
    try {
      await result.current.deletePhoto(123, 456);
    } catch {
      // Expected to throw
    }

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });

    // Second deletion succeeds
    mockAxiosInstance.delete.mockResolvedValueOnce({ status: 204 });
    await result.current.deletePhoto(123, 789);

    // Assert error is cleared
    await waitFor(() => {
      expect(result.current.error).toBeNull();
    });
  });
});
