'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import ImageGallery from 'react-image-gallery';
import 'react-image-gallery/styles/css/image-gallery.css';

import useFetchApartmentPhotos from '@/features/apartment-list/hooks/use-fetch-apartment-photos';
import { Apartment } from '@/features/apartment-list/types/apartment';

interface ApartmentPopupProps {
  apt: Apartment;
}

export default function ApartmentPopup({ apt }: ApartmentPopupProps) {
  const { photos, loading, error } = useFetchApartmentPhotos(apt.id);

  const galleryItems =
    photos?.map((url) => ({
      original: url,
      thumbnail: url,
    })) || [];

  return (
    <div className='w-64 overflow-hidden rounded-lg bg-white shadow-lg'>
      {/* Gallery */}
      {loading ? (
        <p className='p-4 text-sm text-gray-500'>Loading…</p>
      ) : error ? (
        <p className='p-4 text-sm text-red-600'>Failed to load photos.</p>
      ) : galleryItems.length > 0 ? (
        <div className='relative h-40 w-full overflow-hidden'>
          <ImageGallery
            items={galleryItems}
            showPlayButton={false}
            showFullscreenButton={false}
            showThumbnails={false}
            showBullets={false}
            additionalClass='overflow-hidden rounded-t-lg w-full h-40'
            lazyLoad
            renderItem={(item) => (
              <div className='relative h-40 w-full overflow-hidden'>
                <Image
                  src={item.original}
                  alt={item.originalAlt || 'Apartment photo'}
                  fill
                  className='h-full w-full object-cover'
                  sizes='256px'
                  style={{ objectFit: 'cover' }}
                  priority={false}
                />
              </div>
            )}
            renderLeftNav={(onClick) => (
              <button
                onClick={onClick}
                className='absolute top-1/2 left-2 z-50 flex -translate-y-1/2 items-center justify-center rounded-full bg-gray-800/50 p-1 shadow hover:bg-gray-800'
                style={{ width: 32, height: 32 }}
                aria-label='Previous slide'
              >
                <ChevronLeft size={20} stroke='white' />
              </button>
            )}
            renderRightNav={(onClick) => (
              <button
                onClick={onClick}
                aria-label='Next slide'
                className='absolute top-1/2 right-2 z-50 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-gray-800/50 shadow hover:bg-gray-800'
              >
                <ChevronRight size={20} stroke='white' />
              </button>
            )}
          />
        </div>
      ) : (
        <div className='flex h-40 w-full items-center justify-center bg-gray-200 text-gray-500'>
          No image
        </div>
      )}

      {/* Details */}
      <div className='space-y-1 p-4'>
        <h3
          className='line-clamp-2 overflow-hidden text-lg font-semibold text-ellipsis text-gray-800'
          title={apt.title}
        >
          {apt.title}
        </h3>

        <p className='text-base font-bold text-indigo-600'>
          {apt.rentalPrice} zł
        </p>

        <p className='text-sm text-gray-500'>
          {apt.numberOfRooms} {apt.numberOfRooms === 1 ? 'room' : 'rooms'}{' '}
          &bull; {apt.size} m² &bull;{' '}
          {apt.propertyType.charAt(0) + apt.propertyType.slice(1).toLowerCase()}
        </p>

        <Link
          href={`/apartment/${apt.id}`}
          className='mt-2 inline-block text-sm font-medium text-indigo-600 hover:underline'
        >
          View Details →
        </Link>
      </div>
    </div>
  );
}
