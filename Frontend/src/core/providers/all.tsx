'use client';

import ClientProvider from '@/core/providers/client';
import { SessionProvider } from 'next-auth/react';
import { PropsWithChildren } from 'react';

const AllProviders = ({ children }: PropsWithChildren) => {
  return (
    <SessionProvider>
      <ClientProvider>{children}</ClientProvider>
    </SessionProvider>
  );
};

export default AllProviders;
