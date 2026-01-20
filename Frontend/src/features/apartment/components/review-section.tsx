'use client';

import useFetchTenantRentals from '@/features/apartment/hooks/use-fetch-completed-rentals';
import useFetchReviews, {
  Review,
} from '@/features/apartment/hooks/use-fetch-reviews';
import useFetchTenants, {
  Tenant,
} from '@/features/apartment/hooks/use-fetch-tenants';
import usePostReview from '@/features/apartment/hooks/use-post-review';
import useUpdateReview from '@/features/apartment/hooks/use-update-review';
import useDeleteReview from '@/features/apartment/hooks/use-delete-review';
import clsx from 'clsx';
import { Star } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { FormEvent, useEffect, useMemo, useState } from 'react';

interface ReviewSectionProps {
  apartmentId: number;
}

export default function ReviewSection({ apartmentId }: ReviewSectionProps) {
  const { data: session } = useSession();
  const {
    reviews,
    reviewCount,
    averageRating,
    loading: reviewsLoading,
    refetch,
  } = useFetchReviews(apartmentId);

  // Fetch all tenants to display usernames
  const { tenants, loading: tenantsLoading } = useFetchTenants();

  // Create a map of tenant IDs to usernames for quick lookup
  const tenantMap = useMemo(() => {
    const map = new Map<number, string>();
    if (tenants) {
      tenants.forEach((tenant: Tenant) => {
        map.set(tenant.id, tenant.username);
      });
    }
    return map;
  }, [tenants]);

  const [hasCompletedRental, setHasCompletedRental] = useState(false);

  // Fetch user's completed rentals
  const { rentals, loading: rentalsLoading } = useFetchTenantRentals(
    session?.user?.id as number,
    'COMPLETED',
  );

  // Post/Update review hooks
  const {
    postReview,
    loading: postingReview,
    error: postError,
  } = usePostReview();
  const {
    putReview,
    loading: updatingReview,
    error: updateError,
  } = useUpdateReview();
  const {
    deleteReview,
    loading: deletingReview,
  } = useDeleteReview();

  // Check if user has completed a rental for this apartment
  useEffect(() => {
    if (!rentals || rentalsLoading || !session?.user?.id) return;

    const hasCompleted = rentals.some(
      (rental) =>
        rental.apartmentId === apartmentId && rental.status === 'COMPLETED',
    );

    setHasCompletedRental(hasCompleted);
  }, [rentals, apartmentId, rentalsLoading, session?.user?.id]);

  // Find user's existing review (if any)
  const [userReview, setUserReview] = useState<Review | null>(null);

  useEffect(() => {
    if (!session?.user?.id || !reviews) {
      setUserReview(null);
      return;
    }

    const existingReview = reviews.find((r) => r.authorId === session.user?.id);
    setUserReview(existingReview || null);

    // If we found an existing review, initialize form with its values
    if (existingReview) {
      setScore(existingReview.score);
      setContent(existingReview.content);
    }
  }, [reviews, session?.user?.id]);

  const [score, setScore] = useState(5);
  const [content, setContent] = useState('');
  const [submitMessage, setSubmitMessage] = useState('');

  const isLoading = postingReview || updatingReview;
  const formError = postError || updateError;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!hasCompletedRental || !session?.user?.id) return;

    try {
      const reviewData = {
        content,
        score,
        authorId: session.user.id as number,
        apartmentId,
      };

      if (userReview) {
        // Update existing review
        await putReview(userReview.id, reviewData);
        setSubmitMessage('Review updated successfully!');
      } else {
        // Create new review
        await postReview(reviewData);
        setSubmitMessage('Review submitted successfully!');
      }

      // Refresh the reviews list
      refetch();

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSubmitMessage('');
      }, 3000);
    } catch (err) {
      setSubmitMessage('Failed to submit review. Please try again.');
      console.error(err);
    }
  }

  // Add delete handler
  async function handleDeleteReview(reviewId: number) {
    if (!reviewId) return;
    try {
      await deleteReview(reviewId);
      setSubmitMessage('Review deleted successfully!');
      setScore(5);
      setContent('');
      setUserReview(null);
      refetch();
      setTimeout(() => setSubmitMessage(''), 3000);
    } catch (err) {
      setSubmitMessage('Failed to delete review. Please try again.');
      console.error(err);
    }
  }

  return (
    <section className='mt-12 space-y-8 rounded-lg bg-white p-8 shadow'>
      <div className='flex flex-col justify-between md:flex-row md:items-center'>
        <h2 className='text-2xl font-semibold'>Reviews</h2>

        {/* Aggregate rating */}
        <div className='mt-2 flex items-center rounded-lg bg-gray-50 px-4 py-2 md:mt-0'>
          <div className='flex items-center'>
            <Star className='h-6 w-6 text-yellow-500' />
            <span className='ml-2 text-xl font-bold'>
              {reviewsLoading ? '—' : averageRating.toFixed(1)}
            </span>
          </div>
          <span className='mx-2 text-gray-300'>|</span>
          <span className='text-gray-600'>
            {reviewsLoading ? '—' : reviewCount} review
            {reviewCount !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Reviews list */}
      {reviewsLoading || tenantsLoading ? (
        <div className='flex items-center justify-center py-8'>
          <div className='flex animate-pulse space-x-2'>
            <div className='h-2 w-2 rounded-full bg-gray-300'></div>
            <div className='h-2 w-2 rounded-full bg-gray-300'></div>
            <div className='h-2 w-2 rounded-full bg-gray-300'></div>
          </div>
          <p className='ml-3 text-gray-500'>Loading reviews...</p>
        </div>
      ) : reviews.length > 0 ? (
        <div className='space-y-6'>
          {reviews.map((r: Review, idx: number) => {
            const filled: number = Math.max(
              0,
              Math.min(5, Math.floor(r.score)),
            );

            // Get username from tenantMap or fallback to ID
            const username = tenantMap.get(r.authorId) || `User #${r.authorId}`;
            const isUserReview = session?.user?.id === r.authorId;
            const isAdmin = session?.user?.role?.includes('ADMIN');
            const canDelete = isUserReview || isAdmin;

            return (
              <div
                key={idx}
                className={clsx(
                  'rounded-lg p-4',
                  isUserReview
                    ? 'border border-blue-100 bg-blue-50'
                    : 'bg-gray-50',
                )}
              >
                <div className='flex items-center justify-between'>
                  <div className='flex items-center'>
                    <div className='flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-gray-500'>
                      {username.charAt(0).toUpperCase()}
                    </div>
                    <div className='ml-3'>
                      <div className='font-medium'>{username}</div>
                      <div className='mt-1 flex items-center'>
                        {[1, 2, 3, 4, 5].map((i: number) => (
                          <Star
                            key={i}
                            className={clsx(
                              'h-4 w-4',
                              i <= filled ? 'text-yellow-500' : 'text-gray-300',
                            )}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className='flex items-center gap-2'>
                    {/* Badge for user's own review */}
                    {isUserReview && (
                      <span className='rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-800'>
                        Your review
                      </span>
                    )}
                    {/* Delete button for tenant or admin */}
                    {canDelete && (
                      <button
                        type='button'
                        onClick={() => handleDeleteReview(r.id)}
                        className='ml-2 rounded bg-red-100 px-2 py-1 text-xs text-red-700 hover:bg-red-200 disabled:opacity-50'
                        disabled={deletingReview}
                        title='Delete review'
                      >
                        {deletingReview ? 'Deleting...' : 'Delete'}
                      </button>
                    )}
                  </div>
                </div>
                <p className='mt-3 text-gray-700'>{r.content}</p>
              </div>
            );
          })}
        </div>
      ) : (
        <div className='py-8 text-center'>
          <p className='text-gray-500'>
            No reviews yet. Be the first to leave a review!
          </p>
        </div>
      )}

      {/* Review form - only shown when user has completed rental */}
      {session?.user && (
        <>
          {hasCompletedRental ? (
            <form
              onSubmit={handleSubmit}
              className='mt-10 space-y-6 rounded-lg bg-gray-50 p-6'
            >
              <h3 className='text-xl font-semibold'>
                {userReview ? 'Edit Your Review' : 'Write a Review'}
              </h3>

              <div className='flex items-center space-x-2'>
                <span id='score-label' className='font-medium'>
                  Your rating:
                </span>
                <div
                  className='flex items-center space-x-1'
                  role='radiogroup'
                  aria-labelledby='score-label'
                >
                  {[1, 2, 3, 4, 5].map((i) => (
                    <button
                      key={i}
                      type='button'
                      role='radio'
                      aria-checked={score === i}
                      aria-label={`${i} star${i > 1 ? 's' : ''}`}
                      onClick={() => setScore(i)}
                      disabled={isLoading}
                      className='focus:outline-none'
                    >
                      <Star
                        className={clsx(
                          'h-6 w-6 transition-colors',
                          i <= score
                            ? 'fill-yellow-500 text-yellow-500'
                            : 'text-gray-300',
                          !isLoading && 'hover:text-yellow-400',
                        )}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor='content' className='block font-medium'>
                  Your review:
                </label>
                <textarea
                  id='content'
                  rows={4}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className='mt-1 w-full rounded border px-3 py-2'
                  placeholder='Tell us what you thought about your stay...'
                  disabled={isLoading}
                  required
                />
              </div>

              {submitMessage && (
                <div
                  className={`rounded p-3 ${formError ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}
                >
                  {submitMessage}
                </div>
              )}

              <button
                type='submit'
                className='rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white transition hover:bg-indigo-700 disabled:bg-indigo-400'
                disabled={isLoading || !content.trim()}
              >
                {isLoading
                  ? userReview
                    ? 'Updating...'
                    : 'Submitting...'
                  : userReview
                    ? 'Update Review'
                    : 'Submit Review'}
              </button>
            </form>
          ) : (
            <div className='mt-8 rounded-lg border border-amber-100 bg-amber-50 p-4'>
              <p className='text-amber-800'>
                You can only leave a review after completing a stay at this
                apartment.
              </p>
            </div>
          )}
        </>
      )}
    </section>
  );
}
