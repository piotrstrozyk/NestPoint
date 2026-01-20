import { render, screen } from '@testing-library/react';
import { KeyDetails } from '@/features/apartment/components/details';
import { describe, it, expect } from 'vitest';

const mockApartment = {
  size: 55,
  numberOfRooms: 3,
  numberOfBeds: 2,
  rentalPrice: 2500,
  furnished: true,
  kitchen: 'Open',
  wifi: true,
  petsAllowed: false,
  parkingSpace: true,
  poolAccess: 'Yes',
  poolFee: 100,
  disabilityFriendly: false,
  yardAccess: 'Shared',
};

describe('KeyDetails', () => {
  it('renders all key details and values', () => {
    render(<KeyDetails apartment={mockApartment} />);
    expect(screen.getByText('Key Details')).toBeInTheDocument();
    expect(screen.getByText('Furnished')).toBeInTheDocument();
    expect(screen.getAllByText('Yes').length).toBeGreaterThan(0); // furnished, wifi, poolAccess, parkingSpace
    expect(screen.getByText('Beds')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument(); // beds
    expect(screen.getByText('Kitchen')).toBeInTheDocument();
    expect(screen.getByText('Open')).toBeInTheDocument();
    expect(screen.getByText('Wi‑Fi')).toBeInTheDocument();
    expect(screen.getAllByText('Yes').length).toBeGreaterThan(1); // wifi, poolAccess, parkingSpace
    expect(screen.getByText('Pets')).toBeInTheDocument();
    expect(screen.getAllByText('No').length).toBeGreaterThan(0); // petsAllowed, disabilityFriendly
    expect(screen.getByText('Parking')).toBeInTheDocument();
    expect(screen.getByText('Pool')).toBeInTheDocument();
    expect(screen.getByText('Pool Fee')).toBeInTheDocument();
    expect(screen.getByText('100 zł')).toBeInTheDocument();
    expect(screen.getByText('Yard')).toBeInTheDocument();
    expect(screen.getByText('Shared')).toBeInTheDocument();
    expect(screen.getByText('Accessible')).toBeInTheDocument();
    expect(screen.getByText('Size')).toBeInTheDocument();
    expect(screen.getByText('55 m²')).toBeInTheDocument();
    expect(screen.getByText('Rooms')).toBeInTheDocument();
    expect(screen.getAllByText('3').length).toBeGreaterThan(0); // numberOfRooms
  });

  it('renders correct values for false/No fields', () => {
    render(
      <KeyDetails
        apartment={{ ...mockApartment, furnished: false, wifi: false, petsAllowed: false, parkingSpace: false, disabilityFriendly: false }}
      />
    );
    expect(screen.getAllByText('No').length).toBeGreaterThan(1);
  });
});
