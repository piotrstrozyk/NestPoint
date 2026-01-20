import { ChevronDown, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { formatDate } from '@/core/lib/utils/format-date';
import { Rental } from '@/features/tenant/hooks/use-fetch-tenant-rentals';

interface RentalsSectionProps {
  rentals: Rental[];
  rentalsLoading: boolean;
  rentalsError: unknown;
  rentalStatusFilter: string;
  setRentalStatusFilter: (status: string) => void;
}

export default function RentalsSection({ rentals, rentalsLoading, rentalsError, rentalStatusFilter, setRentalStatusFilter }: RentalsSectionProps) {
  // Filter rentals based on selected status
  const filteredRentals = rentals
    ? rentalStatusFilter === 'ALL'
      ? rentals
      : rentals.filter((rental) => rental.status === rentalStatusFilter)
    : [];

  return (
    <div>
      <div className='mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center'>
        <h2 className='text-xl font-semibold text-gray-800'>My Rental History</h2>
        {/* Status Filter */}
        <div className='relative'>
          <select
            value={rentalStatusFilter}
            onChange={(e) => setRentalStatusFilter(e.target.value)}
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
          <p className='text-red-600'>Error loading rentals</p>
        </div>
      ) : filteredRentals.length === 0 ? (
        <div className='rounded-lg bg-white p-6 text-center shadow'>
          <p className='text-gray-600'>
            {rentalStatusFilter === 'ALL'
              ? 'No rentals found.'
              : `No ${rentalStatusFilter.toLowerCase()} rentals found.`}
          </p>
          <Link
            href='/apartment-list'
            className='mt-4 inline-block rounded-md bg-indigo-600 px-4 py-2 text-center text-sm font-medium text-white hover:bg-indigo-700'
          >
            Find Apartments to Rent
          </Link>
        </div>
      ) : (
        <div className='overflow-hidden rounded-lg bg-white shadow'>
          <table className='min-w-full divide-y divide-gray-200'>
            <thead className='bg-gray-50'>
              <tr>
                <th className='px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase'>Rental ID</th>
                <th className='px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase'>Property</th>
                <th className='px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase'>Dates</th>
                <th className='px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase'>Cost</th>
                <th className='px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase'>Status</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-200 bg-white'>
              {filteredRentals.map((rental: Rental) => (
                <tr key={rental.id}>
                  <td className='px-6 py-4 text-sm whitespace-nowrap text-gray-700'>#{rental.id}</td>
                  <td className='px-6 py-4 text-sm whitespace-nowrap text-gray-900'>
                    <div className='flex items-start'>
                      <div>
                        <Link href={`/apartment/${rental.apartmentId}`} className='text-primary font-medium hover:underline'>
                          Apartment #{rental.apartmentId}
                        </Link>
                        <div className='text-xs text-gray-500'>
                          {rental.address.city}, {rental.address.country}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className='px-6 py-4 text-sm whitespace-nowrap text-gray-500'>
                    <div className='font-medium'>{formatDate(new Date(rental.startDate))}</div>
                    <div className='text-xs'>to {formatDate(new Date(rental.endDate))}</div>
                    <div className='text-xs text-gray-400'>({rental.nights} nights)</div>
                  </td>
                  <td className='px-6 py-4 text-sm whitespace-nowrap text-gray-900'>
                    <div className='font-medium'>${rental.totalCost}</div>
                    <div className='text-xs text-gray-500'>${rental.pricePerNight}/night</div>
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap'>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      rental.status === 'PENDING'
                        ? 'bg-yellow-100 text-yellow-800'
                        : rental.status === 'ACTIVE'
                        ? 'bg-green-100 text-green-800'
                        : rental.status === 'COMPLETED'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {rental.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
