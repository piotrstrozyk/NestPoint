'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  AlertCircle,
  ArrowLeft,
  Ban,
  Building,
  Home,
  ImagePlus,
  Loader2,
  MapPin,
  Save,
  X,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';

import { PhotoUploader } from '@/features/add-apartment/components/photo-uploader';
import useFetchOwners from '@/features/add-apartment/hooks/use-fetch-owners';
import {
  ApartmentForm,
  ApartmentSchema,
} from '@/features/add-apartment/schemas/add-apartment';
import useFetchApartmentPhotos, {
  Photo,
} from '@/features/apartment-list/hooks/use-fetch-apartment-photos';
import useFetchApartment from '@/features/apartment/hooks/use-fetch-apartment';
import useDeleteApartmentPhoto from '@/features/owner/hooks/use-delete-apartment-photo';
import usePostApartmentPhoto from '@/features/owner/hooks/use-post-apartment-photo';
import { useUpdateApartment } from '@/features/owner/hooks/use-update-apartment';
import { AddressFieldset } from '../components/edit-apartment/address-fieldset';
import { AmenitiesCheckboxes } from '../components/edit-apartment/amenities-checkboxes';
import { NumericInputs } from '../components/edit-apartment/numeric-inputs';
import { SelectFields } from '../components/edit-apartment/select-fields';
import { SuccessState } from '../components/edit-apartment/success-state';
import { TitleDescription } from '../components/edit-apartment/title-description';

