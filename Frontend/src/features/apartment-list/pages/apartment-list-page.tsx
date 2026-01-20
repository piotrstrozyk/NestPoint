'use client';

import DayRangePicker from '@/core/components/calendar/calendar';
import ApartmentCard from '@/features/apartment-list/components/apartment-card';
import ApartmentsMapModal from '@/features/apartment-list/components/map-modal';
import useFetchApartments from '@/features/apartment-list/hooks/use-fetch-apartments';
import useFetchAvailableApartments from '@/features/apartment-list/hooks/use-fetch-available';
import useFetchApartmentsByAuction from '@/features/apartment-list/hooks/use-fetch-by-auction';
import { Apartment } from '@/features/apartment-list/types/apartment';
import {
  Accessibility,
  ArrowUpDown,
  Bath,
  Building,
  Car,
  Droplet,
  Filter,
  MapPin,
  Search,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { DateRange } from 'react-day-picker';
import 'react-loading-skeleton/dist/skeleton.css';

// Create empty apartment for skeleton loading
const emptyApartment: Apartment = {
  id: -1,
  title: '',
  description: '',
  size: 0,
  numberOfRooms: 0,
  numberOfBeds: 0,
  rentalPrice: 0,
  furnished: false,
  wifi: false,
  petsAllowed: false,
  propertyType: 'APARTMENT',
  ownerId: -1,
  address: {
    street: '',
    apartmentNumber: '',
    city: '',
    postalCode: '',
    country: '',
    fullAddress: '',
    latitude: 0,
    longitude: 0,
  },
  currentlyOccupied: false,
  parkingSpace: false,
  yardAccess: 'NONE',
  poolAccess: 'NONE',
  kitchen: 'PRIVATE',
  poolFee: 0,
  disabilityFriendly: false,
  availableDateRanges: [],
  occupiedDateRanges: [],
  photoUrls: null,
  coordinates: {
    lat: 0,
    lng: 0,
  },
};

// Sorting options
type SortOption = 'price_asc' | 'price_desc' | 'size_asc' | 'size_desc' | '';

export default function ApartmentsPage() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  // Convert dateRange to string for the hook
  const startDate = dateRange?.from
    ? dateRange.from.toISOString().slice(0, 10)
    : undefined;
  const endDate = dateRange?.to
    ? dateRange.to.toISOString().slice(0, 10)
    : undefined;

  // Auction filter state
  const [hasUpcomingAuction, setHasUpcomingAuction] = useState(false);
  const [hasCompletedAuction, setHasCompletedAuction] = useState(false);
  const auction = useFetchApartmentsByAuction(hasUpcomingAuction, hasCompletedAuction);

  // Always call both hooks
  const available = useFetchAvailableApartments(
    startDate || '2000-01-01',
    endDate || '2099-12-31',
  );
  const all = useFetchApartments();

  // Use available if both dates are picked, otherwise use all
  let apartments = dateRange?.from && dateRange?.to ? available.apartments : all.apartments;
  let loading = dateRange?.from && dateRange?.to ? available.loading : all.loading;
  let error = dateRange?.from && dateRange?.to ? available.error : all.error;

  // If any auction filter is active, use auction hook
  if (hasUpcomingAuction || hasCompletedAuction) {
    apartments = auction.apartments;
    loading = auction.loading;
    error = auction.error;
  }

  const [searchText, setSearchText] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Sorting state
  const [sortBy, setSortBy] = useState<SortOption>('');

  // Basic filters
  const [roomsMin, setRoomsMin] = useState('');
  const [bedsMin, setBedsMin] = useState('');
  const [furnishedOnly, setFurnishedOnly] = useState(false);
  const [wifiOnly, setWifiOnly] = useState(false);
  const [petsAllowedOnly, setPetsAllowedOnly] = useState(false);
  const [propertyType, setPropertyType] = useState<
    Apartment['propertyType'] | ''
  >('');

  // Additional filters
  const [parkingSpaceOnly, setParkingSpaceOnly] = useState(false);
  const [disabilityFriendlyOnly, setDisabilityFriendlyOnly] = useState(false);
  const [kitchenType, setKitchenType] = useState<'ANY' | 'PRIVATE' | 'SHARED'>(
    'ANY',
  );
  const [poolAccessType, setPoolAccessType] = useState<
    'ANY' | 'NONE' | 'SHARED' | 'PRIVATE'
  >('ANY');
  const [yardAccessType, setYardAccessType] = useState<
    'ANY' | 'NONE' | 'SHARED' | 'PRIVATE'
  >('ANY');
  const [sizeMin, setSizeMin] = useState('');

  // Function to reset all filters
  const resetFilters = () => {
    setSearchText('');
    setCityFilter('');
    setPriceMin('');
    setPriceMax('');
    setRoomsMin('');
    setBedsMin('');
    setSizeMin('');
    setFurnishedOnly(false);
    setWifiOnly(false);
    setPetsAllowedOnly(false);
    setParkingSpaceOnly(false);
    setDisabilityFriendlyOnly(false);
    setKitchenType('ANY');
    setPoolAccessType('ANY');
    setYardAccessType('ANY');
    setPropertyType('');
    setSortBy('');
    setHasUpcomingAuction(false);
    setHasCompletedAuction(false);
  };

  // Count active filters to show in badge
  const activeFilterCount = [
    searchText,
    cityFilter,
    priceMin,
    priceMax,
    roomsMin,
    bedsMin,
    sizeMin,
    furnishedOnly,
    wifiOnly,
    petsAllowedOnly,
    parkingSpaceOnly,
    disabilityFriendlyOnly,
    kitchenType !== 'ANY' ? kitchenType : '',
    poolAccessType !== 'ANY' ? poolAccessType : '',
    yardAccessType !== 'ANY' ? yardAccessType : '',
    propertyType,
    sortBy,
  ].filter((filter) =>
    typeof filter === 'boolean' ? filter : filter !== '',
  ).length;

  // Function to get the display text for the current sort option
  const getSortLabel = (option: SortOption): string => {
    switch (option) {
      case 'price_asc':
        return 'Price (low to high)';
      case 'price_desc':
        return 'Price (high to low)';
      case 'size_asc':
        return 'Size (small to large)';
      case 'size_desc':
        return 'Size (large to small)';
      default:
        return 'Sort by';
    }
  };

  const filtered = useMemo(() => {
    // First filter all apartments based on criteria
    const filteredResults = (apartments ?? []).filter((apt: Apartment) => {
      const lcText: string = searchText.toLowerCase();
      if (
        searchText &&
        !(
          apt.title.toLowerCase().includes(lcText) ||
          apt.description.toLowerCase().includes(lcText)
        )
      ) {
        return false;
      }

      // Improved city filter to allow partial matching
      if (
        cityFilter &&
        !apt.address.city.toLowerCase().includes(cityFilter.toLowerCase())
      ) {
        return false;
      }

      const price: number = apt.rentalPrice;
      if (priceMin && price < Number(priceMin)) return false;
      if (priceMax && price > Number(priceMax)) return false;

      if (roomsMin && apt.numberOfRooms < Number(roomsMin)) {
        return false;
      }
      if (bedsMin && apt.numberOfBeds < Number(bedsMin)) {
        return false;
      }
      if (sizeMin && apt.size < Number(sizeMin)) {
        return false;
      }

      if (furnishedOnly && !apt.furnished) return false;
      if (wifiOnly && !apt.wifi) return false;
      if (petsAllowedOnly && !apt.petsAllowed) return false;
      if (parkingSpaceOnly && !apt.parkingSpace) return false;
      if (disabilityFriendlyOnly && !apt.disabilityFriendly) return false;

      if (kitchenType !== 'ANY' && apt.kitchen !== kitchenType) {
        return false;
      }

      if (poolAccessType !== 'ANY' && apt.poolAccess !== poolAccessType) {
        return false;
      }

      if (yardAccessType !== 'ANY' && apt.yardAccess !== yardAccessType) {
        return false;
      }

      if (propertyType && apt.propertyType !== propertyType) {
        return false;
      }

      return true;
    });

    // Then sort the filtered results based on sortBy
    if (sortBy) {
      return [...filteredResults].sort((a, b) => {
        switch (sortBy) {
          case 'price_asc':
            return a.rentalPrice - b.rentalPrice;
          case 'price_desc':
            return b.rentalPrice - a.rentalPrice;
          case 'size_asc':
            return a.size - b.size;
          case 'size_desc':
            return b.size - a.size;
          default:
            return 0;
        }
      });
    }

    return filteredResults;
  }, [
    apartments,
    searchText,
    cityFilter,
    priceMin,
    priceMax,
    roomsMin,
    bedsMin,
    sizeMin,
    furnishedOnly,
    wifiOnly,
    petsAllowedOnly,
    parkingSpaceOnly,
    disabilityFriendlyOnly,
    kitchenType,
    poolAccessType,
    yardAccessType,
    propertyType,
    sortBy, // Add sortBy to dependencies so filtering runs when sort changes
  ]);

  return (
    <div className='mx-auto mt-32 w-full max-w-6xl space-y-8 p-6'>
      <ApartmentsMapModal />

      {/* Header section with count and map toggle */}
      <div className='flex flex-col items-start justify-between gap-4 md:flex-row md:items-center'>
        <div>
          <h1 className='bg-primary bg-clip-text text-3xl font-bold text-transparent'>
            Available Apartments
          </h1>
          <p className='mt-1 text-gray-500'>
            {loading
              ? 'Searching for apartments...'
              : `${filtered.length} apartment${filtered.length !== 1 ? 's' : ''} found`}
          </p>
        </div>
      </div>

      {/* Filters Panel */}
      <section className='rounded-xl border border-gray-200 bg-white p-6 shadow-sm'>
        <div className='mb-4 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center'>
          <div className='flex items-center gap-2'>
            <Filter className='h-5 w-5 text-indigo-600' />
            <h2 className='text-xl font-semibold'>Search Filters</h2>

            {activeFilterCount > 0 && (
              <span
                data-testid="active-filter-count"
                className='rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-800'
              >
                {activeFilterCount}
              </span>
            )}
          </div>

          {activeFilterCount > 0 && (
            <button
              onClick={resetFilters}
              className='flex items-center gap-1 text-sm text-gray-500 transition-colors hover:text-red-600'
              disabled={loading}
            >
              <X className='h-4 w-4' />
              Clear all filters
            </button>
          )}
        </div>

        {/* Basic Filters */}
        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
          <div className='relative'>
            <Search className='absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400' />
            <input
              type='text'
              placeholder='Search title/description…'
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className='focus:ring-opacity-50 w-full rounded-lg border border-gray-300 py-2 pr-4 pl-10 focus:border-indigo-500 focus:ring focus:ring-indigo-200'
              disabled={loading}
            />
          </div>

          <div className='relative'>
            <MapPin className='absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400' />
            <input
              type='text'
              placeholder='City (partial match)'
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className='focus:ring-opacity-50 w-full rounded-lg border border-gray-300 py-2 pr-4 pl-10 focus:border-indigo-500 focus:ring focus:ring-indigo-200'
              disabled={loading}
            />
          </div>

          <div className='relative'>
            <span className='absolute top-1/2 left-3 -translate-y-1/2 text-sm text-gray-400'>
              zł
            </span>
            <input
              type='number'
              placeholder='Min price'
              value={priceMin}
              onChange={(e) => setPriceMin(e.target.value)}
              className='focus:ring-opacity-50 w-full rounded-lg border border-gray-300 py-2 pr-4 pl-10 focus:border-indigo-500 focus:ring focus:ring-indigo-200'
              disabled={loading}
            />
          </div>

          <div className='relative'>
            <span className='absolute top-1/2 left-3 -translate-y-1/2 text-sm text-gray-400'>
              zł
            </span>
            <input
              type='number'
              placeholder='Max price'
              value={priceMax}
              onChange={(e) => setPriceMax(e.target.value)}
              className='focus:ring-opacity-50 w-full rounded-lg border border-gray-300 py-2 pr-4 pl-10 focus:border-indigo-500 focus:ring focus:ring-indigo-200'
              disabled={loading}
            />
          </div>
        </div>

        {/* Advanced Filters Toggle */}
        <div className='mt-4 border-t border-gray-100 pt-4'>
          <button
            type='button'
            onClick={() => setShowAdvanced((v) => !v)}
            className={`flex items-center gap-2 text-sm font-medium ${
              loading
                ? 'cursor-not-allowed text-gray-400'
                : 'text-indigo-600 hover:text-indigo-800'
            }`}
            disabled={loading}
          >
            {showAdvanced ? (
              <>
                <span>Hide advanced filters</span>
                <svg
                  className='h-5 w-5'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M5 15l7-7 7 7'
                  />
                </svg>
              </>
            ) : (
              <>
                <span>Show advanced filters</span>
                <svg
                  className='h-5 w-5'
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
                </svg>
              </>
            )}
          </button>
        </div>

        {/* Advanced Filters */}
        {showAdvanced && (
          <div className='mt-4 space-y-6 border-t border-gray-100 pt-4'>
            {/* Property Type and Basic Dimensions */}
            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
              <div className='relative'>
                <Building className='absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400' />
                <select
                  value={propertyType}
                  onChange={(e) =>
                    setPropertyType(
                      e.target.value as Apartment['propertyType'] | '',
                    )
                  }
                  className='focus:ring-opacity-50 w-full rounded-lg border border-gray-300 py-2 pr-4 pl-10 focus:border-indigo-500 focus:ring focus:ring-indigo-200'
                  disabled={loading}
                >
                  <option value=''>All property types</option>
                  <option value='APARTMENT'>Apartment</option>
                  <option value='ROOM'>Room</option>
                  <option value='PROPERTY'>Property</option>
                </select>
              </div>

              <div className='relative'>
                <span className='absolute top-1/2 left-3 -translate-y-1/2 text-sm text-gray-400'>
                  #
                </span>
                <input
                  type='number'
                  placeholder='Min rooms'
                  value={roomsMin}
                  onChange={(e) => setRoomsMin(e.target.value)}
                  className='focus:ring-opacity-50 w-full rounded-lg border border-gray-300 py-2 pr-4 pl-10 focus:border-indigo-500 focus:ring focus:ring-indigo-200'
                  disabled={loading}
                />
              </div>

              <div className='relative'>
                <span className='absolute top-1/2 left-3 -translate-y-1/2 text-sm text-gray-400'>
                  #
                </span>
                <input
                  type='number'
                  placeholder='Min beds'
                  value={bedsMin}
                  onChange={(e) => setBedsMin(e.target.value)}
                  className='focus:ring-opacity-50 w-full rounded-lg border border-gray-300 py-2 pr-4 pl-10 focus:border-indigo-500 focus:ring focus:ring-indigo-200'
                  disabled={loading}
                />
              </div>

              <div className='relative'>
                <span className='absolute top-1/2 left-3 -translate-y-1/2 text-sm text-gray-400'>
                  m²
                </span>
                <input
                  type='number'
                  placeholder='Min size'
                  value={sizeMin}
                  onChange={(e) => setSizeMin(e.target.value)}
                  className='focus:ring-opacity-50 w-full rounded-lg border border-gray-300 py-2 pr-4 pl-10 focus:border-indigo-500 focus:ring focus:ring-indigo-200'
                  disabled={loading}
                />
              </div>
            </div>

            {/* Amenities & Auction Section */}
            <div className="space-y-4">
              <h3 className="text-md font-medium text-gray-700">Amenities</h3>
              <div className="flex flex-wrap gap-x-6 gap-y-4">
                {/* Furnished */}
                <label className={`flex items-center gap-2 ${loading ? 'opacity-50' : ''}`}>
                  <input
                    type="checkbox"
                    checked={furnishedOnly}
                    onChange={e => setFurnishedOnly(e.target.checked)}
                    className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500"
                    disabled={loading}
                  />
                  <span className="text-sm">Furnished</span>
                </label>
                {/* WiFi */}
                <label className={`flex items-center gap-2 ${loading ? 'opacity-50' : ''}`}>
                  <input
                    type="checkbox"
                    checked={wifiOnly}
                    onChange={e => setWifiOnly(e.target.checked)}
                    className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500"
                    disabled={loading}
                  />
                  <span className="text-sm">WiFi</span>
                </label>
                {/* Pets Allowed */}
                <label className={`flex items-center gap-2 ${loading ? 'opacity-50' : ''}`}>
                  <input
                    type="checkbox"
                    checked={petsAllowedOnly}
                    onChange={e => setPetsAllowedOnly(e.target.checked)}
                    className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500"
                    disabled={loading}
                  />
                  <span className="text-sm">Pets allowed</span>
                </label>
                {/* Parking */}
                <label className={`flex items-center gap-2 ${loading ? 'opacity-50' : ''}`}>
                  <input
                    type="checkbox"
                    checked={parkingSpaceOnly}
                    onChange={e => setParkingSpaceOnly(e.target.checked)}
                    className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500"
                    disabled={loading}
                  />
                  <span className="flex items-center gap-1 text-sm">
                    <Car className="h-3 w-3" /> Parking
                  </span>
                </label>
                {/* Accessible */}
                <label className={`flex items-center gap-2 ${loading ? 'opacity-50' : ''}`}>
                  <input
                    type="checkbox"
                    checked={disabilityFriendlyOnly}
                    onChange={e => setDisabilityFriendlyOnly(e.target.checked)}
                    className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500"
                    disabled={loading}
                  />
                  <span className="flex items-center gap-1 text-sm">
                    <Accessibility className="h-3 w-3" /> Accessible
                  </span>
                </label>
              </div>

              {/* Auction Status */}
              <h3 className="text-md font-medium text-gray-700 pt-4">Auction status</h3>
              <div className="flex flex-wrap gap-x-6 gap-y-4">
                <label className={`flex items-center gap-2 ${loading ? 'opacity-50' : ''}`}>
                  <input
                    type="checkbox"
                    checked={hasUpcomingAuction}
                    onChange={e => setHasUpcomingAuction(e.target.checked)}
                    className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500"
                    disabled={loading}
                  />
                  <span className="text-sm">Upcoming</span>
                </label>
                <label className={`flex items-center gap-2 ${loading ? 'opacity-50' : ''}`}>
                  <input
                    type="checkbox"
                    checked={hasCompletedAuction}
                    onChange={e => setHasCompletedAuction(e.target.checked)}
                    className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500"
                    disabled={loading}
                  />
                  <span className="text-sm">Completed</span>
                </label>
              </div>
            </div>


            {/* Access Types Section */}
            <div className='grid grid-cols-1 gap-4 sm:grid-cols-3'>
              <div className='relative'>
                <Bath className='absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400' />
                <select
                  value={kitchenType}
                  onChange={(e) =>
                    setKitchenType(
                      e.target.value as 'ANY' | 'PRIVATE' | 'SHARED',
                    )
                  }
                  className='focus:ring-opacity-50 w-full rounded-lg border border-gray-300 py-2 pr-4 pl-10 focus:border-indigo-500 focus:ring focus:ring-indigo-200'
                  disabled={loading}
                >
                  <option value='ANY'>Any kitchen type</option>
                  <option value='PRIVATE'>Private kitchen</option>
                  <option value='SHARED'>Shared kitchen</option>
                </select>
              </div>

              <div className='relative'>
                <Droplet className='absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400' />
                <select
                  value={poolAccessType}
                  onChange={(e) =>
                    setPoolAccessType(
                      e.target.value as 'ANY' | 'NONE' | 'SHARED' | 'PRIVATE',
                    )
                  }
                  className='focus:ring-opacity-50 w-full rounded-lg border border-gray-300 py-2 pr-4 pl-10 focus:border-indigo-500 focus:ring focus:ring-indigo-200'
                  disabled={loading}
                >
                  <option value='ANY'>Any pool access</option>
                  <option value='PRIVATE'>Private pool</option>
                  <option value='SHARED'>Shared pool</option>
                  <option value='NONE'>No pool</option>
                </select>
              </div>

              <div className='relative'>
                <svg
                  className='absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400'
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
                <select
                  value={yardAccessType}
                  onChange={(e) =>
                    setYardAccessType(
                      e.target.value as 'ANY' | 'NONE' | 'SHARED' | 'PRIVATE',
                    )
                  }
                  className='focus:ring-opacity-50 w-full rounded-lg border border-gray-300 py-2 pr-4 pl-10 focus:border-indigo-500 focus:ring focus:ring-indigo-200'
                  disabled={loading}
                >
                  <option value='ANY'>Any yard access</option>
                  <option value='PRIVATE'>Private yard</option>
                  <option value='SHARED'>Shared yard</option>
                  <option value='NONE'>No yard</option>
                </select>
              </div>
            </div>
            {/* Calendar filter */}
            <div className='mb-6 flex flex-col sm:flex-row sm:items-end sm:gap-4'>
              <div className='relative flex-1'>
                <label className='mb-2 block font-medium text-gray-700'>
                  Available date range
                </label>
                <DayRangePicker
                  initialRange={dateRange}
                  onConfirm={(range) => setDateRange(range)}
                />
                {dateRange?.from && dateRange?.to && (
                  <button
                    type='button'
                    className='absolute top-0 right-0 mt-2 mr-2 rounded-lg border border-indigo-600 bg-white px-3 py-1 font-medium text-indigo-600 shadow transition-colors hover:bg-indigo-50'
                    style={{ zIndex: 10 }}
                    onClick={() => setDateRange(undefined)}
                  >
                    Clear date range
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Results section */}
      <div className='min-h-[400px]'>
        {loading ? (
          <>
            <div className='mb-4 flex items-center justify-between'>
              <p className='text-sm text-gray-500'>Loading apartments...</p>
            </div>
            <ul className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3'>
              {[...Array(6)].map((_, index) => (
                <ApartmentCard
                  key={`skeleton-${index}`}
                  apt={emptyApartment}
                  isLoading={true}
                />
              ))}
            </ul>
          </>
        ) : error ? (
          <div className='py-10 text-center'>
            <div className='inline-block rounded-xl bg-red-50 p-8 text-red-600 shadow-sm'>
              <svg
                className='mx-auto mb-3 h-12 w-12 text-red-400'
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
                />
              </svg>
              <p className='mb-2 text-xl font-semibold'>
                Failed to load apartments
              </p>
              <p className='text-sm'>
                We&apos;re experiencing some technical difficulties. Please try
                again later.
              </p>
              <button
                onClick={() => window.location.reload()}
                className='mt-4 inline-flex items-center rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:ring-4 focus:ring-red-300 focus:outline-none'
              >
                Retry
              </button>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className='py-10 text-center'>
            <div className='inline-block rounded-xl bg-gray-50 p-8 shadow-sm'>
              <svg
                className='mx-auto mb-3 h-12 w-12 text-gray-400'
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z'
                />
              </svg>
              <p className='mb-2 text-xl font-medium text-gray-700'>
                No apartments match your filters
              </p>
              <p className='text-sm text-gray-500'>
                Try adjusting your search criteria or clearing some filters
              </p>
              <button
                onClick={resetFilters}
                className='mt-4 inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-300 focus:outline-none'
              >
                Clear all filters
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className='mb-6 flex items-center justify-between'>
              <p className='text-sm text-gray-500'>
                Showing <span className='font-medium'>{filtered.length}</span>{' '}
                {filtered.length === 1 ? 'apartment' : 'apartments'}
              </p>

              {/* Sort dropdown */}
              <div className='relative inline-block text-left'>
                <div>
                  <button
                    type='button'
                    className='inline-flex w-full justify-center gap-x-1.5 rounded-md bg-indigo-50 px-3 py-2 text-xs font-medium text-indigo-700 shadow-sm hover:bg-indigo-100'
                    id='sort-menu-button'
                    aria-expanded='true'
                    aria-haspopup='true'
                    onClick={() => {
                      const menu = document.getElementById('sort-dropdown');
                      if (menu) menu.classList.toggle('hidden');
                    }}
                    disabled={loading}
                  >
                    <ArrowUpDown className='mr-1 h-3.5 w-3.5' />
                    Sort: {sortBy ? getSortLabel(sortBy) : 'None'}
                    <svg
                      className='-mr-1 h-4 w-4 text-indigo-600'
                      viewBox='0 0 20 20'
                      fill='currentColor'
                      aria-hidden='true'
                    >
                      <path
                        fillRule='evenodd'
                        d='M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z'
                        clipRule='evenodd'
                      />
                    </svg>
                  </button>
                </div>

                <div
                  id='sort-dropdown'
                  className='ring-opacity-5 absolute right-0 z-10 mt-2 hidden w-48 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black focus:outline-none'
                >
                  <div className='py-1'>
                    <button
                      onClick={() => {
                        setSortBy('');
                        document
                          .getElementById('sort-dropdown')
                          ?.classList.add('hidden');
                      }}
                      className={`block w-full px-4 py-2 text-left text-sm ${!sortBy ? 'bg-indigo-50 font-medium text-indigo-700' : 'text-gray-700 hover:bg-gray-100'}`}
                    >
                      No sorting
                    </button>
                    <button
                      onClick={() => {
                        setSortBy('price_asc');
                        document
                          .getElementById('sort-dropdown')
                          ?.classList.add('hidden');
                      }}
                      className={`block w-full px-4 py-2 text-left text-sm ${sortBy === 'price_asc' ? 'bg-indigo-50 font-medium text-indigo-700' : 'text-gray-700 hover:bg-gray-100'}`}
                    >
                      Price (low to high)
                    </button>
                    <button
                      onClick={() => {
                        setSortBy('price_desc');
                        document
                          .getElementById('sort-dropdown')
                          ?.classList.add('hidden');
                      }}
                      className={`block w-full px-4 py-2 text-left text-sm ${sortBy === 'price_desc' ? 'bg-indigo-50 font-medium text-indigo-700' : 'text-gray-700 hover:bg-gray-100'}`}
                    >
                      Price (high to low)
                    </button>
                    <button
                      onClick={() => {
                        setSortBy('size_asc');
                        document
                          .getElementById('sort-dropdown')
                          ?.classList.add('hidden');
                      }}
                      className={`block w-full px-4 py-2 text-left text-sm ${sortBy === 'size_asc' ? 'bg-indigo-50 font-medium text-indigo-700' : 'text-gray-700 hover:bg-gray-100'}`}
                    >
                      Size (small to large)
                    </button>
                    <button
                      onClick={() => {
                        setSortBy('size_desc');
                        document
                          .getElementById('sort-dropdown')
                          ?.classList.add('hidden');
                      }}
                      className={`block w-full px-4 py-2 text-left text-sm ${sortBy === 'size_desc' ? 'bg-indigo-50 font-medium text-indigo-700' : 'text-gray-700 hover:bg-gray-100'}`}
                    >
                      Size (large to small)
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <ul className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3'>
              {filtered.map((apt: Apartment) => (
                <Link
                  key={apt.id}
                  href={`/apartment/${apt.id}`}
                  className='block rounded-lg transition-all hover:scale-[1.02] hover:shadow-lg focus:ring-2 focus:ring-indigo-300 focus:outline-none'
                >
                  <ApartmentCard apt={apt} />
                </Link>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
