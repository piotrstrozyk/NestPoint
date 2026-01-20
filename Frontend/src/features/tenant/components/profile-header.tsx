import { BadgeCheck, Mail, Phone, User, AlertTriangle } from 'lucide-react';
import { OverdueAuctionPayment } from '@/features/tenant/hooks/use-fetch-tenant-overdue';
import type { Owner as Tenant } from '@/features/tenant/hooks/use-fetch-tenant-details';
import ProfileTabs from '@/features/tenant/components/profile-tabs';

interface ProfileHeaderProps {
  tenant: Tenant;
  payments: OverdueAuctionPayment[];
  activeTab: 'rentals' | 'payments';
  setActiveTab: (tab: 'rentals' | 'payments') => void;
}

export default function ProfileHeader({ tenant, payments, activeTab, setActiveTab }: ProfileHeaderProps) {
  return (
    <div className='mb-6 overflow-hidden rounded-lg bg-white shadow'>
      <div className='border-b border-gray-200 p-6 sm:p-8'>
        <div className='mb-6 flex flex-col items-start justify-between md:flex-row md:items-center'>
          <div className='mb-4 flex items-center md:mb-0'>
            {/* User Avatar */}
            <div className='bg-primary/10 mr-4 rounded-full p-3'>
              <User className='text-primary h-12 w-12' />
            </div>
            {/* User Name and Status */}
            <div>
              <h1 className='text-2xl font-bold text-gray-900'>
                {tenant.firstName} {tenant.lastName}
              </h1>
              <div className='mt-1 flex items-center'>
                <BadgeCheck className='text-primary mr-1 h-5 w-5' />
                <span className='text-sm font-medium text-gray-600'>
                  Verified Tenant
                </span>
              </div>
            </div>
          </div>
        </div>
        {/* Profile Details */}
        <div className='mt-6 grid grid-cols-1 gap-6 md:grid-cols-2'>
          <div className='flex items-center'>
            <Mail className='mr-2 h-5 w-5 text-gray-500' />
            <span className='text-gray-600'>{tenant.email}</span>
          </div>
          <div className='flex items-center'>
            <Phone className='mr-2 h-5 w-5 text-gray-500' />
            <span className='text-gray-600'>
              {tenant.phone || 'No phone number provided'}
            </span>
          </div>
        </div>
        {/* Overdue Warning - show if there are overdue payments */}
        {payments && payments.length > 0 && (
          <div className='mt-6'>
            <div className='rounded-md bg-red-50 p-4'>
              <div className='flex'>
                <div className='flex-shrink-0'>
                  <AlertTriangle className='h-5 w-5 text-red-400' aria-hidden='true' />
                </div>
                <div className='ml-3'>
                  <h3 className='text-sm font-medium text-red-800'>
                    Attention Required
                  </h3>
                  <div className='mt-2 text-sm text-red-700'>
                    <p>
                      You have {payments.length} overdue payment{payments.length !== 1 ? 's' : ''}. Please review them in the payments tab.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Profile Tabs attached to header */}
      <ProfileTabs
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />
    </div>
  );
}
