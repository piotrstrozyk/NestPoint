'use client';

import DayRangePicker from '@/core/components/calendar/calendar';
import useFetchApartmentPhotos from '@/features/apartment-list/hooks/use-fetch-apartment-photos';
import { MapCard } from '@/features/apartment/components/address-card';
import AuctionDetails from '@/features/apartment/components/auction-details';
import CreateRentalWithPaymentModal from '@/features/apartment/components/create-rental-with-payment-modal';
import { KeyDetails } from '@/features/apartment/components/details';
import { ImageGrid } from '@/features/apartment/components/image-grid';
import ReviewSection from '@/features/apartment/components/review-section';
import useFetchApartment from '@/features/apartment/hooks/use-fetch-apartment';
import { Auction, useFetchAuctions } from '@/features/apartment/hooks/use-fetch-auction';
import CreateAuctionForm from '@/features/auctions/components/create-auction-form';
import useDeleteApartment from '@/features/owner/hooks/use-delete-apartment';
import useFetchRentals from '@/features/owner/hooks/use-fetch-rentals';
import { AlertTriangle, Gavel, Trash2 } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import 'yet-another-react-lightbox/styles.css';
import { useFetchOccupiedRanges } from '@/features/apartment/hooks/use-fetch-occupied-ranges';
import type { DateRange } from 'react-day-picker';
import { useConfirmAuction } from '@/features/booking/hooks/use-confirm-auction';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import useFetchUserOverdueAuctionPayments from '@/features/tenant/hooks/use-fetch-tenant-overdue';

type RentalWithAuction = ReturnType<typeof useFetchRentals>["rentals"] extends (infer R)[] ? R & {
  isAuction?: boolean;
  auctionPaymentConfirmed?: boolean;
  auctionPaymentDeadline?: string | null;
  auctionFineIssued?: boolean;
} : never;

