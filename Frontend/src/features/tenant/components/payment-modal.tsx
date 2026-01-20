'use client';

import CreditCardField from '@/features/auctions/components/form-fields/credit-card-field';
import usePostConfirmAuctionPayment, {
  ConfirmAuctionPaymentInput,
} from '@/features/tenant/hooks/use-confirm-auction-payment';
import { usePayAuctionFine } from '@/features/tenant/hooks/use-pay-fine';
import { Check, Loader2, X } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

interface PaymentModalProps {
  rentalId: number;
  auctionId: number;
  amount: number;
  onClose: () => void;
  onSuccess: () => void;
  isFine?: boolean;
}

export default function PaymentModal({
  rentalId,
  auctionId,
  amount,
  onClose,
  onSuccess,
  isFine = false,
}: PaymentModalProps) {
  const [paymentState, setPaymentState] = useState<
    'idle' | 'processing' | 'success' | 'error'
  >('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const { confirmAuctionPayment, loading: loadingNormal } = usePostConfirmAuctionPayment();
  const { payFine, loading: loadingFine } = usePayAuctionFine();

  const loading = isFine ? loadingFine : loadingNormal;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ConfirmAuctionPaymentInput>({
    defaultValues: {
      cardNumber: '',
    },
  });

  const onSubmit = async (data: ConfirmAuctionPaymentInput) => {
    try {
      setPaymentState('processing');
      setErrorMessage('');
      let result;
      if (isFine) {
        result = await payFine({ rentalId, cardNumber: data.cardNumber });
        setPaymentState('success');
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 2000);
        return;
      } else {
        result = await confirmAuctionPayment(rentalId, data);
      }
      if (result && result.success) {
        setPaymentState('success');
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 2000);
      } else {
        setPaymentState('error');
        setErrorMessage(result?.message || 'Payment failed');
      }
    } catch (error) {
      setPaymentState('error');
      setErrorMessage(
        error instanceof Error ? error.message : 'An unknown error occurred',
      );
    }
  };

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'>
      <div
        className={`w-full max-w-md rounded-lg bg-white p-6 shadow-xl ${
          isFine ? 'border-t-8 border-red-600' : 'border-t-8 border-indigo-600'
        }`}
      >
        <div className='mb-6 flex items-center justify-between'>
          <h2
            className={`text-xl font-bold ${
              isFine ? 'text-red-700' : 'text-gray-900'
            }`}
          >
            {isFine ? 'Pay Overdue Fine' : 'Complete Your Payment'}
          </h2>
          <button
            onClick={onClose}
            className='rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600'
            disabled={paymentState === 'processing'}
            aria-label='Close'
          >
            <X className='h-5 w-5' />
          </button>
        </div>

        <div className='mb-6'>
          <div
            className={`mb-4 rounded-md p-4 ${
              isFine ? 'bg-red-50' : 'bg-blue-50'
            }`}
          >
            <div className='flex'>
              <div className='ml-3'>
                <h3
                  className={`text-sm font-medium ${
                    isFine ? 'text-red-800' : 'text-blue-800'
                  }`}
                >
                  {isFine ? 'Overdue Payment Fine Details' : 'Payment Details'}
                </h3>
                <div
                  className={`mt-2 text-sm ${
                    isFine ? 'text-red-700' : 'text-blue-700'
                  }`}
                >
                  <p className='mb-2'>
                    {isFine
                      ? `You are paying a fine for overdue auction payment #${auctionId} (rental #${rentalId})`
                      : `You're paying for auction #${auctionId} (rental #${rentalId})`}
                  </p>
                  <p
                    className={`text-lg font-bold ${
                      isFine ? 'text-red-700' : ''
                    }`}
                  >
                    ${amount.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {paymentState === 'idle' || paymentState === 'error' ? (
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className='mb-6'>
              <CreditCardField<ConfirmAuctionPaymentInput>
                name='cardNumber'
                label='Card Number'
                register={register}
                error={errors.cardNumber}
              />

              {paymentState === 'error' && (
                <p className='mt-4 text-sm text-red-600'>
                  {errorMessage || 'Payment failed. Please try again.'}
                </p>
              )}
            </div>

            <div className='flex justify-end gap-3'>
              <button
                type='button'
                onClick={onClose}
                className='rounded-md bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none'
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type='submit'
                className={`inline-flex items-center rounded-md px-4 py-2 text-sm font-medium text-white shadow-sm focus:ring-2 focus:ring-offset-2 focus:outline-none ${
                  isFine
                    ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                    : 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500'
                }`}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    Processing...
                  </>
                ) : isFine ? (
                  'Pay Fine'
                ) : (
                  'Pay Now'
                )}
              </button>
            </div>
          </form>
        ) : paymentState === 'processing' ? (
          <div className='flex flex-col items-center justify-center py-6'>
            <Loader2 className='h-12 w-12 animate-spin text-indigo-600' />
            <p className='mt-4 text-center text-gray-600'>
              Processing your payment...
            </p>
          </div>
        ) : (
          <div className='flex flex-col items-center justify-center py-6'>
            <div className='flex h-16 w-16 items-center justify-center rounded-full bg-green-100'>
              <Check className='h-8 w-8 text-green-600' />
            </div>
            <h3
              className={`mt-4 text-lg font-medium ${
                isFine ? 'text-red-700' : 'text-gray-900'
              }`}
            >
              {isFine ? 'Fine Paid!' : 'Payment Successful!'}
            </h3>
            <p className='mt-1 text-sm text-gray-500'>
              {isFine
                ? 'Your fine has been processed successfully.'
                : 'Your payment has been processed successfully.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
