'use client';

import { useFetchOccupiedRanges } from '@/features/apartment/hooks/use-fetch-occupied-ranges';
import CreditCardField from '@/features/auctions/components/form-fields/credit-card-field';
import DateField from '@/features/auctions/components/form-fields/date-field';
import {
  CreateRentalWithPaymentPayload,
  useCreateRentalWithPayment,
} from '@/features/booking/hooks/use-create-rental-with-payment';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSession } from 'next-auth/react';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';
import { useCalculatePrice } from '../hooks/use-calculate-price';

const createRentalWithPaymentSchema = z.object({
  apartmentId: z.number(),
  tenantId: z.number().min(1, 'Tenant ID is required'),
  startDate: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), 'Invalid start date'),
  endDate: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), 'Invalid end date'),
  cardNumber: z
    .string()
    .refine(
      (val) => val.replace(/\D/g, '').length === 10,
      'Card number must be exactly 10 digits',
    ),
});

type FormData = z.infer<typeof createRentalWithPaymentSchema>;

interface Props {
  apartmentId: number;
  prefillRange?: { start: Date; end: Date } | null;
}

interface OccupiedRange {
  startDate: string | Date;
  endDate: string | Date;
}

interface Availability {
  occupiedRanges: OccupiedRange[];
}

interface DisabledDateRange {
  from: Date;
  to: Date;
}

