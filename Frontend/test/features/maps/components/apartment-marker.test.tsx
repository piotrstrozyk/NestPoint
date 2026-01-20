import { Apartment } from '@/features/apartment-list/types/apartment';
import ApartmentMarker from '@/features/maps/components/apartment-marker';
import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

// Mock the components from react-leaflet
vi.mock('react-leaflet', () => ({
  Marker: ({ position, children }) => (
    <div data-testid='map-marker' data-lat={position[0]} data-lng={position[1]}>
      {children}
    </div>
  ),
  Popup: ({ children, closeOnClick, closeOnEscapeKey }) => (
    <div
      data-testid='map-popup'
      data-close-on-click={closeOnClick}
      data-close-on-escape-key={closeOnEscapeKey}
    >
      {children}
    </div>
  ),
}));

// Mock the ApartmentPopup component
vi.mock('@/features/maps/components/apartment-popup', () => ({
  __esModule: true,
  default: ({ apt }) => (
    <div data-testid='apartment-popup' data-apartment-id={apt.id}></div>
  ),
}));

describe('ApartmentMarker', () => {
  const createMockApartment = (overrides = {}): Apartment => ({
    id: '123',
    title: 'Test Apartment',
    rentalPrice: 1000,
    numberOfRooms: 2,
    size: 50,
    propertyType: 'APARTMENT',
    description: 'A test apartment',
    coordinates: { lat: 0, lng: 0 },
    address: {
      street: 'Test Street',
      city: 'Test City',
      postalCode: '12345',
      country: 'Test Country',
      latitude: 51.5074,
      longitude: -0.1278,
    },
    ...overrides,
  });

  it('returns null when latitude is missing', () => {
    const apartment = createMockApartment({
      address: {
        street: 'Test Street',
        city: 'Test City',
        postalCode: '12345',
        country: 'Test Country',
        latitude: null,
        longitude: -0.1278,
      },
    });

    const { container } = render(<ApartmentMarker apt={apartment} />);
    expect(container.firstChild).toBeNull();
  });

  it('returns null when longitude is missing', () => {
    const apartment = createMockApartment({
      address: {
        street: 'Test Street',
        city: 'Test City',
        postalCode: '12345',
        country: 'Test Country',
        latitude: 51.5074,
        longitude: null,
      },
    });

    const { container } = render(<ApartmentMarker apt={apartment} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders a marker with the correct position when coordinates exist', () => {
    const apartment = createMockApartment();
    const { getByTestId } = render(<ApartmentMarker apt={apartment} />);

    const marker = getByTestId('map-marker');
    expect(marker).toBeInTheDocument();
    expect(marker.getAttribute('data-lat')).toBe('51.5074');
    expect(marker.getAttribute('data-lng')).toBe('-0.1278');
  });

  it('renders a popup with the apartment popup component', () => {
    const apartment = createMockApartment();
    const { getByTestId } = render(<ApartmentMarker apt={apartment} />);

    const popup = getByTestId('map-popup');
    expect(popup).toBeInTheDocument();
    expect(popup.getAttribute('data-close-on-click')).toBe('true');
    expect(popup.getAttribute('data-close-on-escape-key')).toBe('true');

    const apartmentPopup = getByTestId('apartment-popup');
    expect(apartmentPopup).toBeInTheDocument();
    expect(apartmentPopup.getAttribute('data-apartment-id')).toBe('123');
  });
});
