import React from 'react';
import { Home, CreditCard } from 'lucide-react';

interface Payment {
  id: string;
  amount: number;
  dueDate: string;
}

interface ProfileTabsProps {
  activeTab: 'rentals' | 'payments';
  setActiveTab: (tab: 'rentals' | 'payments') => void;
  payments?: Payment[];
}

const ProfileTabs: React.FC<ProfileTabsProps> = ({ activeTab, setActiveTab, payments }) => (
  <div className='border-b border-gray-200'>
    <nav className='-mb-px flex'>
      <button
        onClick={() => setActiveTab('rentals')}
        className={`flex items-center border-b-2 px-6 py-4 text-center text-sm font-medium ${
          activeTab === 'rentals'
            ? 'border-primary text-primary'
            : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
        }`}
      >
        <Home className='mr-2 h-5 w-5' />
        My Rentals
      </button>
      <button
        onClick={() => setActiveTab('payments')}
        className={`flex items-center border-b-2 px-6 py-4 text-center text-sm font-medium ${
          activeTab === 'payments'
            ? 'border-primary text-primary'
            : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
        }`}
      >
        <CreditCard className='mr-2 h-5 w-5' />
        Payments Due
        {payments && payments.length > 0 && (
          <span className='ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800'>
            {payments.length}
          </span>
        )}
      </button>
    </nav>
  </div>
);

export default ProfileTabs;
