'use client';

import useFetchApartments from '@/features/apartment-list/hooks/use-fetch-apartments';
import { Apartment } from '@/features/apartment-list/types/apartment';
import { Filter, MapPin, Search, X } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import type { FC } from 'react';

type ApartmentListMapProps = {
  apartments: Apartment[] | null;
  zoom: number;
  fallbackCenter: [number, number];
};

const ApartmentListMap = dynamic<ApartmentListMapProps>(
  () =>
    import('./apartment-list-map').then(
      (mod) => mod.default as FC<ApartmentListMapProps>,
    ),
  {
    ssr: false,
    loading: () => (
      <div className='flex h-full w-full items-center justify-center text-gray-500'>
        <div className='flex flex-col items-center'>
          <svg
            className='mb-2 h-8 w-8 animate-spin text-indigo-600'
            xmlns='http://www.w3.org/2000/svg'
            fill='none'
            viewBox='0 0 24 24'
          >
            <circle
              className='opacity-25'
              cx='12'
              cy='12'
              r='10'
              stroke='currentColor'
              strokeWidth='4'
            ></circle>
            <path
              className='opacity-75'
              fill='currentColor'
              d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
            ></path>
          </svg>
          Loading map…
        </div>
      </div>
    ),
  },
);

export default function ApartmentsMapModal() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { apartments = [], loading, error } = useFetchApartments();
  const mapParam = searchParams.get('map') === 'true';
  const [isOpen, setIsOpen] = useState(mapParam);

  const close = () => {
    setIsOpen(false);
    router.replace('/apartment-list');
  };

  // Basic filters
  const [searchText, setSearchText] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Advanced filters
  const [propertyType, setPropertyType] = useState<
    Apartment['propertyType'] | ''
  >('');
  const [roomsMin, setRoomsMin] = useState('');
  const [bedsMin, setBedsMin] = useState('');
  const [furnishedOnly, setFurnishedOnly] = useState(false);
  const [wifiOnly, setWifiOnly] = useState(false);
  const [parkingOnly, setParkingOnly] = useState(false);

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

  // Count active filters to show in badge
  const activeFilterCount = [
    searchText,
    cityFilter,
    priceMin,
    priceMax,
    propertyType,
    roomsMin,
    bedsMin,
    furnishedOnly,
    wifiOnly,
    parkingOnly,
  ].filter((filter) =>
    typeof filter === 'boolean' ? filter : filter !== '',
  ).length;

  // Reset all filters
  const resetFilters = () => {
    setSearchText('');
    setCityFilter('');
    setPriceMin('');
    setPriceMax('');
    setPropertyType('');
    setRoomsMin('');
    setBedsMin('');
    setFurnishedOnly(false);
    setWifiOnly(false);
    setParkingOnly(false);
  };

  // Disable "View Map" button if still loading or errored
  const disableButton = loading || !!error;

  // Compute filtered list for the map
  const filteredOnMap = useMemo(() => {
    return (apartments ?? []).filter((apt: Apartment) => {
      // 1) Text search in title or description
      const lcText = searchText.toLowerCase();
      if (
        searchText &&
        !(
          apt.title.toLowerCase().includes(lcText) ||
          apt.description.toLowerCase().includes(lcText)
        )
      ) {
        return false;
      }

      // 2) City filter (partial match, case-insensitive)
      if (
        cityFilter &&
        !apt.address.city.toLowerCase().includes(cityFilter.toLowerCase())
      ) {
        return false;
      }

      // 3) Price range
      const price = apt.rentalPrice;
      if (priceMin && price < Number(priceMin)) return false;
      if (priceMax && price > Number(priceMax)) return false;

      // 4) Advanced filters
      if (propertyType && apt.propertyType !== propertyType) return false;
      if (roomsMin && apt.numberOfRooms < Number(roomsMin)) return false;
      if (bedsMin && apt.numberOfBeds < Number(bedsMin)) return false;
      if (furnishedOnly && !apt.furnished) return false;
      if (wifiOnly && !apt.wifi) return false;
      if (parkingOnly && !apt.parkingSpace) return false;

      return true;
    });
  }, [
    apartments,
    searchText,
    cityFilter,
    priceMin,
    priceMax,
    propertyType,
    roomsMin,
    bedsMin,
    furnishedOnly,
    wifiOnly,
    parkingOnly,
  ]);

  return (
    <>
      {/* "View Map" button */}
      <div className='flex justify-end'>
        <button
          type='button'
          onClick={() => setIsOpen(true)}
          disabled={disableButton}
          className={`inline-flex items-center gap-2 rounded-lg border border-indigo-600 bg-indigo-600 px-4 py-2 text-white transition hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:opacity-50`}
        >
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
              d='M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7'
            />
          </svg>
          View on Map
        </button>
      </div>

      {isOpen && (
        <div className='fixed inset-0 z-50 flex h-full items-center justify-center bg-black/50'>
          <div className='relative flex h-[90vh] w-[90vw] max-w-7xl flex-col overflow-hidden rounded-lg bg-white shadow-xl'>
            {/* Header bar */}
            <div className='flex items-center justify-between border-b px-6 py-3'>
              <div className='flex items-center gap-2'>
                <svg
                  className='h-5 w-5 text-indigo-600'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7'
                  />
                </svg>
                <h2 className='text-lg font-semibold'>Apartments Map</h2>
                <span className='text-sm text-gray-500'>
                  {filteredOnMap.length}{' '}
                  {filteredOnMap.length === 1 ? 'apartment' : 'apartments'}{' '}
                  found
                </span>
              </div>
              <button
                type='button'
                onClick={close}
                className='rounded-full p-1 hover:bg-gray-100'
                aria-label='Close map modal'
              >
                <X className='h-5 w-5' />
              </button>
            </div>

            {/* Filter panel */}
            <div className='border-b bg-gray-50 px-6 py-4'>
              <div className='mb-2 flex flex-wrap items-center justify-between gap-4'>
                <div className='flex items-center gap-2'>
                  <Filter className='h-4 w-4 text-indigo-600' />
                  <h3 className='font-medium'>Filters</h3>
                  {activeFilterCount > 0 && (
                    <span className='rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-800'>
                      {activeFilterCount}
                    </span>
                  )}
                </div>

                {activeFilterCount > 0 && (
                  <button
                    type='button'
                    onClick={resetFilters}
                    className='flex items-center gap-1 text-sm text-gray-500 transition-colors hover:text-red-600'
                  >
                    <X className='h-4 w-4' />
                    Clear filters
                  </button>
                )}
              </div>

              <div className='grid grid-cols-1 gap-4 md:grid-cols-4'>
                <div className='relative'>
                  <Search className='absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400' />
                  <input
                    type='text'
                    placeholder='Search title/description…'
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    className='focus:ring-opacity-50 w-full rounded-lg border border-gray-300 py-2 pr-4 pl-10 focus:border-indigo-500 focus:ring focus:ring-indigo-200'
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
                  />
                </div>
              </div>

              {/* Advanced Filters Toggle */}
              <div className='mt-2'>
                <button
                  type='button'
                  onClick={() => setShowAdvanced((v) => !v)}
                  className='flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-800'
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
                <div className='mt-3 grid grid-cols-1 gap-4 border-t border-gray-200 pt-3 md:grid-cols-4'>
                  <div>
                    <select
                      value={propertyType}
                      onChange={(e) =>
                        setPropertyType(
                          e.target.value as Apartment['propertyType'] | '',
                        )
                      }
                      className='focus:ring-opacity-50 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring focus:ring-indigo-200'
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
                      className='focus:ring-opacity-50 w-full rounded-lg border border-gray-300 py-2 pr-4 pl-8 focus:border-indigo-500 focus:ring focus:ring-indigo-200'
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
                      className='focus:ring-opacity-50 w-full rounded-lg border border-gray-300 py-2 pr-4 pl-8 focus:border-indigo-500 focus:ring focus:ring-indigo-200'
                    />
                  </div>

                  <div className='flex h-full items-center space-x-3'>
                    <label className='flex items-center space-x-2'>
                      <input
                        type='checkbox'
                        checked={furnishedOnly}
                        onChange={(e) => setFurnishedOnly(e.target.checked)}
                        className='h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500'
                      />
                      <span className='text-sm'>Furnished</span>
                    </label>

                    <label className='flex items-center space-x-2'>
                      <input
                        type='checkbox'
                        checked={wifiOnly}
                        onChange={(e) => setWifiOnly(e.target.checked)}
                        className='h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500'
                      />
                      <span className='text-sm'>WiFi</span>
                    </label>

                    <label className='flex items-center space-x-2'>
                      <input
                        type='checkbox'
                        checked={parkingOnly}
                        onChange={(e) => setParkingOnly(e.target.checked)}
                        className='h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500'
                      />
                      <span className='text-sm'>Parking</span>
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Map area */}
            <div className='flex-1'>
              {loading ? (
                <div className='flex h-full w-full items-center justify-center text-gray-500'>
                  <div className='flex flex-col items-center'>
                    <svg
                      className='mb-3 h-12 w-12 animate-spin text-indigo-600'
                      xmlns='http://www.w3.org/2000/svg'
                      fill='none'
                      viewBox='0 0 24 24'
                    >
                      <circle
                        className='opacity-25'
                        cx='12'
                        cy='12'
                        r='10'
                        stroke='currentColor'
                        strokeWidth='4'
                      ></circle>
                      <path
                        className='opacity-75'
                        fill='currentColor'
                        d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                      ></path>
                    </svg>
                    <p className='text-lg'>Loading apartments...</p>
                  </div>
                </div>
              ) : error ? (
                <div className='flex h-full w-full flex-col items-center justify-center text-red-600'>
                  <svg
                    className='mb-4 h-16 w-16 text-red-500'
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
                  <p className='text-xl font-medium'>
                    Failed to load apartments.
                  </p>
                  <button
                    onClick={() => window.location.reload()}
                    className='mt-4 rounded-lg bg-red-600 px-4 py-2 text-white transition hover:bg-red-700'
                  >
                    Try again
                  </button>
                </div>
              ) : filteredOnMap.length === 0 ? (
                <div className='flex h-full w-full flex-col items-center justify-center text-gray-600'>
                  <svg
                    className='mb-4 h-16 w-16 text-gray-400'
                    fill='none'
                    viewBox='0 0 24 24'
                    stroke='currentColor'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7'
                    />
                  </svg>
                  <p className='text-xl font-medium'>
                    No apartments match your filters
                  </p>
                  <p className='text-gray-500'>
                    Try adjusting your search criteria
                  </p>
                  <button
                    onClick={resetFilters}
                    className='mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-white transition hover:bg-indigo-700'
                  >
                    Clear all filters
                  </button>
                </div>
              ) : (
                <ApartmentListMap
                  apartments={filteredOnMap}
                  zoom={7}
                  fallbackCenter={[52.2297, 21.0122]} // Warsaw fallback
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
