'use client';

import useFetchApartmentPhotos from '@/features/apartment-list/hooks/use-fetch-apartment-photos';
import { Apartment } from '@/features/apartment-list/types/apartment';
import Image from 'next/image';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

export default function ApartmentCard({
  apt,
  isLoading = false,
}: {
  apt: Apartment;
  isLoading?: boolean;
}) {
  // Only fetch photos if we're not in loading state and have a valid apartment ID
  const {
    photos,
    loading: photoLoading,
    error,
  } = isLoading
    ? { photos: null, loading: false, error: null }
    : // eslint-disable-next-line react-hooks/rules-of-hooks
      useFetchApartmentPhotos(apt.id);

  const thumbUrl =
    !photoLoading && photos && photos.length > 0 ? photos[0] : null;

  if (isLoading) {
    return (
      <li className='overflow-hidden rounded-lg border bg-slate-50 shadow'>
        <div className='relative h-48 bg-gray-100'>
          <Skeleton height='100%' />
        </div>
        <div className='bg-slate-50 p-4'>
          <Skeleton height={24} className='mb-2' count={2} />
          <Skeleton height={16} width='70%' className='mb-2' count={2} />

          <Skeleton height={16} width='60%' className='mb-1' />
          <Skeleton height={16} width='40%' className='mb-1' />
          <Skeleton height={16} width='80%' className='mb-1' />

          <div className='mt-2'>
            <Skeleton height={12} width='65%' className='mb-1' />
            <Skeleton height={12} width='50%' />
          </div>
        </div>
      </li>
    );
  }

  return (
    <li className='overflow-hidden rounded-lg border bg-slate-50 shadow transition hover:shadow-lg'>
      <div className='relative flex h-48 items-center justify-center bg-gray-100'>
        {photoLoading ? (
          <div className='h-full w-full'>
            <Skeleton height='100%' />
          </div>
        ) : error ? (
          <span className='text-red-400'>Error loading photo</span>
        ) : thumbUrl ? (
          <Image
            src={thumbUrl}
            alt={apt.title}
            fill
            sizes='100%'
            className='object-cover'
          />
        ) : (
          <span className='text-gray-400'>No photo</span>
        )}
      </div>

      <div className='bg-slate-50 p-4'>
        <h2 className='line-clamp-2 h-12 overflow-hidden text-xl leading-tight font-semibold'>
          {apt.title}
        </h2>
        <p className='mb-2 line-clamp-2 h-10 overflow-hidden text-sm leading-snug text-gray-600'>
          {apt.description}
        </p>

        <p className='mb-1 text-sm'>
          <span className='font-medium'>Price:</span> {apt.rentalPrice} zł/day
        </p>
        <p className='mb-1 text-sm'>
          <span className='font-medium'>Size:</span> {apt.size} m²
        </p>
        <p className='mb-1 text-sm'>
          <span className='font-medium'>Rooms:</span> {apt.numberOfRooms},{' '}
          <span className='font-medium'>Beds:</span> {apt.numberOfBeds}
        </p>

        <div className='flex flex-col gap-0.5'>
          <p className='mt-2 line-clamp-1 text-sm text-gray-500'>
            {apt.address.street}, {apt.address.apartmentNumber}
          </p>
          <p className='text-sm text-gray-500'>
            {apt.address.city}, {apt.address.postalCode}
          </p>
        </div>
      </div>
    </li>
  );
}
