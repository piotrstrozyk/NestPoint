import useUpdateReview, {
  ApartmentReviewInput,
} from '@/features/apartment/hooks/use-update-review';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import { env } from 'next-runtime-env';
import { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock dependencies
vi.mock('axios');
vi.mock('next-auth/react');
vi.mock('next-runtime-env');

const mockedAxios = vi.mocked(axios);
const mockedUseSession = vi.mocked(useSession);
const mockedEnv = vi.mocked(env);

// Mock data
const mockReviewInput: ApartmentReviewInput = {
  content: 'Updated review content with better insights!',
  score: 4,
  authorId: 123,
  apartmentId: 456,
};

const mockSession = {
  accessToken: 'mock-access-token',
  user: { id: '123' },
  expires: '2099-12-31T23:59:59.999Z',
};

const mockUpdatedReviewResponse = {
  id: 1,
  ...mockReviewInput,
  createdAt: '2024-06-20T10:00:00Z',
  updatedAt: '2024-06-29T12:00:00Z',
};

// Test wrapper component
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      mutations: {
        retry: false,
      },
    },
  });

  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  Wrapper.displayName = 'QueryClientTestWrapper';
  return Wrapper;
};

describe('useUpdateReview', () => {
  const mockApiClient = {
    put: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockedEnv.mockReturnValue('https://api.example.com');
    (mockedAxios.create as unknown as jest.Mock).mockReturnValue(
      mockApiClient as { put: ReturnType<typeof vi.fn> },
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should return initial mutation state', () => {
    mockedUseSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated',
      update: vi.fn(),
    });

    const { result } = renderHook(() => useUpdateReview(), {
      wrapper: createWrapper(),
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(result.current.data).toBeUndefined();
    expect(typeof result.current.putReview).toBe('function');
  });

  it('should update review successfully with authentication', async () => {
    mockedUseSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated',
      update: vi.fn(),
    });

    mockApiClient.put.mockResolvedValue({
      data: mockUpdatedReviewResponse,
    });

    const { result } = renderHook(() => useUpdateReview(), {
      wrapper: createWrapper(),
    });

    const reviewId = 1;

    let mutationResult: typeof mockUpdatedReviewResponse | undefined;
    await act(async () => {
      mutationResult = await result.current.putReview(
        reviewId,
        mockReviewInput,
      );
    });

    // Verify the API call
    expect(mockApiClient.put).toHaveBeenCalledWith(
      `/reviews/${reviewId}?details=${encodeURIComponent(JSON.stringify(mockReviewInput))}`,
      expect.any(FormData),
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: 'Bearer mock-access-token',
        },
      },
    );

    expect(mutationResult).toEqual(mockUpdatedReviewResponse);
    expect(result.current.error).toBe(null);
  });

  it('should create axios client with correct base URL inside mutation function', async () => {
    const mockBaseUrl = 'https://custom-api.example.com';
    mockedEnv.mockReturnValue(mockBaseUrl);
    mockedUseSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated',
      update: vi.fn(),
    });

    mockApiClient.put.mockResolvedValue({
      data: mockUpdatedReviewResponse,
    });

    const { result } = renderHook(() => useUpdateReview(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.putReview(1, mockReviewInput);
    });

    expect(mockedAxios.create).toHaveBeenCalledWith({
      baseURL: mockBaseUrl,
    });
  });

  it('should update review without authorization header when no session', async () => {
    mockedUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: vi.fn(),
    });

    mockApiClient.put.mockResolvedValue({
      data: mockUpdatedReviewResponse,
    });

    const { result } = renderHook(() => useUpdateReview(), {
      wrapper: createWrapper(),
    });

    const reviewId = 1;

    await act(async () => {
      await result.current.putReview(reviewId, mockReviewInput);
    });

    expect(mockApiClient.put).toHaveBeenCalledWith(
      `/reviews/${reviewId}?details=${encodeURIComponent(JSON.stringify(mockReviewInput))}`,
      expect.any(FormData),
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    );
  });

  it('should update review without authorization header when session has no access token', async () => {
    const sessionWithoutToken = {
      user: { id: '123' },
      expires: '2099-12-31T23:59:59.999Z',
    };
    mockedUseSession.mockReturnValue({
      data: sessionWithoutToken,
      status: 'authenticated',
      update: vi.fn(),
    });

    mockApiClient.put.mockResolvedValue({
      data: mockUpdatedReviewResponse,
    });

    const { result } = renderHook(() => useUpdateReview(), {
      wrapper: createWrapper(),
    });

    const reviewId = 1;

    await act(async () => {
      await result.current.putReview(reviewId, mockReviewInput);
    });

    expect(mockApiClient.put).toHaveBeenCalledWith(
      `/reviews/${reviewId}?details=${encodeURIComponent(JSON.stringify(mockReviewInput))}`,
      expect.any(FormData),
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    );
  });

  it('should handle API errors correctly', async () => {
    mockedUseSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated',
      update: vi.fn(),
    });

    const mockError = new Error('Failed to update review');
    mockApiClient.put.mockRejectedValue(mockError);

    const { result } = renderHook(() => useUpdateReview(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      try {
        await result.current.putReview(1, mockReviewInput);
      } catch {}
    });

    await waitFor(() => {
      expect(result.current.error).toEqual(mockError);
    });

    expect(result.current.data).toBeUndefined();
    expect(result.current.loading).toBe(false);
  });

  it('should show loading state during mutation', async () => {
    mockedUseSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated',
      update: vi.fn(),
    });
    let resolvePromise: (value: unknown) => void;
    const controllablePromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    mockApiClient.put.mockReturnValue(controllablePromise);

    const { result } = renderHook(() => useUpdateReview(), {
      wrapper: createWrapper(),
    });

    // Start the mutation
    act(() => {
      result.current.putReview(1, mockReviewInput);
    });

    // Resolve the promise
    act(() => {
      resolvePromise!({ data: mockUpdatedReviewResponse });
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it('should handle different review IDs correctly', async () => {
    mockedUseSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated',
      update: vi.fn(),
    });

    mockApiClient.put.mockResolvedValue({
      data: mockUpdatedReviewResponse,
    });

    const { result } = renderHook(() => useUpdateReview(), {
      wrapper: createWrapper(),
    });

    const reviewIds = [1, 99, 1000];

    for (const reviewId of reviewIds) {
      await act(async () => {
        await result.current.putReview(reviewId, mockReviewInput);
      });

      expect(mockApiClient.put).toHaveBeenCalledWith(
        `/reviews/${reviewId}?details=${encodeURIComponent(JSON.stringify(mockReviewInput))}`,
        expect.any(FormData),
        expect.any(Object),
      );
    }
  });

  it('should encode review details correctly in URL parameters', async () => {
    mockedUseSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated',
      update: vi.fn(),
    });

    mockApiClient.put.mockResolvedValue({
      data: mockUpdatedReviewResponse,
    });

    const reviewWithSpecialChars: ApartmentReviewInput = {
      content: 'Updated: Great apartment! & very clean, 100% recommended',
      score: 5,
      authorId: 123,
      apartmentId: 456,
    };

    const { result } = renderHook(() => useUpdateReview(), {
      wrapper: createWrapper(),
    });

    const reviewId = 1;

    await act(async () => {
      await result.current.putReview(reviewId, reviewWithSpecialChars);
    });

    const expectedEncodedDetails = encodeURIComponent(
      JSON.stringify(reviewWithSpecialChars),
    );

    expect(mockApiClient.put).toHaveBeenCalledWith(
      `/reviews/${reviewId}?details=${expectedEncodedDetails}`,
      expect.any(FormData),
      expect.any(Object),
    );
  });

  it('should handle score updates correctly', async () => {
    mockedUseSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated',
      update: vi.fn(),
    });

    mockApiClient.put.mockResolvedValue({
      data: mockUpdatedReviewResponse,
    });

    const { result } = renderHook(() => useUpdateReview(), {
      wrapper: createWrapper(),
    });

    const reviewId = 1;
    const reviewScores = [1, 2, 3, 4, 5];

    for (const score of reviewScores) {
      const reviewWithScore = { ...mockReviewInput, score };

      await act(async () => {
        await result.current.putReview(reviewId, reviewWithScore);
      });

      expect(mockApiClient.put).toHaveBeenCalledWith(
        `/reviews/${reviewId}?details=${encodeURIComponent(JSON.stringify(reviewWithScore))}`,
        expect.any(FormData),
        expect.any(Object),
      );
    }
  });

  it('should create new FormData for each request', async () => {
    mockedUseSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated',
      update: vi.fn(),
    });

    mockApiClient.put.mockResolvedValue({
      data: mockUpdatedReviewResponse,
    });

    const { result } = renderHook(() => useUpdateReview(), {
      wrapper: createWrapper(),
    });

    // Make first request
    await act(async () => {
      await result.current.putReview(1, mockReviewInput);
    });

    const firstCallFormData = mockApiClient.put.mock.calls[0][1];

    // Make second request
    await act(async () => {
      await result.current.putReview(2, {
        ...mockReviewInput,
        content: 'Different updated content',
      });
    });

    const secondCallFormData = mockApiClient.put.mock.calls[1][1];

    // Should be different FormData instances
    expect(firstCallFormData).toBeInstanceOf(FormData);
    expect(secondCallFormData).toBeInstanceOf(FormData);
    expect(firstCallFormData).not.toBe(secondCallFormData);
  });

  it('should handle concurrent updates to different reviews', async () => {
    mockedUseSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated',
      update: vi.fn(),
    });

    mockApiClient.put.mockResolvedValue({
      data: mockUpdatedReviewResponse,
    });

    const { result } = renderHook(() => useUpdateReview(), {
      wrapper: createWrapper(),
    });

    // Start multiple concurrent updates
    const promises = [
      result.current.putReview(1, { ...mockReviewInput, content: 'Review 1' }),
      result.current.putReview(2, { ...mockReviewInput, content: 'Review 2' }),
      result.current.putReview(3, { ...mockReviewInput, content: 'Review 3' }),
    ];

    await act(async () => {
      await Promise.all(promises);
    });

    expect(mockApiClient.put).toHaveBeenCalledTimes(3);

    // Verify each call had the correct reviewId
    expect(mockApiClient.put).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('/reviews/1?'),
      expect.any(FormData),
      expect.any(Object),
    );

    expect(mockApiClient.put).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('/reviews/2?'),
      expect.any(FormData),
      expect.any(Object),
    );

    expect(mockApiClient.put).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining('/reviews/3?'),
      expect.any(FormData),
      expect.any(Object),
    );
  });

  it('should handle zero and negative review IDs', async () => {
    mockedUseSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated',
      update: vi.fn(),
    });

    mockApiClient.put.mockResolvedValue({
      data: mockUpdatedReviewResponse,
    });

    const { result } = renderHook(() => useUpdateReview(), {
      wrapper: createWrapper(),
    });

    // Test with zero ID
    await act(async () => {
      await result.current.putReview(0, mockReviewInput);
    });

    expect(mockApiClient.put).toHaveBeenCalledWith(
      '/reviews/0?details=' +
        encodeURIComponent(JSON.stringify(mockReviewInput)),
      expect.any(FormData),
      expect.any(Object),
    );

    // Test with negative ID (edge case)
    await act(async () => {
      await result.current.putReview(-1, mockReviewInput);
    });

    expect(mockApiClient.put).toHaveBeenCalledWith(
      '/reviews/-1?details=' +
        encodeURIComponent(JSON.stringify(mockReviewInput)),
      expect.any(FormData),
      expect.any(Object),
    );
  });
});
