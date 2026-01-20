'use client';

import { Apartment } from '@/features/apartment-list/types/apartment';
import dynamic from 'next/dynamic';
import type { FC } from 'react';
import { useEffect, useState } from 'react';
import { AiOutlineClose } from 'react-icons/ai';
import { FaMapMarkerAlt } from 'react-icons/fa';

type AddressPickerMapProps = {
  position?: [number, number];
  zoom: number;
  apt?: Apartment;
  apartments?: Apartment[] | null;
  fallbackCenter?: [number, number];
  onAddressChange?: (
    address: {
      street: string;
      apartmentNumber: string;
      city: string;
      postalCode: string;
      country: string;
      fullAddress: string;
    } | null,
  ) => void;
};

const AddressPickerMap = dynamic<AddressPickerMapProps>(
  () =>
    import('./address-picker-map').then(
      (mod) => mod.default as FC<AddressPickerMapProps>,
    ),
  {
    ssr: false,
    loading: () => (
      <div className='flex h-full w-full items-center justify-center text-gray-500'>
        Loading map…
      </div>
    ),
  },
);

export type PickerMapModalProps = {
  /** called when user clicks “Select this address” */
  onSelectAddress: (address: {
    street: string;
    apartmentNumber: string;
    city: string;
    postalCode: string;
    country: string;
    fullAddress: string;
  }) => void;
};

export default function PickerMapModal({
  onSelectAddress,
}: PickerMapModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  const [pickedAddress, setPickedAddress] = useState<{
    street: string;
    apartmentNumber: string;
    city: string;
    postalCode: string;
    country: string;
    fullAddress: string;
  } | null>(null);

  const close = () => {
    setIsOpen(false);
  };

  // Close modal on Escape
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      window.addEventListener('keydown', onKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen]);

  return (
    <>
      {/* “View Map” button */}
      <div className='flex justify-end'>
        <button
          type='button'
          onClick={() => setIsOpen(true)}
          className={`inline-flex items-center rounded border border-indigo-600 bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:opacity-50`}
        >
          <div className='flex items-center justify-between'>
            Pick on Map <FaMapMarkerAlt className='mr-1 ml-3 h-5 w-5' />
          </div>
        </button>
      </div>

      {isOpen && (
        <div className='fixed inset-0 z-50 flex h-full items-center justify-center bg-black/50'>
          <div className='relative flex h-[90vh] w-[100vw] max-w-7xl flex-col rounded-lg bg-white shadow-xl'>
            {/* Close “×” button */}
            <button
              type='button'
              onClick={close}
              aria-label='Close map modal'
              className='absolute top-3 right-3 z-10 rounded-full bg-white p-2 shadow hover:bg-gray-100 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none'
            >
              <AiOutlineClose className='h-4 w-4 text-gray-700' />
            </button>

            {/* Map area */}
            <div className='flex-1'>
              <AddressPickerMap
                zoom={7}
                fallbackCenter={[52.2297, 21.0122]} // Warsaw fallback
                onAddressChange={setPickedAddress}
              />
            </div>
            {/* “Select this address” button */}
            <div className='flex justify-end border-t p-4'>
              <button
                type='button'
                disabled={!pickedAddress}
                onClick={() => {
                  if (pickedAddress) {
                    onSelectAddress(pickedAddress);
                    close();
                  }
                }}
                className='inline-flex items-center rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700 focus:ring disabled:opacity-50'
              >
                Select this address
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
