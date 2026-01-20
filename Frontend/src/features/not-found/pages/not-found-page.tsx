import NotFoundIcon from '@/core/components/svg/not-found';
import Link from 'next/link';

export default function NotFoundPage() {
  return (
    <div className='flex min-h-screen w-full flex-col items-center justify-center p-4 sm:p-8'>
      <div className='text-center'>
        <NotFoundIcon className='mx-auto mb-4 h-full w-full text-gray-500' />
        <h1 className='text-xl font-bold text-gray-800 sm:text-4xl'>
          Page Not Found
        </h1>
        <p className='mt-2 pb-2 text-sm text-gray-600 sm:text-lg'>
          The page you are looking for does not exist.
        </p>
        <Link
          href='/'
          className='text-primary pt-6 font-semibold hover:underline'
        >
          Return to Home
        </Link>
      </div>
    </div>
  );
}
