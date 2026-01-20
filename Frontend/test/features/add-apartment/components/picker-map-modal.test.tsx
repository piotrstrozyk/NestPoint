import { fireEvent, render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import PickerMapModal from '../../../../src/features/add-apartment/components/picker-map-modal';

// Mock dynamic import for AddressPickerMap
vi.mock('@//features/add-apartment/components/address-picker-map', () => ({
  __esModule: true,
  default: ({
    onAddressChange,
  }: {
    onAddressChange?: (address: {
      street: string;
      apartmentNumber: string;
      city: string;
      postalCode: string;
      country: string;
      fullAddress: string;
    }) => void;
  }) => (
    <button
      onClick={() =>
        onAddressChange &&
        onAddressChange({
          street: 'Test St',
          apartmentNumber: '1',
          city: 'Test City',
          postalCode: '00-000',
          country: 'Testland',
          fullAddress: 'Test St 1, Test City, 00-000, Testland',
        })
      }
      data-testid='mock-map'
    >
      Mock Map
    </button>
  ),
}));

describe('PickerMapModal', () => {
  it('renders the "Pick on Map" button', () => {
    render(<PickerMapModal onSelectAddress={vi.fn()} />);
    expect(
      screen.getByRole('button', { name: /pick on map/i }),
    ).toBeInTheDocument();
  });

  it('closes the modal when close button is clicked', () => {
    render(<PickerMapModal onSelectAddress={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /pick on map/i }));
    fireEvent.click(screen.getByRole('button', { name: /close map modal/i }));
    expect(
      screen.queryByRole('button', { name: /close map modal/i }),
    ).not.toBeInTheDocument();
  });

  it('closes the modal when Escape is pressed', () => {
    render(<PickerMapModal onSelectAddress={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /pick on map/i }));
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(
      screen.queryByRole('button', { name: /close map modal/i }),
    ).not.toBeInTheDocument();
  });

  it('disables "Select this address" button until address is picked', () => {
    render(<PickerMapModal onSelectAddress={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /pick on map/i }));
    const selectBtn = screen.getByRole('button', {
      name: /select this address/i,
    });
    expect(selectBtn).toBeDisabled();
  });

  it('enables "Select this address" button after address is picked', () => {
    render(<PickerMapModal onSelectAddress={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /pick on map/i }));
    fireEvent.click(screen.getByTestId('mock-map'));
    const selectBtn = screen.getByRole('button', {
      name: /select this address/i,
    });
    expect(selectBtn).not.toBeDisabled();
  });

  it('calls onSelectAddress and closes modal when "Select this address" is clicked', () => {
    const onSelectAddress = vi.fn();
    render(<PickerMapModal onSelectAddress={onSelectAddress} />);
    fireEvent.click(screen.getByRole('button', { name: /pick on map/i }));
    fireEvent.click(screen.getByTestId('mock-map'));
    fireEvent.click(
      screen.getByRole('button', { name: /select this address/i }),
    );
    expect(onSelectAddress).toHaveBeenCalledWith({
      street: 'Test St',
      apartmentNumber: '1',
      city: 'Test City',
      postalCode: '00-000',
      country: 'Testland',
      fullAddress: 'Test St 1, Test City, 00-000, Testland',
    });
    expect(
      screen.queryByRole('button', { name: /close map modal/i }),
    ).not.toBeInTheDocument();
  });
});