export default function ApartmentDetailPage() {
  const { id } = useParams();
  const aptId = Number(id);
  const { apartment, loading: aptLoading, error } = useFetchApartment(aptId);
  const router = useRouter();

  // fetch all existing (non‐completed) auctions for this apartment
  const { auctions, refetch } = useFetchAuctions(aptId);

  // Fetch occupied ranges for this apartment
  const { availability } = useFetchOccupiedRanges(aptId);

  const { deleteApartment, error: deleteError } = useDeleteApartment();
  const { rentals, loading: rentalsLoading } = useFetchRentals();

  const {
    photos = [],
    loading: photosLoading,
    error: photosError,
  } = useFetchApartmentPhotos(aptId);

  const { data: session } = useSession();
  const isOwner = apartment && session?.user?.id === apartment.ownerId;
  const isAdmin = session?.user?.role?.includes('ADMIN');

  // Always call the hook, pass 0 if not a tenant
  const tenantId = !isOwner && session?.user?.id ? Number(session.user.id) : 0;
  const { payments: overduePayments } = useFetchUserOverdueAuctionPayments(tenantId);
  const hasOverduePayments = overduePayments && overduePayments.some(p => p.status === 'OVERDUE');

  // Find unpaid auction rentals for this tenant and apartment
  let unpaidAuctionRental = null;
  if (!isOwner && rentals && session?.user?.id) {
    unpaidAuctionRental = (rentals as RentalWithAuction[]).find(
      (r) =>
        r.apartmentId === aptId &&
        r.tenantId === session.user.id &&
        r.auctionPaymentConfirmed === false &&
        r.auctionPaymentDeadline !== null
    );
  }

  // State for apartment related data
  const [hasRelatedRentals, setHasRelatedRentals] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  // State for controlled calendar range
  const [selectedRange, setSelectedRange] = useState<DateRange | undefined>(undefined);
  // Prefill auction modal with selected range
  const [prefillAuctionRange, setPrefillAuctionRange] = useState<{ start: Date; end: Date } | null>(null);

  // State for auction payment modal
  const [showAuctionPaymentModal, setShowAuctionPaymentModal] = useState(false);

  // Form for auction payment
  const auctionPaymentSchema = z.object({
    cardNumber: z
      .string()
      .refine((val) => val.replace(/\D/g, '').length === 10, 'Card number must be exactly 10 digits'),
  });
  type AuctionPaymentForm = z.infer<typeof auctionPaymentSchema>;
  const {
    register: registerAuction,
    handleSubmit: handleAuctionSubmit,
    formState: { errors: auctionErrors, isSubmitting: auctionIsSubmitting },
    reset: resetAuctionForm,
  } = useForm<AuctionPaymentForm>({
    mode: 'onChange',
    defaultValues: { cardNumber: '' },
    resolver: async (values) => {
      try {
        auctionPaymentSchema.parse(values);
        return { values, errors: {} };
      } catch (e) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return { values: {}, errors: (e as any).formErrors?.fieldErrors || {} };
      }
    },
  });
  const { confirmAuction, loading: confirmLoading } = useConfirmAuction();

  // Handle delete apartment
  const handleDeleteClick = () => {
    setIsDeleteModalOpen(true);
  };

  const handleCancelDelete = () => {
    setIsDeleteModalOpen(false);
    setDeleteConfirmationText('');
  };

  const handleConfirmDelete = async () => {
    if (!apartment || deleteConfirmationText !== apartment.title) {
      return; // Require exact match of apartment title
    }

    try {
      setIsDeleting(true);
      await deleteApartment(aptId);

      // Redirect to owner's apartment list after successful deletion
      router.push('/owner-profile');
    } catch (error) {
      console.error('Failed to delete apartment:', error);
      setIsDeleting(false);
    }
  };

  const handleAuctionPayment = async (data: AuctionPaymentForm) => {
    if (!unpaidAuctionRental) return;
    try {
      const response = await confirmAuction({
        rentalId: unpaidAuctionRental.id,
        cardNumber: data.cardNumber,
      });
      if (response && response.success === false) {
        toast.error(response.message || 'Payment failed. Please try again.');
        return;
      }
      toast.success('Auction payment confirmed!');
      setShowAuctionPaymentModal(false);
      resetAuctionForm();
      router.refresh(); // Refresh the page after successful payment
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const err = error as any;
      if (err?.response?.data?.message) {
        toast.error(err.response.data.message);
      } else if (err?.message?.includes('declined')) {
        toast.error(err.message);
      } else {
        toast.error('Failed to confirm payment. Please try again.');
      }
    }
  };

  // Check if apartment has related rentals
  useEffect(() => {
    if (apartment && !rentalsLoading && rentals) {
      // Check if any rental in the fetched rentals is for this apartment
      const apartmentRentals = rentals.filter(
        (rental) => rental.apartmentId === aptId,
      );
      setHasRelatedRentals(apartmentRentals.length > 0);
    }
  }, [apartment, rentals, rentalsLoading, aptId]);

  // Determine if the delete button should be shown
  const canDeleteApartment = (isOwner || isAdmin) && auctions.length === 0 && !hasRelatedRentals;

  // Local state to open/close the "Start Auction" modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedAuction, setSelectedAuction] = useState<Auction | null>(null);

  const [index, setIndex] = useState(-1);
  const slides = (photos ?? []).map((src) => ({ src }));

  const fullAddress = apartment
    ? [
        apartment.address.street || '',
        apartment.address.apartmentNumber || '',
        apartment.address.city || '',
        apartment.address.postalCode || '',
      ]
        .filter((s) => s.trim() !== '')
        .join(' ')
    : '';

  // Find the currently active auction (if any)
  const activeAuction = auctions.find((a: Auction) => a.status === 'ACTIVE');

  console.log(unpaidAuctionRental, unpaidAuctionRental?.auctionPaymentDeadline)

  // Render skeleton loading state
  if (aptLoading) {
    return (
      <div className='mx-auto mt-32 w-full max-w-6xl space-y-8 p-6'>
        {/* Title skeleton */}
        <div className='space-y-2'>
          <Skeleton height={48} width='70%' />
          <Skeleton height={24} width='40%' />
          <div className='h-1 w-24 rounded-full bg-gray-200' />
        </div>

        {/* Image Grid skeleton */}
        <div className='grid h-[600px] grid-cols-3 grid-rows-2 gap-4'>
          <div className='col-span-2 row-span-2 overflow-hidden rounded-lg bg-gray-100'>
            <Skeleton height='100%' />
          </div>
          {[...Array(4)].map((_, i) => (
            <div key={i} className='overflow-hidden rounded-lg bg-gray-100'>
              <Skeleton height='100%' />
            </div>
          ))}
        </div>

        {/* Description skeleton */}
        <section className='group relative rounded-lg bg-white p-6 shadow'>
          <div className='absolute top-0 left-0 h-full w-1 rounded-l-lg bg-gray-200' />
          <div className='ml-4 space-y-3'>
            <Skeleton height={32} width='30%' />
            <Skeleton count={3} height={20} />
          </div>
        </section>

        {/* Content Grid skeleton */}
        <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
          {/* Left Column */}
          <div className='col-span-1 space-y-6 lg:col-span-2'>
            {/* Map skeleton */}
            <section className='rounded-lg bg-gray-50 p-6'>
              <Skeleton height={32} width='30%' className='mb-4' />
              <div className='mb-4 h-80 w-full overflow-hidden rounded-lg bg-gray-100'>
                <Skeleton height='100%' />
              </div>
              <Skeleton height={20} width='60%' />
            </section>
          </div>

          {/* Right Column: Payment Skeleton */}
          <aside className='col-span-1 self-start rounded-lg border-t-4 border-gray-200 bg-white p-6 shadow-lg'>
            <Skeleton height={32} width='50%' className='mb-4' />

            {/* Price Highlight skeleton */}
            <div className='mb-4 rounded-lg bg-gray-100 p-4'>
              <Skeleton height={20} width='40%' />
              <Skeleton height={36} width='60%' />
            </div>

            <Skeleton height={16} width='70%' className='mb-6' />
            <Skeleton height={48} borderRadius={8} />
          </aside>
        </div>

        {/* Key Details skeleton */}
        <div className='w-full'>
          <section className='rounded-lg bg-white p-6 shadow-lg'>
            <Skeleton height={32} width='30%' className='mb-6' />
            <div className='grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4'>
              {[...Array(12)].map((_, i) => (
                <div
                  key={i}
                  className='flex flex-col items-center rounded-lg bg-gray-50 p-4 text-center'
                >
                  <div className='flex h-12 w-12 items-center justify-center rounded-full bg-gray-100'>
                    <Skeleton circle height={24} width={24} />
                  </div>
                  <Skeleton height={16} width='60%' className='mt-2' />
                  <Skeleton height={24} width='40%' className='mt-1' />
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Reviews skeleton */}
        <div className='mt-12 space-y-8 rounded-lg bg-white p-8 shadow'>
          <Skeleton height={32} width='20%' />
          <div className='mt-2 flex w-fit items-center rounded-lg bg-gray-50 px-4 py-2'>
            <Skeleton height={24} width={120} />
          </div>

          {/* Reviews list skeleton */}
          <div className='space-y-6'>
            {[...Array(3)].map((_, i) => (
              <div key={i} className='rounded-lg bg-gray-50 p-4'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center'>
                    <Skeleton circle height={40} width={40} />
                    <div className='ml-3'>
                      <Skeleton height={20} width={100} />
                      <Skeleton height={16} width={80} className='mt-1' />
                    </div>
                  </div>
                </div>
                <Skeleton count={2} height={16} className='mt-3' />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !apartment) {
    return (
      <p className='py-10 text-center text-red-600'>Error loading apartment.</p>
    );
  }

  return (
    <div className='mx-auto mt-32 w-full max-w-6xl space-y-8 p-6'>
      {/* ——— Title Section (without Edit Button) ——— */}
      <div className='space-y-2'>
        <h1 className='bg-primary bg-clip-text text-5xl font-extrabold tracking-tight text-transparent'>
          {apartment.title}
        </h1>
        {/* location tag */}
        <p className='text-lg font-medium text-gray-600'>
          {apartment.address.city}, {apartment.address.country}
        </p>
        {/* underline */}
        <div className='h-1 w-24 rounded-full bg-indigo-600' />
      </div>

      {/* Floating Action Buttons for Owners and Admins */}
      {(isOwner || isAdmin) && (
        <div className='fixed right-8 bottom-8 z-50 flex flex-col gap-4'>
          {/* Edit Apartment Button (for owner or admin) */}
          {(isOwner || isAdmin) && (
            <button
              onClick={() => router.push(`/edit-apartment/${aptId}`)}
              className='flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-4 text-white shadow-lg transition-all duration-300 hover:scale-105 hover:bg-emerald-700 focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:outline-none'
              title='Edit this apartment'
            >
              <svg xmlns='http://www.w3.org/2000/svg' className='h-5 w-5' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15.232 5.232l3.536 3.536M9 13l6-6m2 2l-6 6m-2 2h6' />
              </svg>
              <span className='hidden sm:inline'>Edit Apartment</span>
            </button>
          )}
          {/* Delete Button - shown for owner or admin */}
          {canDeleteApartment && (
            <button
              onClick={handleDeleteClick}
              className='flex items-center gap-2 rounded-full bg-red-600 px-4 py-4 text-white shadow-lg transition-all duration-300 hover:scale-105 hover:bg-red-700 focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:outline-none'
              title='Delete this apartment'
            >
              <Trash2 className='h-5 w-5' />
              <span className='hidden sm:inline'>Delete</span>
            </button>
          )}
          {/* See Active Auction Button - visible if there is an active auction */}
          {activeAuction && (
            <button
              onClick={() => setSelectedAuction(activeAuction)}
              className='flex items-center gap-2 rounded-full bg-amber-500 px-4 py-4 text-white shadow-lg transition-all duration-300 hover:scale-105 hover:bg-amber-600 focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:outline-none'
              title='See Active Auction'
            >
              <Gavel className='h-5 w-5' />
              <span className='hidden sm:inline'>See Active Auction</span>
            </button>
          )}
        </div>
      )}

      {/* ——— Image Grid Section ——— */}
      <ImageGrid
        photos={photos ?? []}
        photosLoading={photosLoading}
        photosError={!!photosError}
        index={index}
        setIndex={setIndex}
        slides={slides}
        apartmentTitle={apartment.title}
      />

      {/* ——— Description Section ——— */}
      {apartment.description && (
        <section className='group relative rounded-lg bg-white p-6 shadow transition-shadow duration-200 hover:shadow-lg'>
          {/* Accent Bar */}
          <div className='bg-primary absolute top-0 left-0 h-full w-1 rounded-l-lg' />
          <div className='ml-4 space-y-3'>
            <h2 className='flex items-center space-x-2 text-2xl font-semibold text-gray-800'>
              <span>Description</span>
            </h2>
            <p className='prose max-w-none text-lg whitespace-pre-line text-gray-700'>
              {apartment.description}
            </p>
          </div>
        </section>
      )}

      {/* —— Content Grid: Address + Details (left), Payment (right) —— */}
      <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
        {/* Left Column (2/3) */}
        <div className='col-span-1 space-y-6 lg:col-span-2'>
          {/* Address Section with Geocoded Map */}
          <MapCard
            latitude={apartment.address.latitude}
            longitude={apartment.address.longitude}
            address={fullAddress}
            photo={(photos ?? [])[0]}
          />

          {/* Payment Section */}
          <aside className='self-start rounded-lg border-t-4 border-emerald-400 bg-white p-6 shadow-lg'>
            <h2 className='mb-8 flex items-center text-2xl font-semibold text-gray-800'>
              Payment Info
            </h2>
            {/* Overdue payment warning for tenants */}
            {!isOwner && hasOverduePayments && (
              <div className='mb-4 w-full rounded-lg bg-red-50 p-4 text-red-900 border border-red-300'>
                <div className='flex items-center gap-2 mb-2'>
                  <AlertTriangle className='h-5 w-5 text-red-600' />
                  <span className='font-semibold'>You have overdue auction payments</span>
                </div>
                <p className='mb-2 text-sm'>You must go to your profile to pay the fine before booking or participating in auctions.</p>
              </div>
            )}
            {/* Price & Controls Grid */}
            <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
              {/* Left Column: Price, Fees, Button, Modal */}
              <div className='flex flex-col items-center space-y-6 md:items-start mt-22'>
                <div className='w-full max-w-xs rounded-lg bg-gradient-to-r from-indigo-100 to-purple-100 p-4'>
                  <p className='text-sm text-gray-600 uppercase'>Daily Rent</p>
                  <p className='text-3xl font-bold text-gray-900'>
                    {apartment.rentalPrice} <span className='text-xl'>zł</span>
                  </p>
                </div>

                {/* Stick fees and button to bottom of price box */}
                <div className='flex w-full max-w-xs flex-col space-y-4'>
                  <p className='text-sm text-gray-500'>
                    Additional fees may apply
                  </p>

                  {isOwner && (
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className='w-full rounded-lg py-3 text-lg font-semibold text-white transition duration-200 bg-primary hover:bg-amber-800'
                    >
                      <div className='flex items-center justify-center gap-2'>
                        <Gavel className='h-5 w-5' />
                        Start Auction
                      </div>
                    </button>
                  )}

                  {!isOwner && (
                    <div className='flex flex-col w-full items-center'>
                      {/* Book Apartment button is disabled visually and by pointer events if tenant has overdue payments or auction fine */}
                      <div className={hasOverduePayments || (unpaidAuctionRental && unpaidAuctionRental.auctionFineIssued) ? 'pointer-events-none opacity-60 w-full' : 'w-full'}>
                        <CreateRentalWithPaymentModal apartmentId={aptId} />
                      </div>
                      {/* Show overdue payment warning if auctionFineIssued is true */}
                      {unpaidAuctionRental && unpaidAuctionRental.auctionFineIssued && (
                        <div className='mt-4 w-full rounded-lg bg-red-50 p-4 text-red-900 border border-red-300'>
                          <div className='flex items-center gap-2 mb-2'>
                            <AlertTriangle className='h-5 w-5 text-red-600' />
                            <span className='font-semibold'>You have overdue auction payments</span>
                          </div>
                          <p className='mb-2 text-sm'>You must go to your profile to pay the fine before booking or participating in auctions.</p>
                        </div>
                      )}
                      {/* Unpaid auction rental info for tenants (only if not fined and not overdue) */}
                      {unpaidAuctionRental && !hasOverduePayments && unpaidAuctionRental.auctionPaymentDeadline && !unpaidAuctionRental.auctionFineIssued && (
                        <>
                          <div className='mt-4 w-full rounded-lg bg-yellow-50 p-4 text-yellow-900 border border-yellow-300'>
                            <div className='flex items-center gap-2 mb-2'>
                              <AlertTriangle className='h-5 w-5 text-yellow-600' />
                              <span className='font-semibold'>You have unpaid rentals</span>
                            </div>
                            <p className='mb-2 text-sm'>You have an unpaid auction rental for this apartment. Please complete your payment to avoid penalties.</p>
                            <button
                              className='w-full rounded-md bg-yellow-300 py-2 font-semibold text-yellow-900 hover:bg-yellow-400 disabled:opacity-60 disabled:cursor-not-allowed'
                              onClick={() => setShowAuctionPaymentModal(true)}
                              disabled={confirmLoading}
                            >
                              Pay for Rental
                            </button>
                          </div>
                          {/* Auction Payment Modal */}
                          {showAuctionPaymentModal && (
                            <div className='fixed inset-0 z-50 flex min-h-screen items-center justify-center overflow-y-auto bg-black/60 p-4'>
                              <div className='relative w-full max-w-md scale-95 transform rounded-2xl border-t-4 border-yellow-400 bg-white p-8 shadow-2xl transition-transform duration-300 group-hover:scale-100'>
                                <div className='mb-6 flex items-center justify-between'>
                                  <h2 className='text-2xl font-bold text-gray-800'>Auction Payment</h2>
                                  <button
                                    onClick={() => { setShowAuctionPaymentModal(false); resetAuctionForm(); }}
                                    className='text-gray-400 hover:text-gray-600'
                                  >
                                    <span className='sr-only'>Close</span>
                                    <svg xmlns='http://www.w3.org/2000/svg' className='h-6 w-6' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                                    </svg>
                                  </button>
                                </div>
                                <form className='space-y-4' onSubmit={handleAuctionSubmit(handleAuctionPayment)}>
                                  <label className='block text-sm font-medium text-gray-700'>Card Number</label>
                                  <input
                                    type='text'
                                    {...registerAuction('cardNumber')}
                                    className={`w-full rounded-md border px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400 ${auctionErrors.cardNumber ? 'border-red-500' : 'border-gray-300'}`}
                                    placeholder='Enter 10-digit card number'
                                    maxLength={16}
                                    inputMode='numeric'
                                  />
                                  {auctionErrors.cardNumber && (
                                    <p className='text-sm text-red-600'>{auctionErrors.cardNumber.message as string}</p>
                                  )}
                                  <div className='mt-8 flex justify-end space-x-3'>
                                    <button
                                      type='button'
                                      onClick={() => { setShowAuctionPaymentModal(false); resetAuctionForm(); }}
                                      className='rounded-lg bg-gray-200 px-6 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-300'
                                      disabled={confirmLoading}
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      type='submit'
                                      disabled={auctionIsSubmitting || confirmLoading}
                                      className='rounded-lg bg-yellow-400 px-6 py-2 text-sm font-semibold text-yellow-900 transition hover:bg-yellow-500 disabled:opacity-50'
                                    >
                                      {confirmLoading || auctionIsSubmitting ? 'Processing…' : 'Pay Now'}
                                    </button>
                                  </div>
                                </form>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Date Selector */}
              <div className='mx-auto flex min-h-[480px] w-full max-w-md flex-col justify-start'>
                <label className='mb-2 block font-medium text-gray-700'>
                  Select dates
                </label>
                <DayRangePicker
                  selectedRange={selectedRange}
                  onRangeChange={hasOverduePayments || (unpaidAuctionRental && unpaidAuctionRental.auctionFineIssued) ? undefined : setSelectedRange}
                  onConfirm={hasOverduePayments || (unpaidAuctionRental && unpaidAuctionRental.auctionFineIssued) ? undefined : (range) => {
                    if (isOwner && range?.from && range?.to) {
                      setPrefillAuctionRange({ start: range.from, end: range.to });
                      setShowCreateModal(true);
                    }
                  }}
                  disabledRanges={[
                    // Disable all past dates
                    {
                      from: new Date(0),
                      to: new Date(new Date().setHours(0, 0, 0, 0) - 1),
                    },
                    // Disable occupied ranges from API
                    ...((availability?.occupiedRanges || []).map(r => ({
                      from: new Date(r.startDate),
                      to: new Date(r.endDate),
                    })))
                  ]}
                  highlightedRanges={
                    !isOwner && (hasOverduePayments || (unpaidAuctionRental && unpaidAuctionRental.auctionFineIssued))
                      ? []
                      : auctions.length > 0
                        ? auctions.map((a: Auction) => ({
                            from: new Date(a.startTime),
                            to: new Date(a.endTime),
                          }))
                        : []
                  }
                  onDayClick={hasOverduePayments || (unpaidAuctionRental && unpaidAuctionRental.auctionFineIssued) ? undefined : (date: Date) => {
                    // Normalize date to midnight
                    const normalize = (d: Date) => {
                      const nd = new Date(d);
                      nd.setHours(0, 0, 0, 0);
                      return nd;
                    };
                    const clicked = normalize(date);
                    // Find which auction (if any) this date falls into
                    const found = auctions.find((a: Auction) => {
                      const start = normalize(new Date(a.startTime));
                      const end = normalize(new Date(a.endTime));
                      return clicked >= start && clicked <= end;
                    });
                    if (found) {
                      setSelectedAuction(found);
                    }
                  }}
                  userRole={isOwner ? 'OWNER' : 'TENANT'}
                />
              </div>
            </div>
          </aside>
        </div>

        {/* Right Column: Key Details (fill vertical space) */}
        <aside className='col-span-1 flex h-full flex-col'>
          <div className='flex flex-1 flex-col'>
            <KeyDetails apartment={apartment} />
          </div>
        </aside>
      </div>

      {/* ——— Start Auction Modal ——— */}
      {showCreateModal && (
        <div className='fixed inset-0 z-50 flex min-h-screen items-center justify-center bg-black/60'>
          <div className='relative w-full max-w-lg scale-95 transform rounded-2xl bg-white p-8 shadow-2xl transition-transform duration-300 group-hover:scale-100'>
            {/* Header with Icon and Title */}
            <div className='mb-6 flex items-center justify-between'>
              <div className='flex items-center space-x-3'>
                <h2 className='text-2xl font-bold text-gray-800'>
                  Start Auction
                </h2>
              </div>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setPrefillAuctionRange(null);
                }}
                className='text-gray-400 hover:text-gray-600'
              >
                <span className='sr-only'>Close</span>
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  className='h-6 w-6'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M6 18L18 6M6 6l12 12'
                  />
                </svg>
              </button>
            </div>

            {/* Form Section */}
            <div className='mx-auto max-w-sm space-y-4'>
              <CreateAuctionForm
                apartmentId={aptId}
                startingPrice={apartment.rentalPrice}
                onClose={() => {
                  setShowCreateModal(false);
                  setPrefillAuctionRange(null);
                  setSelectedRange(undefined); // Clear calendar selection after modal closes
                  refetch();
                }}
                prefillRange={prefillAuctionRange}
              />
            </div>

            {/* Action Buttons */}
            <div className='mt-8 flex justify-end space-x-4'>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setPrefillAuctionRange(null);
                  setSelectedRange(undefined); 
                }}
                className='rounded-lg bg-gray-100 px-5 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-200'
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ——— See Auction Status Modal ——— */}
      {selectedAuction && (
        <div className='fixed inset-0 z-50 flex min-h-screen items-center justify-center overflow-y-auto bg-black/60 p-4'>
          <div className='relative w-full max-w-2xl scale-95 transform rounded-2xl border-t-4 border-emerald-400 bg-white p-8 shadow-2xl transition-transform duration-300 group-hover:scale-100'>
            <div className='mb-6 flex items-center justify-between'>
              <h2 className='text-2xl font-bold text-gray-800'>
                Auction Status
              </h2>
              <button
                onClick={() => setSelectedAuction(null)}
                className='text-gray-400 hover:text-gray-600'
              >
                <span className='sr-only'>Close</span>
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  className='h-6 w-6'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M6 18L18 6M6 6l12 12'
                  />
                </svg>
              </button>
            </div>
            <AuctionDetails apartmentId={aptId} auctionId={selectedAuction.id} />
            <div className='mt-8 flex justify-end'>
              <button
                onClick={() => setSelectedAuction(null)}
                className='rounded-lg bg-indigo-600 px-6 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700'
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className='fixed inset-0 z-[60] flex min-h-screen items-center justify-center bg-black/60 p-4'>
          <div className='w-full max-w-md rounded-lg bg-white p-6 shadow-xl'>
            <div className='mb-4 flex items-center text-red-600'>
              <AlertTriangle className='mr-2 h-6 w-6' />
              <h3 className='text-xl font-bold'>Delete Apartment</h3>
            </div>

            <div className='mb-6'>
              <p className='mb-4 text-gray-700'>
                Are you sure you want to delete this apartment? This action
                cannot be undone.
              </p>

              <div className='rounded-md bg-red-50 p-4'>
                <p className='text-sm text-red-700'>
                  Type <strong>{apartment.title}</strong> to confirm deletion.
                </p>
              </div>

              <input
                type='text'
                value={deleteConfirmationText}
                onChange={(e) => setDeleteConfirmationText(e.target.value)}
                className='mt-4 w-full rounded-md border border-gray-300 p-2 focus:border-red-500 focus:ring-1 focus:ring-red-500 focus:outline-none'
                placeholder='Type apartment title to confirm'
              />

              {deleteError && (
                <p className='mt-2 text-sm text-red-600'>
                  Error: {deleteError.message}
                </p>
              )}
            </div>

            <div className='flex justify-end gap-4'>
              <button
                onClick={handleCancelDelete}
                className='rounded-md bg-gray-200 px-4 py-2 text-gray-800 hover:bg-gray-300 focus:ring-2 focus:ring-gray-400 focus:outline-none'
                disabled={isDeleting}
              >
                Cancel
              </button>

              <button
                onClick={handleConfirmDelete}
                className={`flex items-center rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700 focus:ring-2 focus:ring-red-400 focus:outline-none ${
                  deleteConfirmationText !== apartment.title || isDeleting
                    ? 'opacity-50'
                    : ''
                }`}
              >
                {isDeleting ? (
                  <>
                    <svg
                      className='mr-2 h-4 w-4 animate-spin'
                      viewBox='0 0 24 24'
                    >
                      <circle
                        className='opacity-25'
                        cx='12'
                        cy='12'
                        r='10'
                        stroke='currentColor'
                        strokeWidth='4'
                        fill='none'
                      />
                      <path
                        className='opacity-75'
                        fill='currentColor'
                        d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                      />
                    </svg>
                    Deleting...
                  </>
                ) : (
                  'Delete Apartment'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      <ReviewSection apartmentId={aptId} />
    </div>
  );
}
