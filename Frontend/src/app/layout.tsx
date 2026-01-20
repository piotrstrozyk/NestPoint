import { Toaster } from '@/core/components/sonner';
import CoreLayout from '@/core/layouts/core';
import generateMetadata from '@/core/lib/nextjs-generate-metadata';

const RootLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  return (
    <CoreLayout>
      {children}
      <Toaster />
    </CoreLayout>
  );
};

export { generateMetadata };
export default RootLayout;