export default function CreateRentalWithPaymentModal({ apartmentId, prefillRange }: Props) {
  const { data: session } = useSession();
  const [showModal, setShowModal] = useState(false);

  const userId = session?.user?.id ? Number(session.user.id) : 0;

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(createRentalWithPaymentSchema),
    mode: 'onChange',
    defaultValues: {
      apartmentId,
      tenantId: userId,
      startDate: prefillRange?.start
        ? prefillRange.start.toISOString().slice(0, 10)
        : new Date().toISOString().slice(0, 10),
      endDate: prefillRange?.end
        ? prefillRange.end.toISOString().slice(0, 10)
        : new Date().toISOString().slice(0, 10),
      cardNumber: '',
    },
  });

  // Update form values if prefillRange changes
  useEffect(() => {
    if (prefillRange) {
      setValue('startDate', prefillRange.start.toISOString().slice(0, 10));
      setValue('endDate', prefillRange.end.toISOString().slice(0, 10));
    }
  }, [prefillRange, setValue]);

  const startDate = watch('startDate');
  const endDate = watch('endDate');
  const {
    data: priceInfo,
    loading: loadingPrice,
    error: priceError,
  } = useCalculatePrice(apartmentId, startDate ? new Date(startDate) : new Date(), endDate ? new Date(endDate) : new Date());

  const { availability } = useFetchOccupiedRanges(apartmentId);

  const pastDatesRange: DisabledDateRange = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset hours to start of day
    return {
      from: new Date(0), // January 1, 1970
      to: new Date(
        today.getDate() === 1
          ? today
          : new Date(today.setDate(today.getDate() - 1)),
      ), // Yesterday or today if it's the first day of the month
    };
  }, []);

  // Process occupied ranges
  const [disabledDateRanges, setDisabledDateRanges] = useState<
    DisabledDateRange[]
  >([pastDatesRange]);

  // Update disabled date ranges when availability changes
  useEffect(() => {
    if (!availability) {
      return;
    }

    try {
      const typedAvailability = availability as Availability;

      if (
        !typedAvailability.occupiedRanges ||
        !Array.isArray(typedAvailability.occupiedRanges)
      ) {
        console.error('Invalid occupiedRanges format:', typedAvailability);
        return;
      }

      const occupiedRanges = typedAvailability.occupiedRanges.map(
        (range: OccupiedRange): DisabledDateRange => {
          const startDate =
            range.startDate instanceof Date
              ? range.startDate
              : new Date(range.startDate);

          const endDate =
            range.endDate instanceof Date
              ? range.endDate
              : new Date(range.endDate);

          return {
            from: startDate,
            to: endDate,
          };
        },
      );

      // Combine past dates with occupied ranges
      setDisabledDateRanges([pastDatesRange, ...occupiedRanges]);
    } catch (error) {
      console.error('Error processing occupied ranges:', error);
      setDisabledDateRanges([pastDatesRange]); // Fallback to just past dates
    }
  }, [availability, pastDatesRange]);

  const { createRentalWithPayment } = useCreateRentalWithPayment();

  // Handle date field changes
  const handleDateChange = (
    fieldName: 'startDate' | 'endDate',
    value: string,
  ) => {
    if (value && !isNaN(Date.parse(value))) {
      setValue(fieldName, value);
    }
  };

  // Update tenantId whenever the session changes
  useEffect(() => {
    if (session?.user?.id) {
      const newUserId = Number(session.user.id);
      setValue('tenantId', newUserId);
    }
  }, [session?.user?.id, setValue]);

  const openModal = () => {
    if (!session) {
      toast.error('Please sign in to create a rental');
      return;
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    reset();
  };

  const onSubmit = async (data: FormData) => {
    if (!session?.accessToken) {
      toast.error('You must be logged in to create a rental');
      return;
    }

    if (!session?.user?.id || data.tenantId <= 0) {
      toast.error(
        'Your user ID could not be retrieved. Please try signing out and back in.',
      );
      return;
    }

    const payload: CreateRentalWithPaymentPayload = {
      rental: {
        apartmentId: data.apartmentId,
        tenantId: data.tenantId,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
      },
      payment: {
        cardNumber: data.cardNumber,
      },
    };

    try {
      const response = await createRentalWithPayment(payload);

      // Check if the response indicates a payment failure
      if (response && response.success === false) {
        toast.error(response.message || 'Payment failed. Please try again.');
        return;
      }

      toast.success('Rental created successfully');
      closeModal();
    } catch (error: unknown) {
      console.error(error);

      interface AxiosErrorResponse {
        response?: {
          data?: {
            message?: string;
          };
        };
        message?: string;
      }

      const err = error as AxiosErrorResponse;

      // Extract error message from API response if available
      if (err.response?.data?.message) {
        toast.error(err.response.data.message);
      } else if (err.message?.includes('declined')) {
        // Fallback for when the error is in the message property
        toast.error(err.message);
      } else {
        // Default error message
        toast.error('Failed to create rental. Please try again.');
      }
    }
  };

  return (
    <>
      <button
        onClick={openModal}
        className='mt-4 w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700'
      >
        Book Apartment Now
      </button>

      {showModal && (
        <div className='fixed inset-0 z-50 flex min-h-screen items-center justify-center overflow-y-auto bg-black/60 p-4'>
          <div className='relative w-full max-w-2xl scale-95 transform rounded-2xl border-t-4 border-emerald-400 bg-white p-8 shadow-2xl transition-transform duration-300 group-hover:scale-100'>
            <div className='mb-6 flex items-center justify-between'>
              <h2 className='text-2xl font-bold text-gray-800'>
                Book Apartment
              </h2>
              <button
                onClick={closeModal}
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

            <form className='space-y-4' onSubmit={handleSubmit(onSubmit)}>
              <input
                type='hidden'
                {...register('apartmentId', { value: apartmentId })}
              />
              <input type='hidden' {...register('tenantId')} />

              <DateField
                name='startDate'
                label='Start Date'
                control={control}
                disabledDateRanges={disabledDateRanges}
                error={errors.startDate}
                onChange={(value) => handleDateChange('startDate', value)}
              />

              <DateField
                name='endDate'
                label='End Date'
                control={control}
                disabledDateRanges={disabledDateRanges}
                error={errors.endDate}
                onChange={(value) => handleDateChange('endDate', value)}
              />

              {/* Price calculation section */}
              <div className='min-h-[150px]'>
                {loadingPrice && (
                  <div className='rounded-lg bg-gray-50 px-4 py-3'>
                    <p className='text-gray-500'>Calculating price...</p>
                  </div>
                )}

                {!loadingPrice && priceInfo && (
                  <div className='rounded-lg border border-blue-100 bg-blue-50 px-5 py-4'>
                    <h3 className='mb-2 font-medium text-blue-900'>
                      Price Details
                    </h3>
                    <div className='grid grid-cols-2 gap-1'>
                      <p className='text-sm text-blue-800'>Number of nights:</p>
                      <p className='text-sm font-medium text-blue-800'>
                        {priceInfo.nights}
                      </p>

                      <p className='text-sm text-blue-800'>Price per night:</p>
                      <p className='text-sm font-medium text-blue-800'>
                        {priceInfo.pricePerNight.toFixed(2)}zł
                      </p>

                      <p className='mt-1 text-base font-semibold text-blue-900'>
                        Total price:
                      </p>
                      <p className='mt-1 text-base font-semibold text-blue-900'>
                        {priceInfo.nights <= 0
                          ? '0.00zł'
                          : `${priceInfo.totalPrice.toFixed(2)}zł`}
                      </p>
                    </div>
                  </div>
                )}

                {priceError && (
                  <div className='rounded-lg bg-red-50 px-4 py-3 text-red-700'>
                    <p>
                      Error calculating price. Please ensure dates are valid.
                    </p>
                  </div>
                )}

                {/* Placeholder when no price info is available */}
                {!loadingPrice && !priceInfo && !priceError && (
                  <div className='rounded-lg bg-gray-50 px-4 py-3'>
                    <p className='text-gray-500'>Select dates to see price</p>
                  </div>
                )}
              </div>

              <CreditCardField
                name='cardNumber'
                label='Card Number'
                register={register}
                error={errors.cardNumber}
              />

              <div className='mt-8 flex justify-end space-x-3'>
                <button
                  type='button'
                  onClick={closeModal}
                  className='rounded-lg bg-gray-200 px-6 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-300'
                >
                  Cancel
                </button>
                <button
                  type='submit'
                  disabled={
                    isSubmitting ||
                    loadingPrice ||
                    !priceInfo ||
                    priceInfo?.totalPrice <= 0 ||
                    priceInfo?.nights <= 0
                  }
                  className='rounded-lg bg-indigo-600 px-6 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50'
                >
                  {isSubmitting
                    ? 'Submitting…'
                    : 'Book for ' +
                      (priceInfo && priceInfo.nights > 0
                        ? `${priceInfo.totalPrice.toFixed(2)} zł`
                        : '0.00 zł')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
