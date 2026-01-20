'use client';

import { formatDate } from '@/core/lib/utils/format-date';
import useFetchOwners from '@/features/add-apartment/hooks/use-fetch-owners';
import useFetchTenants from '@/features/apartment/hooks/use-fetch-tenants';
import useFetchRentals, {
  Rental,
} from '@/features/owner/hooks/use-fetch-rentals';
import {
  BadgeCheck,
  ChevronDown,
  Database,
  Grid,
  Home,
  Loader2,
  Search,
  Shield,
  User,
  Users,
  X,
  Trash,
  Tag,
  AtSign,
  Mail,
  Key,
  Phone,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import useDeleteUser from '@/features/admin-panel/hooks/use-delete-user';
import type { Owner } from '@/features/add-apartment/types/owner';
import type { Tenant } from '@/features/apartment/hooks/use-fetch-tenants';

// Tab options for the panel
type AdminPanelTab = 'owners' | 'tenants' | 'rentals';

// Filter options for rental status
type RentalStatusFilter =
  | 'ALL'
  | 'PENDING'
  | 'ACTIVE'
  | 'COMPLETED'
  | 'CANCELLED';

function ConfirmModal({
  open,
  onConfirm,
  onCancel,
  userName,
}: {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  userName: string;
}) {
  if (!open) return null;
  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/60'>
      <div className='bg-white rounded-lg shadow-lg p-6 w-full max-w-sm'>
        <h2 className='text-lg font-semibold mb-2'>Delete User</h2>
        <p className='mb-4'>
          Are you sure you want to delete{' '}
          <span className='font-bold'>{userName}</span>? This action cannot be
          undone.
        </p>
        <div className='flex justify-end gap-2'>
          <button
            onClick={onCancel}
            className='px-4 py-2 rounded bg-gray-200 hover:bg-gray-300'
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className='px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 flex items-center gap-1'
          >
            <Trash className='h-4 w-4' /> Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// UserDetails type: union of Owner and Tenant
// Only include fields used in the modal
export type UserDetails =
  | (Omit<Owner, 'ownedApartments'> & { ownedApartments?: { id: number }[] })
  | (Omit<Tenant, 'rentals'> & { rentals?: { id: number }[] });

function UserDetailsModal({
  open,
  onClose,
  user,
}: {
  open: boolean;
  onClose: () => void;
  user: UserDetails | null;
}) {
  if (!open || !user) return null;
  // Prepare modal fields with correct types
  const fields: Array<{
    label: string;
    value: string;
    Icon: React.ComponentType<{ className?: string }>;
  }> = [
    { label: 'ID', value: `#${user.id}`, Icon: Tag },
    { label: 'Username', value: user.username, Icon: AtSign },
    { label: 'Name', value: `${user.firstName} ${user.lastName}`, Icon: User },
    { label: 'Email', value: user.email, Icon: Mail },
  ];
  if (user.phone) {
    fields.push({ label: 'Phone', value: user.phone, Icon: Phone });
  }
  if ('ownedApartments' in user && user.ownedApartments) {
    fields.push({
      label: 'Owned Apartments',
      value: String(user.ownedApartments.length),
      Icon: Home,
    });
  }
  if ('rentals' in user && user.rentals) {
    fields.push({
      label: 'Rentals',
      value: String(user.rentals.length),
      Icon: Key,
    });
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="relative bg-white rounded-3xl shadow-xl p-6 md:p-8 w-full max-w-xl mx-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-indigo-100 pb-4">
          <h2 className="text-2xl font-bold text-indigo-700 uppercase tracking-wide">
            User Details
          </h2>
          <button
            onClick={onClose}
            className="bg-gray-100 hover:bg-gray-200 transition p-2 rounded-full"
            aria-label="Close modal"
          >
            <X size={20} className="text-gray-600 hover:text-gray-800" />
          </button>
        </div>

        {/* Content */}
        <dl className="mt-6 divide-y divide-gray-100">
          {fields.map(({ label, value, Icon }, idx) => (
            <div
              key={label}
              className={`grid grid-cols-3 gap-4 py-4 items-center ${idx % 2 === 0 ? 'bg-gray-50' : ''}`}
            >
              <dt className="flex items-center space-x-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                <Icon className="w-4 h-4 text-indigo-500" />
                <span>{label}</span>
              </dt>
              <dd className="col-span-2 text-sm text-gray-700">{value}</dd>
            </div>
          ))}
        </dl>

        {/* Footer */}
        <div className="flex justify-end border-t pt-4 mt-6">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminPanelPage() {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession({
    required: true,
    onUnauthenticated() {
      // Redirect to login if not authenticated
      router.push('/auth/login?callbackUrl=/admin/panel');
    },
  });

  // State for active tab and filters
  const [activeTab, setActiveTab] = useState<AdminPanelTab>('owners');
  const [rentalStatusFilter, setRentalStatusFilter] =
    useState<RentalStatusFilter>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalUser, setModalUser] = useState<{ id: number; name: string } | null>(
    null,
  );
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [detailsUser, setDetailsUser] = useState<UserDetails | null>(null);

  // Check if user is authorized (has ADMIN role)
  useEffect(() => {
    if (sessionStatus === 'authenticated') {
      const userRole = session?.user?.role || '';
      if (userRole !== 'ADMIN') {
        router.push('/unauthorized');
      } else {
        setIsAuthorized(true);
      }
    }
  }, [session, sessionStatus, router]);

  // Fetch all owners
  const {
    owners,
    loading: ownersLoading,
    error: ownersError,
  } = useFetchOwners();

  // Fetch all tenants
  const {
    tenants,
    loading: tenantsLoading,
    error: tenantsError,
    refetch: refetchTenants,
  } = useFetchTenants();

  // Fetch all rentals
  const {
    rentals,
    loading: rentalsLoading,
    error: rentalsError,
  } = useFetchRentals();

  // Filter rentals based on selected status and search term
  const filteredRentals = rentals
    ? rentals
        .filter((rental) =>
          rentalStatusFilter === 'ALL'
            ? true
            : rental.status === rentalStatusFilter,
        )
        .filter((rental) =>
          searchTerm
            ? rental.id.toString().includes(searchTerm) ||
              rental.apartmentId.toString().includes(searchTerm) ||
              rental.tenantId.toString().includes(searchTerm) ||
              rental.ownerId.toString().includes(searchTerm) ||
              rental.address.city
                .toLowerCase()
                .includes(searchTerm.toLowerCase()) ||
              rental.address.country
                .toLowerCase()
                .includes(searchTerm.toLowerCase())
            : true,
        )
    : [];

  // Filter owners based on search term
  const filteredOwners = owners
    ? owners.filter((owner) =>
        searchTerm
          ? owner.id.toString().includes(searchTerm) ||
            owner.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            owner.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            owner.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            owner.username.toLowerCase().includes(searchTerm.toLowerCase())
          : true,
      )
    : [];

  // Filter tenants based on search term
  const filteredTenants = tenants
    ? tenants.filter((tenant) =>
        searchTerm
          ? tenant.id.toString().includes(searchTerm) ||
            tenant.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            tenant.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            tenant.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            tenant.username.toLowerCase().includes(searchTerm.toLowerCase())
          : true,
      )
    : [];

  const deleteUserMutation = useDeleteUser();

  // Loading state for session or authorization check
  if (sessionStatus === 'loading' || !isAuthorized) {
    return (
      <div className='flex h-screen items-center justify-center'>
        <Loader2 className='text-primary h-12 w-12 animate-spin' />
      </div>
    );
  }

  // Error state for any data fetching issues
  if (
    (activeTab === 'owners' && ownersError) ||
    (activeTab === 'tenants' && tenantsError) ||
    (activeTab === 'rentals' && rentalsError)
  ) {
    return (
      <div className='flex h-screen flex-col items-center justify-center'>
        <h2 className='mb-2 text-2xl font-bold text-red-600'>
          Error Loading Data
        </h2>
        <p className='mb-4 text-gray-600'>
          We couldn&apos;t load the requested information.
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
        {/* Page Header with Admin Panel title */}
        <div className='mb-6'>
          <div className='mb-2 flex items-center'>
            <Shield className='text-primary mr-2 h-6 w-6' />
            <h1 className='text-2xl font-bold text-gray-900'>Admin Panel</h1>
          </div>
          <p className='text-gray-600'>
            Manage all users and rentals across the platform
          </p>
        </div>

        {/* Admin Panel Header */}
        <div className='mb-6 overflow-hidden rounded-lg bg-white shadow'>
          {/* Search and filters */}
          <div className='border-b border-gray-200 p-6'>
            <div className='flex flex-col space-y-4 md:flex-row md:items-center md:space-y-0 md:space-x-4'>
              {/* Search */}
              <div className='relative flex-grow'>
                <div className='pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3'>
                  <Search className='h-5 w-5 text-gray-400' />
                </div>
                <input
                  type='text'
                  placeholder='Search by name, email, ID...'
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className='block w-full rounded-md border border-gray-300 bg-white py-2 pr-3 pl-10 text-sm placeholder-gray-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none'
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className='absolute inset-y-0 right-0 flex items-center pr-3'
                  >
                    <X className='h-4 w-4 text-gray-400 hover:text-gray-600' />
                  </button>
                )}
              </div>

              {/* Rental Status Filter - only show when rentals tab is active */}
              {activeTab === 'rentals' && (
                <div className='relative w-full md:w-64'>
                  <select
                    value={rentalStatusFilter}
                    onChange={(e) =>
                      setRentalStatusFilter(
                        e.target.value as RentalStatusFilter,
                      )
                    }
                    className='focus:ring-primary focus:border-primary w-full appearance-none rounded-md border border-gray-300 bg-white py-2 pr-10 pl-3 text-sm leading-5 focus:outline-none'
                  >
                    <option value='ALL'>All Rental Statuses</option>
                    <option value='PENDING'>Pending</option>
                    <option value='ACTIVE'>Active</option>
                    <option value='COMPLETED'>Completed</option>
                    <option value='CANCELLED'>Cancelled</option>
                  </select>
                  <div className='pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700'>
                    <ChevronDown className='h-4 w-4' />
                  </div>
                </div>
              )}

              {/* Data Stats */}
              <div className='flex gap-4 text-sm text-gray-500'>
                <div className='flex items-center'>
                  <Users className='mr-1 h-4 w-4' />
                  <span>{owners?.length || 0} Owners</span>
                </div>
                <div className='flex items-center'>
                  <User className='mr-1 h-4 w-4' />
                  <span>{tenants?.length || 0} Tenants</span>
                </div>
                <div className='flex items-center'>
                  <Home className='mr-1 h-4 w-4' />
                  <span>{rentals?.length || 0} Rentals</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className='border-b border-gray-200'>
            <nav className='-mb-px flex'>
              <button
                onClick={() => setActiveTab('owners')}
                className={`flex items-center border-b-2 px-6 py-4 text-center text-sm font-medium ${
                  activeTab === 'owners'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                <Users className='mr-2 h-5 w-5' />
                Owners
              </button>
              <button
                onClick={() => setActiveTab('tenants')}
                className={`flex items-center border-b-2 px-6 py-4 text-center text-sm font-medium ${
                  activeTab === 'tenants'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                <User className='mr-2 h-5 w-5' />
                Tenants
              </button>
              <button
                onClick={() => setActiveTab('rentals')}
                className={`flex items-center border-b-2 px-6 py-4 text-center text-sm font-medium ${
                  activeTab === 'rentals'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                <Home className='mr-2 h-5 w-5' />
                Rentals
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className='mt-6'>
          {/* Owners Tab */}
          {activeTab === 'owners' && (
            <div>
              <div className='mb-6 flex items-center justify-between'>
                <h2 className='text-xl font-semibold text-gray-800'>
                  All Property Owners
                </h2>

                <div className='flex items-center text-sm text-gray-500'>
                  <Database className='mr-1 h-4 w-4' />
                  <span>
                    {filteredOwners.length}{' '}
                    {filteredOwners.length === 1 ? 'owner' : 'owners'} found
                  </span>
                </div>
              </div>

              {/* Owners Table */}
              {ownersLoading ? (
                <div className='flex justify-center rounded-lg bg-white p-6 shadow'>
                  <Loader2 className='text-primary h-8 w-8 animate-spin' />
                </div>
              ) : filteredOwners.length === 0 ? (
                <div className='rounded-lg bg-white p-6 text-center shadow'>
                  <p className='text-gray-600'>
                    {searchTerm
                      ? 'No owners match your search criteria.'
                      : 'No owners found in the system.'}
                  </p>
                </div>
              ) : (
                <div className='overflow-hidden rounded-lg bg-white shadow'>
                  <table className='min-w-full divide-y divide-gray-200'>
                    <thead className='bg-gray-50'>
                      <tr>
                        <th
                          scope='col'
                          className='px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase'
                        >
                          ID
                        </th>
                        <th
                          scope='col'
                          className='px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase'
                        >
                          User
                        </th>
                        <th
                          scope='col'
                          className='px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase'
                        >
                          Contact
                        </th>
                        <th
                          scope='col'
                          className='px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase'
                        >
                          Properties
                        </th>
                        <th
                          scope='col'
                          className='px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase'
                        >
                          Status
                        </th>
                        <th
                          scope='col'
                          className='px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase'
                        >
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className='divide-y divide-gray-200 bg-white'>
                      {filteredOwners.map((owner) => (
                        <tr key={owner.id}>
                          <td className='px-6 py-4 text-sm whitespace-nowrap text-gray-700'>
                            #{owner.id}
                          </td>
                          <td className='px-6 py-4 text-sm whitespace-nowrap'>
                            <div className='flex items-center'>
                              <div className='bg-primary/10 mr-3 flex h-10 w-10 items-center justify-center rounded-full'>
                                <User className='text-primary h-5 w-5' />
                              </div>
                              <div>
                                <div className='font-medium text-gray-900'>
                                  {owner.firstName} {owner.lastName}
                                </div>
                                <div className='text-sm text-gray-500'>
                                  {owner.username}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className='px-6 py-4 text-sm whitespace-nowrap text-gray-700'>
                            <div className='mb-1'>{owner.email}</div>
                            {owner.phone && (
                              <div className='text-xs text-gray-500'>
                                {owner.phone}
                              </div>
                            )}
                          </td>
                          <td className='px-6 py-4 text-sm whitespace-nowrap text-gray-700'>
                            {owner.ownedApartments
                              ? owner.ownedApartments.length
                              : 0}
                          </td>
                          <td className='px-6 py-4 whitespace-nowrap'>
                            <span className='inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800'>
                              <BadgeCheck className='mr-1 h-3 w-3' />
                              Active
                            </span>
                          </td>
                          <td className='px-6 py-4 text-sm font-medium whitespace-nowrap'>
                            <div className='flex space-x-2'>
                              <button
                                onClick={() => {
                                  setDetailsUser(owner);
                                  setDetailsModalOpen(true);
                                }}
                                className='text-primary hover:text-primary-dark'
                              >
                                View
                              </button>
                              <button
                                onClick={() => {
                                  setModalUser({
                                    id: owner.id,
                                    name: `${owner.firstName} ${owner.lastName}`,
                                  });
                                  setModalOpen(true);
                                }}
                                className='text-red-600 hover:text-red-800 flex items-center gap-1'
                                title='Delete user'
                              >
                                <Trash className='h-4 w-4' /> Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Tenants Tab */}
          {activeTab === 'tenants' && (
            <div>
              <div className='mb-6 flex items-center justify-between'>
                <h2 className='text-xl font-semibold text-gray-800'>
                  All Tenants
                </h2>

                <div className='flex items-center text-sm text-gray-500'>
                  <Database className='mr-1 h-4 w-4' />
                  <span>
                    {filteredTenants.length}{' '}
                    {filteredTenants.length === 1 ? 'tenant' : 'tenants'} found
                  </span>
                </div>
              </div>

              {/* Tenants Table */}
              {tenantsLoading ? (
                <div className='flex justify-center rounded-lg bg-white p-6 shadow'>
                  <Loader2 className='text-primary h-8 w-8 animate-spin' />
                </div>
              ) : filteredTenants.length === 0 ? (
                <div className='rounded-lg bg-white p-6 text-center shadow'>
                  <p className='text-gray-600'>
                    {searchTerm
                      ? 'No tenants match your search criteria.'
                      : 'No tenants found in the system.'}
                  </p>
                </div>
              ) : (
                <div className='overflow-hidden rounded-lg bg-white shadow'>
                  <table className='min-w-full divide-y divide-gray-200'>
                    <thead className='bg-gray-50'>
                      <tr>
                        <th
                          scope='col'
                          className='px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase'
                        >
                          ID
                        </th>
                        <th
                          scope='col'
                          className='px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase'
                        >
                          User
                        </th>
                        <th
                          scope='col'
                          className='px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase'
                        >
                          Contact
                        </th>
                        <th
                          scope='col'
                          className='px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase'
                        >
                          Rentals
                        </th>
                        <th
                          scope='col'
                          className='px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase'
                        >
                          Status
                        </th>
                        <th
                          scope='col'
                          className='px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase'
                        >
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className='divide-y divide-gray-200 bg-white'>
                      {filteredTenants.map((tenant) => (
                        <tr key={tenant.id}>
                          <td className='px-6 py-4 text-sm whitespace-nowrap text-gray-700'>
                            #{tenant.id}
                          </td>
                          <td className='px-6 py-4 text-sm whitespace-nowrap'>
                            <div className='flex items-center'>
                              <div className='mr-3 flex h-10 w-10 items-center justify-center rounded-full bg-blue-50'>
                                <User className='h-5 w-5 text-blue-500' />
                              </div>
                              <div>
                                <div className='font-medium text-gray-900'>
                                  {tenant.firstName} {tenant.lastName}
                                </div>
                                <div className='text-sm text-gray-500'>
                                  {tenant.username}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className='px-6 py-4 text-sm whitespace-nowrap text-gray-700'>
                            <div className='mb-1'>{tenant.email}</div>
                            {tenant.phone && (
                              <div className='text-xs text-gray-500'>
                                {tenant.phone}
                              </div>
                            )}
                          </td>
                          <td className='px-6 py-4 text-sm whitespace-nowrap text-gray-700'>
                            {tenant.rentals ? tenant.rentals.length : 0}
                          </td>
                          <td className='px-6 py-4 whitespace-nowrap'>
                            <span className='inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800'>
                              <BadgeCheck className='mr-1 h-3 w-3' />
                              Active
                            </span>
                          </td>
                          <td className='px-6 py-4 text-sm font-medium whitespace-nowrap'>
                            <div className='flex space-x-2'>
                              <button
                                onClick={() => {
                                  setDetailsUser({
                                    ...tenant,
                                    rentals: Array.isArray(tenant.rentals)
                                      ? tenant.rentals.map((r) => ({ id: (r as { id?: number }).id ?? 0 }))
                                      : [],
                                    ownedApartments: Array.isArray(tenant.ownedApartments)
                                      ? tenant.ownedApartments.map((a) => ({ id: (a as { id?: number }).id ?? 0 }))
                                      : [],
                                  });
                                  setDetailsModalOpen(true);
                                }}
                                className='text-primary hover:text-primary-dark'
                              >
                                View
                              </button>
                              <button
                                onClick={() => {
                                  setModalUser({
                                    id: tenant.id,
                                    name: `${tenant.firstName} ${tenant.lastName}`,
                                  });
                                  setModalOpen(true);
                                }}
                                className='text-red-600 hover:text-red-800 flex items-center gap-1'
                                title='Delete user'
                              >
                                <Trash className='h-4 w-4' /> Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Rentals Tab */}
          {activeTab === 'rentals' && (
            <div>
              <div className='mb-6 flex items-center justify-between'>
                <h2 className='text-xl font-semibold text-gray-800'>
                  All Rental Transactions
                </h2>

                <div className='flex items-center text-sm text-gray-500'>
                  <Database className='mr-1 h-4 w-4' />
                  <span>
                    {filteredRentals.length}{' '}
                    {filteredRentals.length === 1 ? 'rental' : 'rentals'} found
                  </span>
                </div>
              </div>

              {/* Rentals Table */}
              {rentalsLoading ? (
                <div className='flex justify-center rounded-lg bg-white p-6 shadow'>
                  <Loader2 className='text-primary h-8 w-8 animate-spin' />
                </div>
              ) : filteredRentals.length === 0 ? (
                <div className='rounded-lg bg-white p-6 text-center shadow'>
                  <p className='text-gray-600'>
                    {searchTerm || rentalStatusFilter !== 'ALL'
                      ? 'No rentals match your search criteria.'
                      : 'No rentals found in the system.'}
                  </p>
                </div>
              ) : (
                <div className='overflow-hidden rounded-lg bg-white shadow'>
                  <table className='min-w-full divide-y divide-gray-200'>
                    <thead className='bg-gray-50'>
                      <tr>
                        <th
                          scope='col'
                          className='px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase'
                        >
                          ID
                        </th>
                        <th
                          scope='col'
                          className='px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase'
                        >
                          Property
                        </th>
                        <th
                          scope='col'
                          className='px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase'
                        >
                          Tenant
                        </th>
                        <th
                          scope='col'
                          className='px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase'
                        >
                          Owner
                        </th>
                        <th
                          scope='col'
                          className='px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase'
                        >
                          Dates & Cost
                        </th>
                        <th
                          scope='col'
                          className='px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase'
                        >
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className='divide-y divide-gray-200 bg-white'>
                      {filteredRentals.map((rental: Rental) => (
                        <tr key={rental.id}>
                          <td className='px-6 py-4 text-sm whitespace-nowrap text-gray-700'>
                            #{rental.id}
                          </td>
                          <td className='px-6 py-4 text-sm whitespace-nowrap text-gray-900'>
                            <div className='flex items-start'>
                              <div>
                                <Link
                                  href={`/apartment/${rental.apartmentId}`}
                                  className='text-primary font-medium hover:underline'
                                >
                                  Apt #{rental.apartmentId}
                                </Link>
                                <div className='text-xs text-gray-500'>
                                  {rental.address.city},{' '}
                                  {rental.address.country}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className='px-6 py-4 text-sm whitespace-nowrap text-gray-700'>
                            <Link
                              href={`/admin/users/${rental.tenantId}`}
                              className='text-blue-600 hover:underline'
                            >
                              #{rental.tenantId}
                            </Link>
                          </td>
                          <td className='px-6 py-4 text-sm whitespace-nowrap text-gray-700'>
                            <Link
                              href={`/admin/users/${rental.ownerId}`}
                              className='text-primary hover:underline'
                            >
                              #{rental.ownerId}
                            </Link>
                          </td>
                          <td className='px-6 py-4 text-sm whitespace-nowrap text-gray-700'>
                            <div className='font-medium'>
                              {formatDate(rental.startDate)}
                            </div>
                            <div className='text-xs text-gray-500'>
                              to {formatDate(rental.endDate)}
                            </div>
                            <div className='mt-1 font-bold text-gray-900'>
                              ${rental.totalCost}
                            </div>
                          </td>
                          <td className='px-6 py-4 whitespace-nowrap'>
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                rental.status === 'PENDING'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : rental.status === 'ACTIVE'
                                    ? 'bg-green-100 text-green-800'
                                    : rental.status === 'COMPLETED'
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {rental.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Admin Stats Dashboard - visible on all tabs */}
        <div className='mt-8 rounded-lg bg-white p-6 shadow'>
          <div className='mb-4 flex items-center'>
            <Grid className='mr-2 h-5 w-5 text-gray-600' />
            <h3 className='text-lg font-medium text-gray-800'>
              Platform Statistics
            </h3>
          </div>

          <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
            {/* Total Users */}
            <div className='rounded-lg bg-indigo-50 p-4'>
              <div className='text-sm font-medium text-indigo-600'>
                Total Users
              </div>
              <div className='mt-2 text-3xl font-bold text-indigo-900'>
                {(owners?.length || 0) + (tenants?.length || 0)}
              </div>
              <div className='mt-1 flex items-center text-xs text-indigo-700'>
                <span className='mr-1'>{owners?.length || 0} owners</span>
                <span className='mx-1'>•</span>
                <span>{tenants?.length || 0} tenants</span>
              </div>
            </div>

            {/* Total Rentals */}
            <div className='rounded-lg bg-blue-50 p-4'>
              <div className='text-sm font-medium text-blue-600'>
                Total Rentals
              </div>
              <div className='mt-2 text-3xl font-bold text-blue-900'>
                {rentals?.length || 0}
              </div>
              <div className='mt-1 flex items-center text-xs text-blue-700'>
                <span>
                  {rentals?.filter((r) => r.status === 'ACTIVE').length || 0}{' '}
                  active rentals
                </span>
              </div>
            </div>

            {/* Total Revenue */}
            <div className='rounded-lg bg-green-50 p-4'>
              <div className='text-sm font-medium text-green-600'>
                Total Revenue
              </div>
              <div className='mt-2 text-3xl font-bold text-green-900'>
                $
                {rentals
                  ?.reduce((sum, rental) => sum + rental.totalCost, 0)
                  .toFixed(2) || '0.00'}
              </div>
              <div className='mt-1 text-xs text-green-700'>
                From{' '}
                {rentals?.filter((r) => r.status === 'COMPLETED').length || 0}{' '}
                completed rentals
              </div>
            </div>

            {/* Pending Approvals */}
            <div className='rounded-lg bg-amber-50 p-4'>
              <div className='text-sm font-medium text-amber-600'>
                Pending Approval
              </div>
              <div className='mt-2 text-3xl font-bold text-amber-900'>
                {rentals?.filter((r) => r.status === 'PENDING').length || 0}
              </div>
              <div className='mt-1 text-xs text-amber-700'>
                <Link href='/admin/approvals' className='hover:underline'>
                  Review pending rentals
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Confirmation Modal */}
        <ConfirmModal
          open={modalOpen}
          userName={modalUser?.name || ''}
          onCancel={() => setModalOpen(false)}
          onConfirm={async () => {
            if (modalUser) {
              await deleteUserMutation.deleteUser(modalUser.id);
              setModalOpen(false);
              setModalUser(null);
              if (activeTab === 'tenants' && typeof refetchTenants === 'function') {
                refetchTenants();
              }
            }
          }}
        />

        {/* User Details Modal */}
        <UserDetailsModal
          open={detailsModalOpen}
          user={detailsUser}
          onClose={() => setDetailsModalOpen(false)}
        />
      </div>
    </div>
  );
}
