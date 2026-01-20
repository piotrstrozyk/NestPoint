import { CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React from 'react';

interface SuccessStateProps {
  aptId: number;
  router?: ReturnType<typeof useRouter>;
}

export const SuccessState: React.FC<SuccessStateProps> = ({
  aptId,
  router,
}) => {
  const internalRouter = useRouter();
  const r = router || internalRouter;

  return (
    <div className='-mt-16 flex min-h-screen flex-col items-center justify-center'>
      <div className='w-full max-w-md rounded-lg bg-white p-8 text-center shadow-lg'>
        <CheckCircle className='mx-auto mb-4 h-16 w-16 text-green-500' />
        <h2 className='mb-2 text-2xl font-bold text-gray-800'>Success!</h2>
        <p className='mb-6 text-green-600'>
          Your apartment has been successfully updated.
        </p>
        <div className='flex justify-center gap-4'>
          <button
            onClick={() => r.push(`/apartment/${aptId}`)}
            className='bg-primary rounded-lg px-6 py-2 text-white transition hover:bg-indigo-700'
          >
            View Apartment
          </button>
          <button
            onClick={() => r.push('/owner/apartments')}
            className='rounded-lg border border-gray-300 px-6 py-2 transition hover:bg-gray-50'
          >
            My Apartments
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuccessState;
