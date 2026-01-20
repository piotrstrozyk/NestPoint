import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, beforeEach, Mock } from 'vitest';
import ReviewSection from '@/features/apartment/components/review-section';

// Mock next-auth useSession
vi.mock('next-auth/react', () => ({
  useSession: vi.fn(),
}));

// Mock hooks
vi.mock('@/features/apartment/hooks/use-fetch-reviews');
vi.mock('@/features/apartment/hooks/use-fetch-tenants');
vi.mock('@/features/apartment/hooks/use-fetch-completed-rentals');
vi.mock('@/features/apartment/hooks/use-post-review');
vi.mock('@/features/apartment/hooks/use-update-review');
vi.mock('@/features/apartment/hooks/use-delete-review');

import { useSession } from 'next-auth/react';
import useFetchReviews from '@/features/apartment/hooks/use-fetch-reviews';
import useFetchTenants from '@/features/apartment/hooks/use-fetch-tenants';
import useFetchTenantRentals from '@/features/apartment/hooks/use-fetch-completed-rentals';
import usePostReview from '@/features/apartment/hooks/use-post-review';
import useUpdateReview from '@/features/apartment/hooks/use-update-review';
import useDeleteReview from '@/features/apartment/hooks/use-delete-review';

const mockSession = {
  data: {
    user: { id: 1, username: 'alice', role: ['TENANT'] },
  },
};

const mockTenants = [
  { id: 1, username: 'alice' },
  { id: 2, username: 'bob' },
];

const mockReviews = [
  { id: 10, authorId: 1, apartmentId: 123, content: 'Great stay!', score: 5 },
  { id: 11, authorId: 2, apartmentId: 123, content: 'Nice place', score: 4 },
];

const mockRentals = [
  { id: 100, apartmentId: 123, status: 'COMPLETED' },
];

describe('ReviewSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useSession as Mock).mockReturnValue(mockSession);
    (useFetchTenants as Mock).mockReturnValue({ tenants: mockTenants, loading: false });
    (useFetchReviews as Mock).mockReturnValue({
      reviews: mockReviews,
      reviewCount: 2,
      averageRating: 4.5,
      loading: false,
      refetch: vi.fn(),
    });
    (useFetchTenantRentals as Mock).mockReturnValue({ rentals: mockRentals, loading: false });
    (usePostReview as Mock).mockReturnValue({ postReview: vi.fn(), loading: false, error: null });
    (useUpdateReview as Mock).mockReturnValue({ putReview: vi.fn(), loading: false, error: null });
    (useDeleteReview as Mock).mockReturnValue({ deleteReview: vi.fn(), loading: false });
  });

  it('renders aggregate rating and review count', () => {
    render(<ReviewSection apartmentId={123} />);
    expect(screen.getByText('Reviews')).toBeInTheDocument();
    expect(screen.getByText('4.5')).toBeInTheDocument();
    expect(screen.getByText('2 reviews')).toBeInTheDocument();
  });

  it('renders all reviews with usernames and stars', () => {
    render(<ReviewSection apartmentId={123} />);
    expect(screen.getByText('alice')).toBeInTheDocument();
    expect(screen.getByText('bob')).toBeInTheDocument();
    expect(screen.getAllByText('Great stay!').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Nice place')).toBeInTheDocument();
  });

  it('shows review form if user has completed rental', () => {
    render(<ReviewSection apartmentId={123} />);
    expect(screen.getByText(/Edit Your Review|Write a Review/)).toBeInTheDocument();
    expect(screen.getByRole('radiogroup', { name: 'Your rating:' })).toBeInTheDocument();
    expect(screen.getByLabelText('Your review:')).toBeInTheDocument();
  });

  it('does not show review form if user has not completed rental', () => {
    (useFetchTenantRentals as Mock).mockReturnValue({ rentals: [], loading: false });
    render(<ReviewSection apartmentId={123} />);
    expect(screen.getByText('You can only leave a review after completing a stay at this apartment.')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    (useFetchReviews as Mock).mockReturnValue({ reviews: [], reviewCount: 0, averageRating: 0, loading: true, refetch: vi.fn() });
    (useFetchTenants as Mock).mockReturnValue({ tenants: [], loading: true });
    render(<ReviewSection apartmentId={123} />);
    expect(screen.getByText('Loading reviews...')).toBeInTheDocument();
  });

  it('shows empty state if no reviews', () => {
    (useFetchReviews as Mock).mockReturnValue({ reviews: [], reviewCount: 0, averageRating: 0, loading: false, refetch: vi.fn() });
    render(<ReviewSection apartmentId={123} />);
    expect(screen.getByText('No reviews yet. Be the first to leave a review!')).toBeInTheDocument();
  });

  it('submits a new review', async () => {
    const postReview = vi.fn().mockResolvedValue({});
    (usePostReview as Mock).mockReturnValue({ postReview, loading: false, error: null });
    (useFetchReviews as Mock).mockReturnValue({
      reviews: [],
      reviewCount: 0,
      averageRating: 0,
      loading: false,
      refetch: vi.fn(),
    });
    render(<ReviewSection apartmentId={123} />);
    const textarea = screen.getByLabelText('Your review:');
    await userEvent.clear(textarea);
    await userEvent.type(textarea, 'Awesome!');
    const submit = screen.getByRole('button', { name: /submit review/i });
    await userEvent.click(submit);
    await waitFor(() => {
      expect(postReview).toHaveBeenCalledWith({
        content: 'Awesome!',
        score: 5,
        authorId: 1,
        apartmentId: 123,
      });
    });
  });

  it('updates an existing review', async () => {
    const putReview = vi.fn().mockResolvedValue({});
    (useUpdateReview as Mock).mockReturnValue({ putReview, loading: false, error: null });
    render(<ReviewSection apartmentId={123} />);
    const textarea = screen.getByLabelText('Your review:');
    await userEvent.clear(textarea);
    await userEvent.type(textarea, 'Updated!');
    const submit = screen.getByRole('button', { name: /update review/i });
    await userEvent.click(submit);
    await waitFor(() => {
      expect(putReview).toHaveBeenCalledWith(10, {
        content: 'Updated!',
        score: 5,
        authorId: 1,
        apartmentId: 123,
      });
    });
  });

  it('deletes a review', async () => {
    const deleteReview = vi.fn().mockResolvedValue({});
    (useDeleteReview as Mock).mockReturnValue({ deleteReview, loading: false });
    render(<ReviewSection apartmentId={123} />);
    const deleteBtn = screen.getByRole('button', { name: /delete/i });
    await userEvent.click(deleteBtn);
    await waitFor(() => {
      expect(deleteReview).toHaveBeenCalledWith(10);
    });
  });
});
