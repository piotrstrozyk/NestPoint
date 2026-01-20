import { Loader2, Check, CreditCard } from 'lucide-react';
import { formatDate } from '@/core/lib/utils/format-date';
import { Rental } from '@/features/tenant/hooks/use-fetch-tenant-rentals';

interface PaymentsSectionProps {
  rentals: Rental[];
  rentalsLoading: boolean;
  rentalsError: unknown;
  completedPayments: number[];
  setSelectedPayment: (rental: Rental) => void;
  setShowPaymentModal: (show: boolean) => void;
  setIsFine?: (isFine: boolean) => void;
}

export default function PaymentsSection({ rentals, rentalsLoading, rentalsError, completedPayments, setSelectedPayment, setShowPaymentModal, setIsFine }: PaymentsSectionProps) {
  const today = new Date().toDateString();
  // Filter for rentals where auctionPaymentConfirmed is false and auctionPaymentDeadline is not null
  const unpaidAuctionRentals = rentals?.filter(
    (r) => r.auctionPaymentConfirmed === false && r.auctionPaymentDeadline
  ) || [];
  const todaysPayments = unpaidAuctionRentals.filter((rental) =>
    rental.auctionPaymentDeadline && new Date(rental.auctionPaymentDeadline).toDateString() === today
  );
  return (
    <div>
      <div className='mb-6'>
        <h2 className='text-xl font-semibold text-gray-800'>Payments Due</h2>
        {todaysPayments.length > 0 && (
          <div className='mb-8 rounded-lg border border-green-100 bg-gradient-to-r from-green-50 to-emerald-50 p-6 shadow-sm'>
            <div className='mb-4 flex items-center'>
              <div className='rounded-full bg-white p-2 shadow-sm'>
                <Check className='h-6 w-6 text-green-600' />
              </div>
              <h3 className='ml-3 text-lg font-semibold text-gray-900'>
                Congratulations on Your Auction Win!
              </h3>
            </div>
            <p className='mb-4 text-gray-700'>
              You&apos;ve recently won an auction and can complete your payment right away to secure your rental.
            </p>
            <div className='grid gap-4 sm:grid-cols-2'>
              {todaysPayments.map((rental) => (
                <div key={`recent-${rental.id}`} className='flex flex-col rounded-lg bg-white p-4 shadow-sm'>
                  <div className='mb-2 flex items-center justify-between'>
                    <span className='text-sm font-medium text-gray-500'>Auction #{rental.id}</span>
                    <span className='inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800'>Just Won</span>
                  </div>
                  <div className='mb-2 flex items-baseline'>
                    <span className='text-2xl font-bold text-gray-900'>${rental.totalCost}</span>
                    <span className='ml-2 text-sm text-gray-500'>due today</span>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedPayment(rental);
                      setShowPaymentModal(true);
                    }}
                    className='mt-2 inline-flex items-center justify-center rounded-md bg-gradient-to-r from-green-600 to-emerald-700 px-4 py-2 text-white transition-colors hover:from-green-700 hover:to-emerald-800'
                  >
                    <CreditCard className='mr-2 h-4 w-4' />
                    Complete Payment
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        <p className='mt-1 text-sm text-gray-600'>Review and manage your pending or overdue payments</p>
      </div>
      {/* Payments Table */}
      {rentalsLoading ? (
        <div className='flex justify-center rounded-lg bg-white p-6 shadow'>
          <Loader2 className='text-primary h-8 w-8 animate-spin' />
        </div>
      ) : rentalsError ? (
        <div className='rounded-lg bg-white p-6 text-center shadow'>
          <p className='text-red-600'>Error loading payment information</p>
        </div>
      ) : unpaidAuctionRentals.length === 0 ? (
        <div className='rounded-lg bg-white p-6 text-center shadow'>
          <p className='text-gray-600'>You have no pending or overdue payments. Great job!</p>
        </div>
      ) : (
        <div className='overflow-hidden rounded-lg bg-white shadow'>
          <table className='min-w-full divide-y divide-gray-200'>
            <thead className='bg-gray-50'>
              <tr>
                <th className='px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase'>Rental ID</th>
                <th className='px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase'>Apartment ID</th>
                <th className='px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase'>Amount Due</th>
                <th className='px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase'>Due Date</th>
                <th className='px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase'>Status</th>
                <th className='px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase'>Actions</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-200 bg-white'>
              {unpaidAuctionRentals
                .filter((rental) => !completedPayments.includes(rental.id))
                .map((rental: Rental) => {
                  // Calculate the previous day from auctionPaymentDeadline
                  const previousDay =
                    rental.auctionPaymentDeadline
                      ? new Date(new Date(rental.auctionPaymentDeadline).getTime() - 24 * 60 * 60 * 1000)
                      : null;
                  const isToday = previousDay ? new Date(previousDay).toDateString() === today : false;
                  const isFine = rental.auctionFineIssued === true && rental.auctionPaymentConfirmed === false;
                  return (
                    <tr key={`${rental.id}-${rental.apartmentId}`}
                      className={isFine ? 'bg-red-50' : ''}
                    >
                      <td className='px-6 py-4 text-sm whitespace-nowrap text-gray-700'>#{rental.id}</td>
                      <td className='px-6 py-4 text-sm whitespace-nowrap text-gray-700'>#{rental.apartmentId}</td>
                      <td className='px-6 py-4 text-sm whitespace-nowrap'>
                        <div className={`font-bold ${
                          isFine
                            ? 'text-red-600'
                            : rental.status === 'PENDING'
                            ? 'text-amber-600'
                            : rental.status === 'ACTIVE'
                            ? 'text-green-600'
                            : rental.status === 'COMPLETED'
                            ? 'text-gray-600'
                            : 'text-red-600'
                        }`}>
                          ${isFine ? rental.auctionFineAmount : rental.totalCost}
                        </div>
                      </td>
                      <td className='px-6 py-4 text-sm whitespace-nowrap text-gray-700'>
                        {rental.auctionPaymentDeadline ? formatDate(new Date(rental.auctionPaymentDeadline)) : 'No due date specified'}
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          isFine
                            ? 'bg-red-100 text-red-800'
                            : rental.status === 'PENDING'
                            ? 'bg-yellow-100 text-yellow-800'
                            : rental.status === 'ACTIVE'
                            ? 'bg-green-100 text-green-800'
                            : rental.status === 'COMPLETED'
                            ? 'bg-gray-100 text-gray-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {isFine ? 'FINE' : rental.status}
                        </span>
                        {isToday && !isFine && (
                          <span className='ml-2 inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800'>Today</span>
                        )}
                      </td>
                      <td className='px-6 py-4 text-sm font-medium whitespace-nowrap'>
                        {isFine ? (
                          <button
                            onClick={() => {
                              setSelectedPayment(rental);
                              setShowPaymentModal(true);
                              if (setIsFine) setIsFine(true);
                            }}
                            className='inline-flex items-center rounded-md bg-gradient-to-r from-red-500 to-red-700 px-3 py-1 text-sm text-white transition-all hover:from-red-600 hover:to-red-800'
                          >
                            <CreditCard className='mr-1.5 h-3.5 w-3.5' />
                            Pay Fine
                          </button>
                        ) : isToday ? (
                          <button
                            onClick={() => {
                              setSelectedPayment(rental);
                              setShowPaymentModal(true);
                              if (setIsFine) setIsFine(false);
                            }}
                            className='inline-flex items-center rounded-md bg-gradient-to-r from-green-500 to-emerald-600 px-3 py-1 text-sm text-white transition-all hover:from-green-600 hover:to-emerald-700'
                          >
                            <CreditCard className='mr-1.5 h-3.5 w-3.5' />
                            Pay Now
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setSelectedPayment(rental);
                              setShowPaymentModal(true);
                              if (setIsFine) setIsFine(false);
                            }}
                            className='inline-flex items-center rounded-md bg-gradient-to-r from-blue-500 to-indigo-600 px-3 py-1 text-sm text-white transition-all hover:from-blue-600 hover:to-indigo-700'
                          >
                            <CreditCard className='mr-1.5 h-3.5 w-3.5' />
                            Make Payment
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