export default function EditApartmentPage() {
  const { id } = useParams();
  const aptId = Number(id);
  const router = useRouter();
  const initialPhotosSet = useRef(false);

  const {
    apartment,
    loading: aptLoading,
    error: aptError,
    refetch: refetchApartment,
  } = useFetchApartment(aptId);

  const {
    photos = [],
    photoObjects = [],
    loading: photosLoading,
    error: photosError,
  } = useFetchApartmentPhotos(aptId);

  const { data: session } = useSession();
  const isOwner = apartment && session?.user?.id === apartment.ownerId;
  const isAdmin = session?.user?.role?.includes('ADMIN');

  const {
    owners,
    loading: ownersLoading,
    error: ownersError,
  } = useFetchOwners();
  const { postPhoto } = usePostApartmentPhoto(); // Hook for adding photos
  const { deletePhoto, loading: deleteLoading } = useDeleteApartmentPhoto(); // Hook for deleting photos
  const { updateApartment } = useUpdateApartment();

  const [ownerId, setOwnerId] = useState<number | null>(null);
  const [selectedPhotos, setSelectedPhotos] = useState<File[]>([]);
  const [existingPhotos, setExistingPhotos] = useState<string[]>([]);
  const [existingPhotoObjects, setExistingPhotoObjects] = useState<Photo[]>([]);
  const [photosToDelete, setPhotosToDelete] = useState<number[]>([]);

  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [photoUploadErrors, setPhotoUploadErrors] = useState<string[]>([]);
  const [photoDeleteErrors, setPhotoDeleteErrors] = useState<string[]>([]);

  const formMethods = useForm<ApartmentForm>({
    resolver: zodResolver(ApartmentSchema),
    defaultValues: {},
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = formMethods;

  // Reset form with apartment data when available
  useEffect(() => {
    if (apartment) {
      reset({
        title: apartment.title,
        description: apartment.description,
        address: {
          apartmentNumber: apartment.address.apartmentNumber,
          street: apartment.address.street,
          city: apartment.address.city,
          postalCode: apartment.address.postalCode,
          country: apartment.address.country,
        },
        size: apartment.size,
        rentalPrice: apartment.rentalPrice,
        numberOfRooms: apartment.numberOfRooms,
        numberOfBeds: apartment.numberOfBeds,
        furnished: apartment.furnished,
        wifi: apartment.wifi,
        petsAllowed: apartment.petsAllowed,
        parkingSpace: apartment.parkingSpace,
        disabilityFriendly: apartment.disabilityFriendly,
        poolFee: apartment.poolFee,
        kitchen: apartment.kitchen,
        yardAccess: apartment.yardAccess,
        poolAccess: apartment.poolAccess,
        propertyType: apartment.propertyType,
        ownerId: apartment.ownerId,
      });
    }
  }, [apartment, reset]);

  // Set existing photos when they load
  useEffect(() => {
    // Only proceed if not loading and we haven't set photos yet
    if (!photosLoading && !initialPhotosSet.current) {
      // Check if we have photo data
      if (photos && photos.length > 0) {
        setExistingPhotos(photos);
      }

      if (photoObjects && photoObjects.length > 0) {
        setExistingPhotoObjects(photoObjects);
      }

      // Only mark as initialized if we've received data
      if (
        (photos && photos.length > 0) ||
        (photoObjects && photoObjects.length > 0)
      ) {
        initialPhotosSet.current = true;
      }
    }
  }, [photos, photoObjects, photosLoading]);

  // Pre-fill ownerId
  useEffect(() => {
    if (owners && session?.user?.name) {
      const me = owners.find((o) => o.username === session.user.name);
      if (me) {
        setValue('ownerId', me.id);
        setOwnerId(me.id);
      }
    }
  }, [owners, session?.user?.name, setValue]);

  // Loading state
  if (aptLoading || photosLoading || ownersLoading) {
    return (
      <div className='-mt-16 flex min-h-screen flex-col items-center justify-center'>
        <Loader2 className='text-primary mb-4 h-12 w-12 animate-spin' />
        <p className='text-lg text-gray-600'>
          Loading apartment information...
        </p>
      </div>
    );
  }

  // Error state
  if (aptError || photosError || ownersError) {
    return (
      <div className='-mt-16 flex min-h-screen flex-col items-center justify-center'>
        <AlertCircle className='mb-4 h-16 w-16 text-red-500' />
        <p className='mb-2 text-xl font-semibold text-red-600'>
          Error loading data
        </p>
        <p className='mb-4 text-gray-600'>
          We couldn&apos;t load the apartment information. Please try again
          later.
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

  // Success state
  if (success) {
    return <SuccessState aptId={aptId} router={router} />;
  }

  // Handle removing an existing photo
  const handleRemoveExistingPhoto = (photoUrl: string) => {
    // Find the photo object with the matching URL
    const photoToDelete = existingPhotoObjects.find((p) => p.url === photoUrl);

    if (photoToDelete) {
      // Remove from displayed photos
      setExistingPhotos(existingPhotos.filter((url) => url !== photoUrl));
      // Add ID to the list of photos to delete
      setPhotosToDelete((prev) => [...prev, photoToDelete.id]);
    } else {
      console.error('Could not find photo object for URL:', photoUrl);
    }
  };

  // Upload multiple photos using the hook
  const uploadPhotos = async (files: File[]) => {
    if (!files.length) return [];

    const results = [];
    const errors = [];

    for (const file of files) {
      try {
        const result = await postPhoto(aptId, file);
        results.push(result);
      } catch (error) {
        console.error(`Error uploading ${file.name}:`, error);
        errors.push(file.name);
      }
    }

    if (errors.length > 0) {
      setPhotoUploadErrors(errors);
    }

    return results;
  };

  const onSubmit = async (data: ApartmentForm) => {
    // Only require ownerId for owners, not admins
    if (!session?.accessToken || (!isAdmin && !ownerId)) {
      return console.error('Auth or owner missing');
    }

    try {
      setSubmitting(true);
      setPhotoUploadErrors([]);
      setPhotoDeleteErrors([]);

      // Update the apartment data
      await updateApartment(aptId, data);

      // Delete photos that were marked for deletion using the hook
      const deleteErrors = [];

      for (const photoId of photosToDelete) {
        try {
          await deletePhoto(aptId, photoId);
        } catch (error) {
          console.error(`Error deleting photo ID ${photoId}:`, error);
          deleteErrors.push(`Photo ID ${photoId}`);
        }
      }

      if (deleteErrors.length > 0) {
        setPhotoDeleteErrors(deleteErrors);
      }

      // Upload new photos
      if (selectedPhotos.length > 0) {
        await uploadPhotos(selectedPhotos);
      }

      // Refetch apartment info after successful edit
      await refetchApartment();

      // Set success state
      if (photoUploadErrors.length === 0 && photoDeleteErrors.length === 0) {
        setSuccess(true);
      }
    } catch (e) {
      console.error('Submission error', e);
    } finally {
      setSubmitting(false);
    }
  };

  // Place unauthorized check here, after all hooks
  if (!aptLoading && !photosLoading && apartment && !(isOwner || isAdmin)) {
    return (
      <div className='flex min-h-screen flex-col items-center justify-center'>
        <AlertCircle className='mb-4 h-16 w-16 text-red-500' />
        <p className='mb-2 text-xl font-semibold text-red-600'>Unauthorized</p>
        <p className='mb-4 text-gray-600'>
          You do not have permission to edit this apartment.
        </p>
        <button
          onClick={() => router.push('/')}
          className='rounded-lg bg-red-600 px-4 py-2 text-white transition hover:bg-red-700'
        >
          Go Home
        </button>
      </div>
    );
  }

  return (
    <div className='bg-background-primary mt-24 px-4 py-12 sm:px-6 lg:px-8'>
      <div className='mx-auto max-w-4xl'>
        <div className='mb-8'>
          <button
            onClick={() => router.back()}
            className='hover:text-primary mb-4 flex items-center text-gray-600 transition'
          >
            <ArrowLeft className='mr-1 h-4 w-4' />
            <span>Back</span>
          </button>

          <div className='text-center'>
            <Home className='text-primary mx-auto mb-4 h-12 w-12' />
            <h1 className='text-3xl font-extrabold text-gray-900 sm:text-4xl'>
              Edit Apartment
            </h1>
            <p className='mt-2 text-lg text-gray-600'>
              Update the details of your property listing
            </p>
          </div>
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
                    watch={watch}
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

            {/* Photo Management Section */}
            <section className='space-y-4'>
              <h2 className='flex items-center text-xl font-semibold text-gray-800'>
                <ImagePlus className='text-primary mr-2 inline-block h-5 w-5' />
                Photos
              </h2>

              {/* Existing Photos */}
              {/* Existing Photos */}
              {existingPhotos.length > 0 && (
                <div className='mb-4 rounded-lg border border-gray-200 bg-gray-50 p-5'>
                  <div className='mb-4 flex items-center justify-between'>
                    <h3 className='font-medium text-gray-700'>
                      Current Photos
                    </h3>
                    {photosToDelete.length > 0 && (
                      <span className='text-sm text-amber-600'>
                        {photosToDelete.length}{' '}
                        {photosToDelete.length === 1 ? 'photo' : 'photos'}{' '}
                        marked for deletion
                      </span>
                    )}
                  </div>

                  <div className='grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4'>
                    {existingPhotos.map((photoUrl, idx) => {
                      const isMarkedForDeletion = photosToDelete.includes(
                        existingPhotoObjects.find((p) => p.url === photoUrl)
                          ?.id || -1,
                      );

                      return (
                        <div
                          key={idx}
                          className={`group relative overflow-hidden rounded-lg border ${
                            isMarkedForDeletion
                              ? 'border-red-300 opacity-50'
                              : 'border-gray-200'
                          }`}
                        >
                          <div className='aspect-w-4 aspect-h-3 w-full'>
                            <Image
                              src={photoUrl}
                              alt={`Apartment photo ${idx + 1}`}
                              width={200}
                              height={150}
                              className='h-full w-full object-cover'
                            />
                          </div>
                          <div className='bg-opacity-40 absolute inset-0 flex items-center justify-center bg-black opacity-0 transition-opacity group-hover:opacity-100'>
                            <button
                              type='button'
                              onClick={() =>
                                handleRemoveExistingPhoto(photoUrl)
                              }
                              className='rounded-full bg-white p-1.5 text-gray-900 hover:bg-red-100 hover:text-red-700'
                              disabled={deleteLoading}
                            >
                              <X className='h-4 w-4' />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Add New Photos */}
              <div className='rounded-lg border border-gray-200 bg-gray-50 p-5'>
                <h3 className='mb-3 font-medium text-gray-700'>
                  Add New Photos
                </h3>
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
                  onClear={() => setSelectedPhotos([])}
                />

                {selectedPhotos.length > 0 && (
                  <p className='mt-2 text-sm text-green-600'>
                    {selectedPhotos.length} new{' '}
                    {selectedPhotos.length === 1 ? 'photo' : 'photos'} selected
                  </p>
                )}
              </div>

              {/* Photo upload errors if any */}
              {photoUploadErrors.length > 0 && (
                <div className='rounded-md border-l-4 border-red-500 bg-red-50 p-4'>
                  <div className='flex'>
                    <div className='flex-shrink-0'>
                      <AlertCircle className='h-5 w-5 text-red-400' />
                    </div>
                    <div className='ml-3'>
                      <h3 className='text-sm font-medium text-red-800'>
                        Failed to upload {photoUploadErrors.length}{' '}
                        {photoUploadErrors.length === 1 ? 'photo' : 'photos'}
                      </h3>
                      <div className='mt-2 text-sm text-red-700'>
                        <ul className='list-disc pl-5'>
                          {photoUploadErrors.map((fileName, index) => (
                            <li key={index}>{fileName}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Photo deletion errors if any */}
              {photoDeleteErrors.length > 0 && (
                <div className='rounded-md border-l-4 border-red-500 bg-red-50 p-4'>
                  <div className='flex'>
                    <div className='flex-shrink-0'>
                      <AlertCircle className='h-5 w-5 text-red-400' />
                    </div>
                    <div className='ml-3'>
                      <h3 className='text-sm font-medium text-red-800'>
                        Failed to delete {photoDeleteErrors.length}{' '}
                        {photoDeleteErrors.length === 1 ? 'photo' : 'photos'}
                      </h3>
                      <div className='mt-2 text-sm text-red-700'>
                        <ul className='list-disc pl-5'>
                          {photoDeleteErrors.map((errorItem, index) => (
                            <li key={index}>{errorItem}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Photo management notes */}
              <div className='rounded-md border-l-4 border-blue-500 bg-blue-50 p-4'>
                <div className='flex'>
                  <div className='flex-shrink-0'>
                    <svg
                      className='h-5 w-5 text-blue-400'
                      viewBox='0 0 20 20'
                      fill='currentColor'
                    >
                      <path
                        fillRule='evenodd'
                        d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z'
                        clipRule='evenodd'
                      />
                    </svg>
                  </div>
                  <div className='ml-3'>
                    <p className='text-sm text-blue-700'>
                      Changes to photos will be applied when you save the form.
                      Removed photos cannot be recovered.
                    </p>
                  </div>
                </div>
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
              disabled={submitting || isSubmitting}
              className='bg-primary flex w-full items-center justify-center rounded-lg border border-transparent px-5 py-3 text-base font-medium text-white transition hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50'
            >
              {submitting || isSubmitting ? (
                <>
                  <Loader2 className='mr-2 -ml-1 h-4 w-4 animate-spin text-white' />
                  Saving Changes...
                </>
              ) : (
                <>
                  <Save className='mr-2 h-5 w-5' />
                  Save Changes
                </>
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
