import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/dynamic', () => {
  return {
    __esModule: true,
    default: (
      _importFn: unknown,
      opts: { loading?: () => React.ReactNode },
    ) => {
      return function StubMap() {
        return (
          <div data-testid='address-picker-map'>
            {opts && opts.loading && opts.loading()}
            Map Loaded
          </div>
        );
      };
    },
  };
});

describe('PickerMapModal', () => {
  it('renders the Pick on Map button', async () => {
    const { default: PickerMapModal } = await import(
      '@/features/owner/components/edit-apartment/picker-map-modal'
    );
    render(<PickerMapModal onSelectAddress={vi.fn()} />);
    expect(screen.getByText(/pick on map/i)).toBeInTheDocument();
  });

  it('opens modal when button is clicked', async () => {
    const { default: PickerMapModal } = await import(
      '@/features/owner/components/edit-apartment/picker-map-modal'
    );
    render(<PickerMapModal onSelectAddress={vi.fn()} />);
    fireEvent.click(screen.getByText(/pick on map/i));
    expect(screen.getByTestId('address-picker-map')).toBeInTheDocument();
    expect(screen.getByLabelText('Close map modal')).toBeInTheDocument();
    expect(screen.getByText('Select this address')).toBeInTheDocument();
  });

  it('closes modal when close button is clicked', async () => {
    const { default: PickerMapModal } = await import(
      '@/features/owner/components/edit-apartment/picker-map-modal'
    );
    render(<PickerMapModal onSelectAddress={vi.fn()} />);
    fireEvent.click(screen.getByText(/pick on map/i));
    fireEvent.click(screen.getByLabelText('Close map modal'));
    expect(screen.queryByTestId('address-picker-map')).toBeNull();
  });

  it('closes modal on Escape key', async () => {
    const { default: PickerMapModal } = await import(
      '@/features/owner/components/edit-apartment/picker-map-modal'
    );
    render(<PickerMapModal onSelectAddress={vi.fn()} />);
    fireEvent.click(screen.getByText(/pick on map/i));
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByTestId('address-picker-map')).toBeNull();
  });

  it('Select this address button is disabled when no address is picked', async () => {
    const { default: PickerMapModal } = await import(
      '@/features/owner/components/edit-apartment/picker-map-modal'
    );
    render(<PickerMapModal onSelectAddress={vi.fn()} />);
    fireEvent.click(screen.getByText(/pick on map/i));
    const selectBtn = screen.getByText('Select this address');
    expect(selectBtn).toBeDisabled();
  });

  it('calls onSelectAddress and closes modal when address is picked and button clicked', async () => {
    vi.resetModules();
    const TEST_ADDRESS = {
      street: 'Test St',
      apartmentNumber: '1',
      city: 'Test City',
      postalCode: '00-000',
      country: 'Testland',
      fullAddress: 'Test St 1, Test City, 00-000, Testland',
    };
    vi.doMock('next/dynamic', () => {
      return {
        __esModule: true,
        default: (
          _importFn: unknown,
          opts: { loading?: () => React.ReactNode },
        ) => {
          return function StubMap(props: Record<string, unknown>) {
            React.useEffect(() => {
              if (props.onAddressChange) {
                (props.onAddressChange as (a: typeof TEST_ADDRESS) => void)(
                  TEST_ADDRESS,
                );
              }
            }, [props.onAddressChange]);
            return (
              <div data-testid='address-picker-map'>
                {opts && opts.loading && opts.loading()}
                Map Loaded
              </div>
            );
          };
        },
      };
    });
    const { default: PickerMapModalWithMock } = await import(
      '@/features/owner/components/edit-apartment/picker-map-modal'
    );
    const onSelectAddress = vi.fn();
    render(<PickerMapModalWithMock onSelectAddress={onSelectAddress} />);
    fireEvent.click(screen.getByText(/pick on map/i));
    const selectBtn = await screen.findByText('Select this address');
    await waitFor(() => expect(selectBtn).not.toBeDisabled());
    fireEvent.click(selectBtn);
    expect(onSelectAddress).toHaveBeenCalledWith(TEST_ADDRESS);
    expect(screen.queryByTestId('address-picker-map')).toBeNull();
  });
});
