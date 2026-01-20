import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/core/lib/utils';

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-base transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-zinc-950 focus-visible:ring-zinc-950/50 focus-visible:ring-[3px] aria-invalid:ring-red-500/20 dark:aria-invalid:ring-red-500/40 aria-invalid:border-red-500 dark:focus-visible:border-zinc-300 dark:focus-visible:ring-zinc-300/50 dark:aria-invalid:ring-red-900/20 dark:dark:aria-invalid:ring-red-900/40 dark:aria-invalid:border-red-900",
  {
    variants: {
      variant: {
        default:
          'bg-zinc-900 text-zinc-50 shadow-xs hover:bg-zinc-900/90 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-50/90',
        destructive:
          'bg-red-500 text-white shadow-xs hover:bg-red-500/90 focus-visible:ring-red-500/20 dark:focus-visible:ring-red-500/40 dark:bg-red-500/60 dark:bg-red-900 dark:hover:bg-red-900/90 dark:focus-visible:ring-red-900/20 dark:dark:focus-visible:ring-red-900/40 dark:dark:bg-red-900/60',
        outline:
          'border bg-white shadow-xs hover:bg-zinc-100 hover:text-zinc-900 dark:bg-zinc-200/30 dark:border-zinc-200 dark:hover:bg-zinc-200/50 dark:bg-zinc-950 dark:hover:bg-zinc-800 dark:hover:text-zinc-50 dark:dark:bg-zinc-800/30 dark:dark:border-zinc-800 dark:dark:hover:bg-zinc-800/50',
        secondary:
          'bg-zinc-100 text-zinc-900 shadow-xs hover:bg-zinc-100/80 dark:bg-zinc-800 dark:text-zinc-50 dark:hover:bg-zinc-800/80',
        ghost:
          'hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-100/50 dark:hover:bg-zinc-800 dark:hover:text-zinc-50 dark:dark:hover:bg-zinc-800/50',
        link: 'text-zinc-900 underline-offset-4 hover:underline dark:text-zinc-50',
        pill: 'inline-flex items-center py-0 rounded bg-[#893e43] text-sm font-semibold text-white shadow-md ring-1 hover:bg-[#772d33] focus-visible:ring-[#893e43]/50',
        logoutPill:
          'inline-flex items-center py-0 rounded bg-[#893e43] text-sm font-semibold text-white shadow-md ring-1 hover:bg-[#b81a27] focus-visible:ring-[#893e43]/50',
        loginPill:
          'inline-flex items-center py-0 rounded bg-indigo-600 text-sm font-semibold text-white shadow-md ring-1 hover:bg-indigo-700 focus-visible:ring-indigo-600/50',
        ghostPrimary:
          'text-black text-base rounded-md border border-transparent transition-colors hover:text-[#893e43] hover:border-[#893e43]',
        indigoGreen:
          'rounded bg-indigo-600 px-3 py-1 text-white transition-colors hover:bg-green-600 focus-visible:ring-2 focus-visible:ring-green-600/50',
      },
      size: {
        default: 'h-8 px-4 py-0 has-[>svg]:px-3',
        sm: 'h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5',
        lg: 'h-8 rounded-md px-6 has-[>svg]:px-4',
        icon: 'size-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : 'button';

  return (
    <Comp
      data-slot='button'
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
