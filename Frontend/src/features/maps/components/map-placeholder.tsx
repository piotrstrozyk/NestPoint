'use client';

export default function MapPlaceholder() {
  return (
    <div className='flex h-[32rem] w-full items-center justify-center bg-gray-100'>
      <svg
        className='h-8 w-8 animate-spin text-gray-500'
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
          d='M4 12a8 8 0 018-8v8H4z'
        ></path>
      </svg>
      <span className='ml-2 text-gray-500'>Loading map…</span>
    </div>
  );
}
