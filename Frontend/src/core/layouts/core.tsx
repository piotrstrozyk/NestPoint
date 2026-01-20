import { Footer, Navbar } from '@/core/components';
import '@/core/css/globals.css';
import HtmlLayout from '@/core/layouts/html';
import AllProviders from '@/core/providers/all';

const CoreLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  return (
    <HtmlLayout>
      <AllProviders>
        <div className='flex min-h-dvh flex-col'>
          <Navbar />
          <main className='bg-background flex flex-1 flex-col bg-cover bg-center bg-no-repeat'>
            {children}
          </main>
          <Footer />
        </div>
      </AllProviders>
    </HtmlLayout>
  );
};

export default CoreLayout;
