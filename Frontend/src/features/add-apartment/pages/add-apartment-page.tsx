'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  AlertCircle,
  Ban,
  Building,
  CheckCircle,
  Home,
  Loader2,
  MapPin,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

import { createApartment } from '@/features/add-apartment/hooks/use-create-apartment';
import useFetchOwners from '@/features/add-apartment/hooks/use-fetch-owners';
import {
  ApartmentForm,
  ApartmentSchema,
} from '@/features/add-apartment/schemas/add-apartment';

import { AddressFieldset } from '../components/address-fieldset';
import { AmenitiesCheckboxes } from '../components/amenities-checkboxes';
import { NumericInputs } from '../components/numeric-inputs';
import { PhotoUploader } from '../components/photo-uploader';
import { SelectFields } from '../components/select-fields';
import { TitleDescription } from '../components/title-description';

export default function AddApartmentPage() {
  const { data: session } = useSession();
  const { owners, loading, error } = useFetchOwners();
  const router = useRouter();

  const [ownerId, setOwnerId] = useState<number | null>(null);
  const [selectedPhotos, setSelectedPhotos] = useState<File[]>([]);
  const [success, setSuccess] = useState(false);

  const clearAllPhotos = () => setSelectedPhotos([]);

  const formMethods = useForm<ApartmentForm>({
    resolver: zodResolver(ApartmentSchema),
    defaultValues: {
      title: '',
      description: '',
      address: {
        apartmentNumber: null,
        street: '',
        city: '',
        postalCode: '',
        country: '',
      },
      size: 10,
      rentalPrice: 100,
      numberOfRooms: 1,
      numberOfBeds: 1,
      furnished: false,
      wifi: false,
      petsAllowed: false,
      parkingSpace: false,
      disabilityFriendly: false,
      poolFee: 0,
      kitchen: 'PRIVATE',
      yardAccess: 'NONE',
      poolAccess: 'NONE',
      propertyType: 'APARTMENT',
      ownerId: 0,
    },
  });
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = formMethods;

  // pre-fill ownerId
  useEffect(() => {
    if (owners && session?.user?.name) {
      const me = owners.find((o) => o.username === session.user.name);
      if (me) {
        setOwnerId(me.id);
        setValue('ownerId', me.id);
      }
    }
  }, [owners, session?.user?.name, setValue]);

  // Loading and error states with improved styling
  if (loading) {
    return (
      <div className='-mt-16 flex min-h-screen flex-col items-center justify-center'>
        <Loader2 className='text-primary mb-4 h-12 w-12 animate-spin' />
        <p className='text-lg text-gray-600'>Loading owner information...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className='-mt-16 flex min-h-screen flex-col items-center justify-center'>
        <AlertCircle className='mb-4 h-16 w-16 text-red-500' />
        <p className='mb-2 text-xl font-semibold text-red-600'>
          Error loading owner data
        </p>
        <p className='mb-4 text-gray-600'>
          We couldn&apos;t load your owner information. Please try again later.
        </p>
        <button
          onClick={() => window.location.reload()}
          className='rounded-lg bg-red-600 px-4 py-2 text-white transition hover:bg-red-700'
        >
          Try Again
        </button>
      </div>
    );
  }

  if (success) {
    return (
      <div className='-mt-16 flex min-h-screen flex-col items-center justify-center'>
        <div className='w-full max-w-md rounded-lg bg-white p-8 text-center shadow-lg'>
          <CheckCircle className='mx-auto mb-4 h-16 w-16 text-green-500' />
          <h2 className='mb-2 text-2xl font-bold text-gray-800'>Success!</h2>
          <p className='mb-6 text-green-600'>
            Your apartment has been successfully created.
          </p>
          <div className='flex justify-center gap-4'>
            <button
              onClick={() => router.push('/apartment-list')}
              className='bg-primary rounded-lg px-6 py-2 text-white transition hover:bg-indigo-700'
            >
              View All Apartments
            </button>
            <button
              onClick={() => {
                setSuccess(false);
                setSelectedPhotos([]);
                formMethods.reset();
              }}
              className='rounded-lg border border-gray-300 px-6 py-2 transition hover:bg-gray-50'
            >
              Add Another Apartment
            </button>
          </div>
        </div>
      </div>
    );
  }

  const onSubmit = async (data: ApartmentForm) => {
    if (!session?.accessToken || !ownerId)
      return console.error('Auth or owner missing');
    try {
      await createApartment(session.accessToken, data, selectedPhotos);
      setSuccess(true);
    } catch (e) {
      console.error('Submission error', e);
    }
  };

  return (
    <div className='bg-background-primary mt-18 px-4 py-12 sm:px-6 lg:px-8'>
      <div className='mx-auto max-w-4xl'>
        <div className='mb-8 text-center'>
          <Home className='text-primary mx-auto mb-4 h-12 w-12' />
          <h1 className='text-3xl font-extrabold text-gray-900 sm:text-4xl'>
            Add New Apartment
          </h1>
          <p className='mt-2 text-lg text-gray-600'>
            Fill in the details to list your property for rent
          </p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className='space-y-8 overflow-hidden rounded-lg bg-white shadow'
        >
          <div className='space-y-8 px-6 py-8'>
            {/* Title & Description Section */}
            <section className='space-y-4'>
              <h2 className='flex items-center text-xl font-semibold text-gray-800'>
                <Building className='text-primary mr-2 inline-block h-5 w-5' />
                Basic Information
              </h2>
              <div className='rounded-lg border border-gray-200 bg-gray-50 p-5'>
                <TitleDescription register={register} errors={errors} />
              </div>
            </section>

            {/* Pricing & Dimensions Section */}
            <section className='space-y-4'>
              <h2 className='flex items-center text-xl font-semibold text-gray-800'>
                <svg
                  className='text-primary mr-2 inline-block h-5 w-5'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M19 9l-7 7-7-7'
                  />
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M12 17l-7-7m0 0l7-7m-7 7h18'
                  />
                </svg>
                Pricing & Dimensions
              </h2>
              <div className='rounded-lg border border-gray-200 bg-gray-50 p-5'>
                <NumericInputs register={register} errors={errors} />
              </div>
            </section>

            {/* Amenities & Features Section */}
            <section className='space-y-4'>
              <h2 className='flex items-center text-xl font-semibold text-gray-800'>
                <svg
                  className='text-primary mr-2 inline-block h-5 w-5'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M5 13l4 4L19 7'
                  />
                </svg>
                Amenities & Property Type
              </h2>
              <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
                <div className='rounded-lg border border-gray-200 bg-gray-50 p-5'>
                  <h3 className='mb-3 font-medium text-gray-700'>
                    Available Amenities
                  </h3>
                  <AmenitiesCheckboxes register={register} errors={errors} />
                </div>
                <div className='rounded-lg border border-gray-200 bg-gray-50 p-5'>
                  <h3 className='mb-3 font-medium text-gray-700'>
                    Property Details
                  </h3>
                  <SelectFields
                    register={register}
                    errors={errors}
                    watch={watch} // Pass the watch function
                  />
                </div>
              </div>
            </section>

            {/* Address Section */}
            <section className='space-y-4'>
              <h2 className='flex items-center text-xl font-semibold text-gray-800'>
                <MapPin className='text-primary mr-2 inline-block h-5 w-5' />
                Location
              </h2>
              <div className='rounded-lg border border-gray-200 bg-gray-50 p-5'>
                <AddressFieldset
                  register={register}
                  errors={errors.address!}
                  setValue={setValue}
                />
              </div>
            </section>

            {/* Photo Upload Section */}
            <section className='space-y-4'>
              <h2 className='flex items-center text-xl font-semibold text-gray-800'>
                <svg
                  className='text-primary mr-2 inline-block h-5 w-5'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'
                  />
                </svg>
                Photos
              </h2>
              <div className='rounded-lg border border-gray-200 bg-gray-50 p-5'>
                <PhotoUploader
                  selectedPhotos={selectedPhotos}
                  onAdd={(files) =>
                    setSelectedPhotos((prev) => [...prev, ...files])
                  }
                  onRemove={(idx) =>
                    setSelectedPhotos((prev) =>
                      prev.filter((_, i) => i !== idx),
                    )
                  }
                  onClear={clearAllPhotos}
                />

                {selectedPhotos.length === 0 && (
                  <p className='mt-2 text-sm text-gray-500'>
                    Adding photos significantly increases interest in your
                    property.
                  </p>
                )}

                {selectedPhotos.length > 0 && (
                  <p className='mt-2 text-sm text-green-600'>
                    {selectedPhotos.length}{' '}
                    {selectedPhotos.length === 1 ? 'photo' : 'photos'} selected
                  </p>
                )}
              </div>
            </section>
          </div>

          {/* Form Controls */}
          <div className='space-y-4 px-6 pb-8'>
            {Object.keys(errors).length > 0 && (
              <div className='rounded-md border-l-4 border-red-500 bg-red-50 p-4'>
                <div className='flex items-center'>
                  <Ban className='mr-2 h-5 w-5 text-red-500' />
                  <p className='text-sm text-red-700'>
                    Please correct the errors before submitting the form.
                  </p>
                </div>
              </div>
            )}

            <button
              type='submit'
              disabled={isSubmitting}
              className='bg-primary flex w-full items-center justify-center rounded-lg border border-transparent px-5 py-3 text-base font-medium text-white transition hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50'
            >
              {isSubmitting ? (
                <>
                  <Loader2 className='mr-2 -ml-1 h-4 w-4 animate-spin text-white' />
                  Creating Apartment...
                </>
              ) : (
                'Create Apartment'
              )}
            </button>

            <div className='text-center'>
              <p className='text-xs text-gray-500'>
                By submitting, you agree to our terms and conditions for listing
                properties.
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
