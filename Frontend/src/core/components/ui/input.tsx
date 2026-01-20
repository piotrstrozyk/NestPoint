import { cn } from '@/core/lib/utils';
import { cva, VariantProps } from 'class-variance-authority';
import * as React from 'react';

const inputVariants = cva(
  'w-full h-10 px-4 text-black rounded-2xl bg-white border text-body-md active:ring-0 placeholder-gray-dark focus-ring',
  {
    variants: {
      variant: {
        default:
          'border-outline hover:border-gray active:border-gray-dark focus:border-gray-dark ',
        success: 'border-success',
        error: 'border-error',
        disabled:
          'border-gray-light bg-gray-light placeholder-gray-dark/30 text-gray-dark/30',
        focused: '',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

function Input({
  className,
  type,
  variant,
  ...props
}: React.ComponentProps<'input'> & VariantProps<typeof inputVariants>) {
  return (
    <div className='flex flex-col gap-1'>
      <div className='relative flex items-center'>
        <input
          type={type}
          data-slot='input'
          className={cn(
            inputVariants({ variant }),
            className,
            (variant === 'success' || variant === 'error') && 'pr-10',
          )}
          {...props}
        />
        {variant === 'success' && (
          <span className='text-success absolute inset-y-0 right-3 flex items-center'></span>
        )}
        {variant === 'error' && (
          <span className='text-error absolute inset-y-0 right-3 flex items-center'></span>
        )}
      </div>
    </div>
  );
}

export { Input };
