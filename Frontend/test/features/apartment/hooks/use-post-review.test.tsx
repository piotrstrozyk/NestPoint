import usePostReview, {
  ApartmentReviewInput,
} from '@/features/apartment/hooks/use-post-review';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import axios from 'axios';
import type { Session } from 'next-auth';
import { useSession } from 'next-auth/react';
import { env } from 'next-runtime-env';
import { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, Mock, vi } from 'vitest';

// Mock dependencies
vi.mock('axios');
vi.mock('next-auth/react');
vi.mock('next-runtime-env');

const mockedAxios = vi.mocked(axios);

// Mock data
const mockReviewInput: ApartmentReviewInput = {
  content: 'Great apartment with excellent amenities!',
  score: 5,
  authorId: 123,
  apartmentId: 456,
};

const mockSession: Session = {
  accessToken: 'mock-access-token',
  user: { id: '123', name: 'Test User' },
  expires: '2099-12-31T23:59:59.999Z',
};

const mockReviewResponse = {
  id: 1,
  ...mockReviewInput,
  createdAt: '2024-06-29T10:00:00Z',
  updatedAt: '2024-06-29T10:00:00Z',
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

describe('usePostReview', () => {
  const mockApiClient = {
    post: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (env as unknown as Mock).mockReturnValue('https://api.example.com');
    (axios.create as unknown as Mock).mockReturnValue(
      mockApiClient as { post: Mock },
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should return initial mutation state', () => {
    (useSession as unknown as Mock).mockReturnValue({
      data: mockSession,
      status: 'authenticated',
    });

    const { result } = renderHook(() => usePostReview(), {
      wrapper: createWrapper(),
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(result.current.data).toBeUndefined();
    expect(typeof result.current.postReview).toBe('function');
  });

  it('should create axios client with correct base URL', () => {
    const mockBaseUrl = 'https://custom-api.example.com';
    (env as unknown as Mock).mockReturnValue(mockBaseUrl);
    (useSession as unknown as Mock).mockReturnValue({
      data: mockSession,
      status: 'authenticated',
    });

    renderHook(() => usePostReview(), { wrapper: createWrapper() });

    expect(mockedAxios.create).toHaveBeenCalledWith({
      baseURL: mockBaseUrl,
    });
  });

  it('should post review successfully with authentication', async () => {
    (useSession as unknown as Mock).mockReturnValue({
      data: mockSession,
      status: 'authenticated',
    });

    mockApiClient.post.mockResolvedValue({
      data: mockReviewResponse,
    });

    let mutationResult: typeof mockReviewResponse | undefined;
    const { result } = renderHook(() => usePostReview(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      mutationResult = await result.current.postReview(mockReviewInput);
    });

    // Verify the API call
    expect(mockApiClient.post).toHaveBeenCalledWith(
      `/reviews/apartment?details=${encodeURIComponent(JSON.stringify(mockReviewInput))}`,
      expect.any(FormData),
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: 'Bearer mock-access-token',
        },
      },
    );

    expect(mutationResult).toEqual(mockReviewResponse);
    expect(result.current.error).toBe(null);
  });

  it('should post review without authorization header when no session', async () => {
    (useSession as unknown as Mock).mockReturnValue({
      data: null,
      status: 'unauthenticated',
    });

    mockApiClient.post.mockResolvedValue({
      data: mockReviewResponse,
    });

    const { result } = renderHook(() => usePostReview(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.postReview(mockReviewInput);
    });

    expect(mockApiClient.post).toHaveBeenCalledWith(
      `/reviews/apartment?details=${encodeURIComponent(JSON.stringify(mockReviewInput))}`,
      expect.any(FormData),
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    );
  });

  it('should post review without authorization header when session has no access token', async () => {
    const sessionWithoutToken: Partial<Session> = {
      user: { id: '123', name: 'Test User' },
      expires: '2099-12-31T23:59:59.999Z',
    };

    (useSession as unknown as Mock).mockReturnValue({
      data: sessionWithoutToken,
      status: 'authenticated',
    });

    mockApiClient.post.mockResolvedValue({
      data: mockReviewResponse,
    });

    const { result } = renderHook(() => usePostReview(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.postReview(mockReviewInput);
    });

    expect(mockApiClient.post).toHaveBeenCalledWith(
      `/reviews/apartment?details=${encodeURIComponent(JSON.stringify(mockReviewInput))}`,
      expect.any(FormData),
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    );
  });

  it('should handle API errors correctly', async () => {
    (useSession as unknown as Mock).mockReturnValue({
      data: mockSession,
      status: 'authenticated',
    });

    const mockError = new Error('Failed to post review');
    mockApiClient.post.mockRejectedValue(mockError);

    const { result } = renderHook(() => usePostReview(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      try {
        await result.current.postReview(mockReviewInput);
      } catch {}
    });

    await waitFor(() => {
      expect(result.current.error).toEqual(mockError);
    });

    expect(result.current.data).toBeUndefined();
    expect(result.current.loading).toBe(false);
  });

  it('should show loading state during mutation', async () => {
    (useSession as unknown as Mock).mockReturnValue({
      data: mockSession,
      status: 'authenticated',
    });

    let resolvePromise: (value: unknown) => void;
    const controllablePromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    mockApiClient.post.mockReturnValue(controllablePromise);

    const { result } = renderHook(() => usePostReview(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.postReview(mockReviewInput);
    });

    act(() => {
      resolvePromise!({ data: mockReviewResponse });
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it('should encode review details correctly in URL parameters', async () => {
    (useSession as unknown as Mock).mockReturnValue({
      data: mockSession,
      status: 'authenticated',
    });

    mockApiClient.post.mockResolvedValue({
      data: mockReviewResponse,
    });

    const reviewWithSpecialChars: ApartmentReviewInput = {
      content: 'Great apartment! & very clean, 100% recommended',
      score: 5,
      authorId: 123,
      apartmentId: 456,
    };

    const { result } = renderHook(() => usePostReview(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.postReview(reviewWithSpecialChars);
    });

    const expectedEncodedDetails = encodeURIComponent(
      JSON.stringify(reviewWithSpecialChars),
    );

    expect(mockApiClient.post).toHaveBeenCalledWith(
      `/reviews/apartment?details=${expectedEncodedDetails}`,
      expect.any(FormData),
      expect.any(Object),
    );
  });

  it('should handle different score values correctly', async () => {
    (useSession as unknown as Mock).mockReturnValue({
      data: mockSession,
      status: 'authenticated',
    });

    mockApiClient.post.mockResolvedValue({
      data: mockReviewResponse,
    });

    const lowScoreReview: ApartmentReviewInput = {
      content: 'Could be better',
      score: 1,
      authorId: 123,
      apartmentId: 456,
    };

    const { result } = renderHook(() => usePostReview(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.postReview(lowScoreReview);
    });

    expect(mockApiClient.post).toHaveBeenCalledWith(
      `/reviews/apartment?details=${encodeURIComponent(JSON.stringify(lowScoreReview))}`,
      expect.any(FormData),
      expect.any(Object),
    );
  });

  it('should create new FormData for each request', async () => {
    (useSession as unknown as Mock).mockReturnValue({
      data: mockSession,
      status: 'authenticated',
    });

    mockApiClient.post.mockResolvedValue({
      data: mockReviewResponse,
    });

    const { result } = renderHook(() => usePostReview(), {
      wrapper: createWrapper(),
    });

    // Make first request
    await act(async () => {
      await result.current.postReview(mockReviewInput);
    });

    const firstCallFormData = mockApiClient.post.mock.calls[0][1];

    // Make second request
    await act(async () => {
      await result.current.postReview({
        ...mockReviewInput,
        content: 'Different review content',
      });
    });

    const secondCallFormData = mockApiClient.post.mock.calls[1][1];

    // Should be different FormData instances
    expect(firstCallFormData).toBeInstanceOf(FormData);
    expect(secondCallFormData).toBeInstanceOf(FormData);
    expect(firstCallFormData).not.toBe(secondCallFormData);
  });
});
