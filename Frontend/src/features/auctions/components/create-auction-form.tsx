'use client';

import { useFetchOccupiedRanges } from '@/features/apartment/hooks/use-fetch-occupied-ranges';
import { zodResolver } from '@hookform/resolvers/zod';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import { env } from 'next-runtime-env';
import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import {
  CreateAuctionData,
  createAuctionSchema,
} from '../schemas/create-auction-schema';
import {
  getDisabledDateRanges,
  toLocalDateTimeString,
} from '../utils/date-utils';
import DateField from './form-fields/date-field';
import DateTimeField from './form-fields/date-time-field';
import NumberField from './form-fields/number-field';
import SubmitButton from './form-fields/submit-button';

const baseURL = env('NEXT_PUBLIC_API_BASE_URL')!;
const apiClient = axios.create({ baseURL });

interface Props {
  apartmentId: number;
  startingPrice: number;
  onClose: () => void;
  prefillRange?: { start: Date; end: Date } | null;
}

export default function CreateAuctionForm({
  apartmentId,
  startingPrice,
  onClose,
  prefillRange,
}: Props) {
  const { data: session } = useSession();
  const nowIso = toLocalDateTimeString(new Date());

  const { availability } = useFetchOccupiedRanges(apartmentId);

  const {
    control,
    register,
    handleSubmit,
    setValue,
    formState: { errors, isValid, isSubmitting },
  } = useForm<CreateAuctionData>({
    resolver: zodResolver(createAuctionSchema),
    mode: 'onChange',
    defaultValues: {
      apartmentId,
      startTime: nowIso,
      endTime: nowIso,
      startingPrice,
    },
  });

  // If prefillRange changes, update the form values
  useEffect(() => {
    if (prefillRange) {
      setValue('startTime', toLocalDateTimeString(prefillRange.start));
      setValue('endTime', toLocalDateTimeString(prefillRange.end));
    }
  }, [prefillRange, setValue]);

  const onSubmit = async (data: CreateAuctionData) => {
    try {
      await apiClient.post('/auctions', data, {
        headers: session?.accessToken
          ? { Authorization: `Bearer ${session.accessToken}` }
          : undefined,
      });
      toast.success('Auction created successfully');
      onClose();
    } catch {
      toast.error('Failed to create auction');
    }
  };

  const disabledRanges = useMemo(() => {
    return getDisabledDateRanges(availability?.occupiedRanges);
  }, [availability]);

  return (
    <form className='space-y-4' onSubmit={handleSubmit(onSubmit)}>
      <input type='hidden' {...register('apartmentId')} />

      <DateTimeField
        name='startTime'
        label='Start Time'
        control={control}
        error={errors.startTime}
        disabledDateRanges={disabledRanges}
      />

      <DateTimeField
        name='endTime'
        label='End Time'
        control={control}
        error={errors.endTime}
        disabledDateRanges={disabledRanges}
      />

      <NumberField
        name='startingPrice'
        label='Starting Price (zł)'
        register={register}
        error={errors.startingPrice}
        step='1'
      />

      <NumberField
        name='minimumBidIncrement'
        label='Minimum Bid Increment (zł)'
        register={register}
        error={errors.minimumBidIncrement}
        step='1'
      />

      <DateField
        name='rentalStartDate'
        label='Rental Start Date'
        control={control}
        error={errors.rentalStartDate}
        disabledDateRanges={disabledRanges}
      />

      <DateField
        name='rentalEndDate'
        label='Rental End Date'
        control={control}
        error={errors.rentalEndDate}
        disabledDateRanges={disabledRanges}
      />

      <NumberField
        name='maxBidders'
        label='Max Bidders'
        register={register}
        error={errors.maxBidders}
      />

      <SubmitButton
        isValid={isValid}
        isSubmitting={isSubmitting}
        label='Create Auction'
        submittingLabel='Creating Auction…'
      />
    </form>
  );
}
