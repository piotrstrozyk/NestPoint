'use client';

import { formatDate } from '@/core/lib/utils/format-date';
import ApartmentCard from '@/features/apartment-list/components/apartment-card';
import useFetchOwner from '@/features/owner/hooks/use-fetch-owner-details';
import useFetchOwnerRentals, {
  Rental,
} from '@/features/owner/hooks/use-fetch-owner-rentals';
import useFetchRentals from '@/features/owner/hooks/use-fetch-rentals';
import {
  BadgeCheck,
  Building,
  Calendar,
  ChevronDown,
  Home,
  Loader2,
  Mail,
  Phone,
  Shield,
  User,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import DayRangePicker from '@/core/components/calendar/calendar';

// Tab options for the profile
type ProfileTab = 'apartments' | 'rentals' | 'calendar';

// Filter options for rental status
type RentalStatusFilter =
  | 'ALL'
  | 'PENDING'
  | 'ACTIVE'
  | 'COMPLETED'
  | 'CANCELLED';

// Define a minimal Apartment type for ownedApartments
interface OwnedApartment {
  id: number;
  title?: string;
}

export default function OwnerProfilePage() {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession({
    required: true,
    onUnauthenticated() {
      // Redirect to login if not authenticated
      router.push('/auth/login?callbackUrl=/owner/profile');
    },
  });

  // State for active tab and rental status filter
  const [activeTab, setActiveTab] = useState<ProfileTab>('apartments');
  const [rentalStatusFilter, setRentalStatusFilter] =
    useState<RentalStatusFilter>('ALL');
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);
  // State for calendar tab
  const [selectedApartmentId, setSelectedApartmentId] = useState<number | null>(null);

  // Check if user is authorized (has OWNER role)
  useEffect(() => {
    if (sessionStatus === 'authenticated') {
      const userRole = session?.user?.role || '';
      if (userRole !== 'OWNER') {
        router.push('/unauthorized');
      } else {
        setIsAuthorized(true);
      }
    }
  }, [session, sessionStatus, router]);

  // Get the owner ID from the session
  const ownerId = session?.user?.id as number;

  // Fetch owner details using the ID from session
  const {
    owner,
    loading: ownerLoading,
    error: ownerError,
  } = useFetchOwner(ownerId);

  // Fetch owner rentals
  const {
    rentals,
    loading: rentalsLoading,
    error: rentalsError,
  } = useFetchOwnerRentals(ownerId);

  // Fetch all rentals for calendar (global, not just owner)
  const {
    rentals: allRentals,
    loading: allRentalsLoading,
    error: allRentalsError,
  } = useFetchRentals();

  // Loading state for session or authorization check
  if (sessionStatus === 'loading' || !isAuthorized) {
    return (
      <div className='flex h-screen items-center justify-center'>
        <Loader2 className='text-primary h-12 w-12 animate-spin' />
      </div>
    );
  }

  // Loading state for owner data
  if (ownerLoading) {
    return (
      <div className='flex h-screen items-center justify-center'>
        <Loader2 className='text-primary h-12 w-12 animate-spin' />
      </div>
    );
  }

  // Error state
  if (ownerError || !owner) {
    return (
      <div className='flex h-screen flex-col items-center justify-center'>
        <h2 className='mb-2 text-2xl font-bold text-red-600'>
          Error Loading Profile
        </h2>
        <p className='mb-4 text-gray-600'>
          We couldn&apos;t load your profile information.
        </p>
        <button
          onClick={() => router.push('/')}
          className='bg-primary rounded-md px-4 py-2 text-white'
        >
          Go to Home
        </button>
      </div>
    );
  }

  // Filter rentals based on selected status
  const filteredRentals = rentals
    ? rentalStatusFilter === 'ALL'
      ? rentals
      : rentals.filter((rental) => rental.status === rentalStatusFilter)
    : [];

  // Rentals for selected apartment (calendar tab)
  const ownedApartments = (owner.ownedApartments ?? []) as OwnedApartment[];
  const calendarApartment = ownedApartments.find((apt) => apt.id === selectedApartmentId);
  // Use allRentals for the calendar
  const calendarRentals = (allRentals && selectedApartmentId)
    ? allRentals.filter((rental: Rental) => rental.apartmentId === selectedApartmentId)
    : [];
  // Rental periods for calendar (highlighted and disabled)
  const calendarRentalRanges = calendarRentals.map((rental: Rental) => ({
    from: new Date(rental.startDate),
    to: new Date(rental.endDate),
  }));

  return (
    <div className='bg-background-primary min-h-screen pt-24 pb-12'>
      <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
        {/* Page Header with Owner Dashboard title */}
        <div className='mb-6'>
          <div className='mb-2 flex items-center'>
            <Shield className='text-primary mr-2 h-6 w-6' />
            <h1 className='text-2xl font-bold text-gray-900'>
              Owner Dashboard
            </h1>
          </div>
          <p className='text-gray-600'>
            Manage your properties and rental requests
          </p>
        </div>

        {/* Profile Header */}
        <div className='mb-6 overflow-hidden rounded-lg bg-white shadow'>
          <div className='border-b border-gray-200 p-6 sm:p-8'>
            <div className='mb-6 flex flex-col items-start justify-between md:flex-row md:items-center'>
              <div className='mb-4 flex items-center md:mb-0'>
                {/* User Avatar */}
                <div className='bg-primary/10 mr-4 rounded-full p-3'>
                  <User className='text-primary h-12 w-12' />
                </div>

                {/* User Name and Status */}
                <div>
                  <h1 className='text-2xl font-bold text-gray-900'>
                    {owner.firstName} {owner.lastName}
                  </h1>
                  <div className='mt-1 flex items-center'>
                    <BadgeCheck className='text-primary mr-1 h-5 w-5' />
                    <span className='text-sm font-medium text-gray-600'>
                      Verified Owner
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Details */}
            <div className='mt-6 grid grid-cols-1 gap-6 md:grid-cols-3'>
              <div className='flex items-center'>
                <Mail className='mr-2 h-5 w-5 text-gray-500' />
                <span className='text-gray-600'>{owner.email}</span>
              </div>
              <div className='flex items-center'>
                <Phone className='mr-2 h-5 w-5 text-gray-500' />
                <span className='text-gray-600'>
                  {owner.phone || 'No phone number provided'}
                </span>
              </div>
              <div className='flex items-center'>
                <Building className='mr-2 h-5 w-5 text-gray-500' />
                <span className='text-gray-600'>
                  {owner.ownedApartments?.length || 0}{' '}
                  {owner.ownedApartments?.length === 1
                    ? 'Property'
                    : 'Properties'}
                </span>
              </div>
            </div>
          </div>

          {/* Profile Tabs */}
          <div className='border-b border-gray-200'>
            <nav className='-mb-px flex'>
              <button
                onClick={() => setActiveTab('apartments')}
                className={`flex items-center border-b-2 px-6 py-4 text-center text-sm font-medium ${
                  activeTab === 'apartments'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                <Home className='mr-2 h-5 w-5' />
                My Properties
              </button>
              <button
                onClick={() => setActiveTab('rentals')}
                className={`flex items-center border-b-2 px-6 py-4 text-center text-sm font-medium ${
                  activeTab === 'rentals'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                <Calendar className='mr-2 h-5 w-5' />
                My Rentals
              </button>
              <button
                onClick={() => setActiveTab('calendar')}
                className={`flex items-center border-b-2 px-6 py-4 text-center text-sm font-medium ${
                  activeTab === 'calendar'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                <Calendar className='mr-2 h-5 w-5' />
                Calendar
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className='mt-6'>
          {/* Apartments Tab */}
          {activeTab === 'apartments' && (
            <div>
              <div className='mb-6 flex items-center justify-between'>
                <h2 className='text-xl font-semibold text-gray-800'>
                  {owner.ownedApartments?.length || 0}{' '}
                  {owner.ownedApartments?.length === 1
                    ? 'Property'
                    : 'Properties'}
                </h2>

                {/* Add Property Button */}
                <Link
                  href='/add-apartment'
                  className='bg-primary hover:bg-primary-dark focus:ring-primary inline-flex items-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-white shadow-sm focus:ring-2 focus:ring-offset-2 focus:outline-none'
                >
                  Add Property
                </Link>
              </div>

              {/* Apartments Grid */}
              {!owner.ownedApartments || owner.ownedApartments.length === 0 ? (
                <div className='rounded-lg bg-white p-6 text-center shadow'>
                  <p className='text-gray-600'>
                    You don&apos;t have any properties yet. Add your first
                    property to start hosting!
                  </p>
                </div>
              ) : (
                <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {owner.ownedApartments.map((apartment: any) => (
                    <Link
                      key={apartment.id}
                      href={`/apartment/${apartment.id}`}
                      className='focus:ring-primary block rounded-lg transition-transform hover:scale-[1.02] focus:ring-2 focus:ring-offset-2 focus:outline-none'
                    >
                      <ApartmentCard apt={apartment} />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Rentals Tab */}
          {activeTab === 'rentals' && (
            <div>
              <div className='mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center'>
                <h2 className='text-xl font-semibold text-gray-800'>
                  My Rental Requests
                </h2>

                {/* Status Filter */}
                <div className='relative'>
                  <select
                    value={rentalStatusFilter}
                    onChange={(e) =>
                      setRentalStatusFilter(
                        e.target.value as RentalStatusFilter,
                      )
                    }
                    className='focus:ring-primary focus:border-primary appearance-none rounded-md border border-gray-300 bg-white py-2 pr-10 pl-3 text-sm leading-5 focus:outline-none'
                  >
                    <option value='ALL'>All Rentals</option>
                    <option value='PENDING'>Pending</option>
                    <option value='ACTIVE'>Active</option>
                    <option value='COMPLETED'>Completed</option>
                    <option value='CANCELLED'>Cancelled</option>
                  </select>
                  <div className='pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700'>
                    <ChevronDown className='h-4 w-4' />
                  </div>
                </div>
              </div>

              {/* Rentals Table */}
              {rentalsLoading ? (
                <div className='flex justify-center rounded-lg bg-white p-6 shadow'>
                  <Loader2 className='text-primary h-8 w-8 animate-spin' />
                </div>
              ) : rentalsError ? (
                <div className='rounded-lg bg-white p-6 text-center shadow'>
                  <p className='text-red-600'>Error loading rental requests</p>
                </div>
              ) : filteredRentals.length === 0 ? (
                <div className='rounded-lg bg-white p-6 text-center shadow'>
                  <p className='text-gray-600'>
                    {rentalStatusFilter === 'ALL'
                      ? 'No rental requests found.'
                      : `No ${rentalStatusFilter.toLowerCase()} rental requests found.`}
                  </p>
                </div>
              ) : (
                <div className='overflow-hidden rounded-lg bg-white shadow'>
                  <table className='min-w-full divide-y divide-gray-200'>
                    <thead className='bg-gray-50'>
                      <tr>
                        <th
                          scope='col'
                          className='px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase'
                        >
                          Rental ID
                        </th>
                        <th
                          scope='col'
                          className='px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase'
                        >
                          Property
                        </th>
                        <th
                          scope='col'
                          className='px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase'
                        >
                          Tenant
                        </th>
                        <th
                          scope='col'
                          className='px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase'
                        >
                          Dates
                        </th>
                        <th
                          scope='col'
                          className='px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase'
                        >
                          Cost
                        </th>
                        <th
                          scope='col'
                          className='px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase'
                        >
                          Status
                        </th>
                        <th
                          scope='col'
                          className='px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase'
                        >
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className='divide-y divide-gray-200 bg-white'>
                      {filteredRentals.map((rental: Rental) => (
                        <tr key={rental.id}>
                          <td className='px-6 py-4 text-sm whitespace-nowrap text-gray-700'>
                            #{rental.id}
                          </td>
                          <td className='px-6 py-4 text-sm whitespace-nowrap text-gray-900'>
                            <div className='flex items-start'>
                              <div>
                                <Link
                                  href={`/apartment/${rental.apartmentId}`}
                                  className='text-primary font-medium hover:underline'
                                >
                                  Apartment #{rental.apartmentId}
                                </Link>
                                <div className='text-xs text-gray-500'>
                                  {rental.address.city},{' '}
                                  {rental.address.country}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className='px-6 py-4 text-sm whitespace-nowrap text-gray-900'>
                            <div className='font-medium'>
                              Tenant #{rental.tenantId}
                            </div>
                          </td>
                          <td className='px-6 py-4 text-sm whitespace-nowrap text-gray-500'>
                            <div className='font-medium'>
                              {formatDate(new Date(rental.startDate))}
                            </div>
                            <div className='text-xs'>
                              to {formatDate(new Date(rental.endDate))}
                            </div>
                            <div className='text-xs text-gray-400'>
                              ({rental.nights} nights)
                            </div>
                          </td>
                          <td className='px-6 py-4 text-sm whitespace-nowrap text-gray-900'>
                            <div className='font-medium'>
                              ${rental.totalCost}
                            </div>
                            <div className='text-xs text-gray-500'>
                              ${rental.pricePerNight}/night
                            </div>
                          </td>
                          <td className='px-6 py-4 whitespace-nowrap'>
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                rental.status === 'PENDING'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : rental.status === 'ACTIVE'
                                    ? 'bg-green-100 text-green-800'
                                    : rental.status === 'COMPLETED'
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'bg-red-100 text-red-800'
                              } `}
                            >
                              {rental.status}
                            </span>
                          </td>
                          <td className='px-6 py-4 text-sm font-medium whitespace-nowrap'>
                            <Link
                              href={`/owner/rentals/${rental.id}`}
                              className='text-primary hover:text-primary-dark'
                            >
                              Manage
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Calendar Tab */}
          {activeTab === 'calendar' && (
            <div>
              <div className='mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
                <h2 className='text-xl font-semibold text-gray-800'>
                  Rental Calendar
                </h2>
                {/* Apartment Picker */}
                <div>
                  <select
                    value={selectedApartmentId ?? ''}
                    onChange={e => setSelectedApartmentId(e.target.value ? Number(e.target.value) : null)}
                    className='focus:ring-primary focus:border-primary appearance-none rounded-md border border-gray-300 bg-white py-2 pr-10 pl-3 text-sm leading-5 focus:outline-none'
                  >
                    <option value=''>Select Apartment</option>
                    {ownedApartments.map((apt) => (
                      <option key={apt.id} value={apt.id}>
                        {apt.title ? apt.title : `Apartment #${apt.id}`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {/* Calendar Section */}
              {allRentalsLoading ? (
                <div className='flex justify-center rounded-lg bg-white p-6 shadow'>
                  <Loader2 className='text-primary h-8 w-8 animate-spin' />
                </div>
              ) : allRentalsError ? (
                <div className='rounded-lg bg-white p-6 text-center shadow'>
                  <p className='text-red-600'>Error loading rentals for calendar</p>
                </div>
              ) : selectedApartmentId ? (
                <div className='rounded-lg bg-white p-6 shadow'>
                  <h3 className='mb-4 text-lg font-medium text-gray-700'>
                    {calendarApartment?.title ? calendarApartment.title : `Apartment #${calendarApartment?.id}`}
                  </h3>
                  {/* Calendar component, highlight rental periods */}
                  <DayRangePicker
                    disabledRanges={calendarRentalRanges}
                    highlightedRanges={calendarRentalRanges}
                    userRole='OWNER'
                    readOnly={true}
                  />
                  <div className='mt-4'>
                    <h4 className='font-semibold text-gray-700 mb-2'>Rental Periods:</h4>
                    {calendarRentals.length === 0 ? (
                      <p className='text-gray-500'>No rentals for this apartment.</p>
                    ) : (
                      <ul className='text-gray-700 text-sm'>
                        {calendarRentals.map((rental: Rental) => (
                          <li key={rental.id} className='mb-1'>
                            {formatDate(new Date(rental.startDate))} - {formatDate(new Date(rental.endDate))} ({rental.status})
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              ) : (
                <div className='rounded-lg bg-white p-6 text-center shadow'>
                  <p className='text-gray-600'>Select an apartment to view its rental calendar.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
