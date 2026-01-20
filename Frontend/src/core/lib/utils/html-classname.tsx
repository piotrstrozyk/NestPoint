import { type ClassValue, clsx } from 'clsx';

import { extendTailwindMerge } from 'tailwind-merge';

const customTwMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: ['button-md', 'button-sm', 'body-md', 'body-sm', 'body-lg'],
    },
  },
});

const cn = (...inputs: ClassValue[]) => {
  return customTwMerge(clsx(inputs));
};

export default cn;
