import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ProfileTabs from '@/features/tenant/components/profile-tabs';

const payments = [
  { id: '1', amount: 100, dueDate: '2025-07-01' },
  { id: '2', amount: 200, dueDate: '2025-07-02' },
];

describe('ProfileTabs', () => {
  let setActiveTab: (tab: 'rentals' | 'payments') => void;

  beforeEach(() => {
    setActiveTab = vi.fn();
  });

  it('renders both tabs and highlights rentals as active', () => {
    render(
      <ProfileTabs activeTab='rentals' setActiveTab={setActiveTab} payments={payments} />
    );
    expect(screen.getByText(/my rentals/i)).toBeInTheDocument();
    expect(screen.getByText(/payments due/i)).toBeInTheDocument();
    const rentalsBtn = screen.getByText(/my rentals/i).closest('button');
    const paymentsBtn = screen.getByText(/payments due/i).closest('button');
    expect(rentalsBtn).toHaveClass('border-primary');
    expect(paymentsBtn).not.toHaveClass('border-primary');
  });

  it('highlights payments as active', () => {
    render(
      <ProfileTabs activeTab='payments' setActiveTab={setActiveTab} payments={payments} />
    );
    const paymentsBtn = screen.getByText(/payments due/i).closest('button');
    expect(paymentsBtn).toHaveClass('border-primary');
  });

  it('shows badge with payments count', () => {
    render(
      <ProfileTabs activeTab='payments' setActiveTab={setActiveTab} payments={payments} />
    );
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('does not show badge if payments is empty or undefined', () => {
    render(
      <ProfileTabs activeTab='payments' setActiveTab={setActiveTab} payments={[]} />
    );
    expect(screen.queryByText('0')).not.toBeInTheDocument();
    render(
      <ProfileTabs activeTab='payments' setActiveTab={setActiveTab} />
    );
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('calls setActiveTab when tabs are clicked', () => {
    render(
      <ProfileTabs activeTab='rentals' setActiveTab={setActiveTab} payments={payments} />
    );
    fireEvent.click(screen.getByText(/payments due/i));
    expect(setActiveTab).toHaveBeenCalledWith('payments');
    fireEvent.click(screen.getByText(/my rentals/i));
    expect(setActiveTab).toHaveBeenCalledWith('rentals');
  });
});
