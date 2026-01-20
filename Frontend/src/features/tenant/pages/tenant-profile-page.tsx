'use client';

import PaymentModal from '@/features/tenant/components/payment-modal';
import ProfileHeader from '@/features/tenant/components/profile-header';
import RentalsSection from '@/features/tenant/components/rentals-section';
import PaymentsSection from '@/features/tenant/components/payments-section';
import useFetchTenant from '@/features/tenant/hooks/use-fetch-tenant-details';
import useFetchTenantRentals, { Rental } from '@/features/tenant/hooks/use-fetch-tenant-rentals';
import {
  Loader2,
  Shield,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

// Tab options for the profile
type ProfileTab = 'rentals' | 'payments';

// Filter options for rental status
type RentalStatusFilter =
  | 'ALL'
  | 'PENDING'
  | 'ACTIVE'
  | 'COMPLETED'
  | 'CANCELLED';

export default function TenantProfilePage() {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession({
    required: true,
    onUnauthenticated() {
      // Redirect to login if not authenticated
      router.push('/auth/login?callbackUrl=/tenant/profile');
    },
  });

  // State for active tab and rental status filter
  const [activeTab, setActiveTab] = useState<ProfileTab>('rentals');
  const [rentalStatusFilter, setRentalStatusFilter] =
    useState<RentalStatusFilter>('ALL');
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);

  const [selectedPayment, setSelectedPayment] =
    useState<Rental | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [completedPayments, setCompletedPayments] = useState<number[]>([]);
  const [isFine, setIsFine] = useState(false);

  const handlePaymentSuccess = () => {
    if (selectedPayment) {
      setCompletedPayments([...completedPayments, selectedPayment.id]);
    }
  };

  useEffect(() => {
    if (sessionStatus === 'authenticated') {
      const userRole = session?.user?.role || '';
      if (userRole !== 'TENANT') {
        router.push('/unauthorized');
      } else {
        setIsAuthorized(true);
      }
    }
  }, [session, sessionStatus, router]);

  // Get the tenant ID from the session
  const tenantId = session?.user?.id as number;

  // Fetch tenant details using the ID from session
  const {
    tenant,
    loading: tenantLoading,
    error: tenantError,
  } = useFetchTenant(tenantId);

  // Fetch tenant rentals
  const {
    rentals,
    loading: rentalsLoading,
    error: rentalsError,
  } = useFetchTenantRentals(tenantId, 'PENDING');

  // Loading state for session or authorization check
  if (sessionStatus === 'loading' || !isAuthorized) {
    return (
      <div className='flex h-screen items-center justify-center'>
        <Loader2 className='text-primary h-12 w-12 animate-spin' />
      </div>
    );
  }

  // Loading state for tenant data
  if (tenantLoading) {
    return (
      <div className='flex h-screen items-center justify-center'>
        <Loader2 className='text-primary h-12 w-12 animate-spin' />
      </div>
    );
  }

  // Error state
  if (tenantError || !tenant) {
    return (
      <div className='flex h-screen flex-col items-center justify-center'>
        <h2 className='mb-2 text-2xl font-bold text-red-600'>
          Error Loading Profile
        </h2>
        <p className='mb-4 text-gray-600'>
          We couldn&apos;t load your profile information.
        </p>
        <button
          onClick={() => router.push('/')}
          className='bg-primary rounded-md px-4 py-2 text-white'
        >
          Go to Home
        </button>
      </div>
    );
  }

  return (
    <div className='bg-background-primary min-h-screen pt-24 pb-12'>
      <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
        {/* Page Header with Tenant Dashboard title */}
        <div className='mb-6'>
          <div className='mb-2 flex items-center'>
            <Shield className='text-primary mr-2 h-6 w-6' />
            <h1 className='text-2xl font-bold text-gray-900'>
              Tenant Dashboard
            </h1>
          </div>
          <p className='text-gray-600'>
            Manage your rentals and payment information
          </p>
        </div>

        {/* Profile Header */}
        <ProfileHeader
          tenant={tenant}
          payments={[]}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />

        {/* Tab Content */}
        <div className='mt-6'>
          {/* Rentals Tab */}
          {activeTab === 'rentals' && (
            <RentalsSection
              rentals={rentals || []}
              rentalsLoading={rentalsLoading}
              rentalsError={rentalsError}
              rentalStatusFilter={rentalStatusFilter}
              setRentalStatusFilter={(status) => setRentalStatusFilter(status as RentalStatusFilter)}
            />
          )}

          {/* Payments Tab */}
          {activeTab === 'payments' && (
            <PaymentsSection
              rentals={rentals || []}
              rentalsLoading={rentalsLoading}
              rentalsError={rentalsError}
              completedPayments={completedPayments}
              setSelectedPayment={setSelectedPayment}
              setShowPaymentModal={setShowPaymentModal}
              setIsFine={setIsFine}
            />
          )}
        </div>
      </div>

      {showPaymentModal && selectedPayment && (
        <PaymentModal
          rentalId={selectedPayment.id}
          auctionId={selectedPayment.id}
          amount={isFine ? selectedPayment.auctionFineAmount : selectedPayment.totalCost}
          isFine={isFine}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}
