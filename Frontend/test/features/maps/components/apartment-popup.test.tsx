import useFetchApartmentPhotos from '@/features/apartment-list/hooks/use-fetch-apartment-photos';
import { Apartment } from '@/features/apartment-list/types/apartment';
import ApartmentPopup from '@/features/maps/components/apartment-popup';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the hook
vi.mock('@/features/apartment-list/hooks/use-fetch-apartment-photos');

// Mock ImageGallery
vi.mock('react-image-gallery', () => ({
  __esModule: true,
  default: ({
    items,
    renderItem,
    renderLeftNav,
    renderRightNav,
  }: {
    items: string[];
    renderItem: (item: string) => React.ReactNode;
    renderLeftNav?: (onClick: () => void) => React.ReactNode;
    renderRightNav?: (onClick: () => void) => React.ReactNode;
  }) => {
    return (
      <div data-testid='image-gallery'>
        {items.map((item, i) => (
          <div key={i} data-testid='gallery-item'>
            {renderItem(item)}
          </div>
        ))}
        {renderLeftNav && (
          <div data-testid='left-nav'>{renderLeftNav(() => {})}</div>
        )}
        {renderRightNav && (
          <div data-testid='right-nav'>{renderRightNav(() => {})}</div>
        )}
      </div>
    );
  },
}));

// Mock Next.js components
vi.mock('next/link', () => ({
  __esModule: true,
  default: ({
    href,
    children,
    className,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

vi.mock('next/image', () => ({
  __esModule: true,
  default: (props) => (
    <img
      src={props.src}
      alt={props.alt}
      className={props.className}
      data-testid='next-image'
    />
  ),
}));

// Sample apartment data
const mockApartment: Apartment = {
  id: 123,
  title: 'Luxury Apartment',
  rentalPrice: 2500,
  numberOfRooms: 3,
  size: 75,
  propertyType: 'APARTMENT',
  address: {
    street: 'Main Street',
    city: 'New York',
    postalCode: '10001',
    country: 'USA',
    apartmentNumber: '10A',
    fullAddress: '10A Main Street, New York, 10001, USA',
    latitude: 40.7128,
    longitude: -74.006,
  },
  description: 'A beautiful apartment',
  coordinates: { lat: 40.7128, lng: -74.006 },
};

describe('ApartmentPopup', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('renders loading state correctly', () => {
    vi.mocked(useFetchApartmentPhotos).mockReturnValue({
      photos: null,
      loading: true,
      error: null,
    });

    render(<ApartmentPopup apt={mockApartment} />);
    expect(screen.getByText('Loading…')).toBeInTheDocument();
  });

  it('renders error state correctly', () => {
    vi.mocked(useFetchApartmentPhotos).mockReturnValue({
      photos: null,
      loading: false,
      error: new Error('Failed to load'),
    });

    render(<ApartmentPopup apt={mockApartment} />);
    expect(screen.getByText('Failed to load photos.')).toBeInTheDocument();
  });

  it('displays "No image" when no photos are available', () => {
    vi.mocked(useFetchApartmentPhotos).mockReturnValue({
      photos: [],
      loading: false,
      error: null,
    });

    render(<ApartmentPopup apt={mockApartment} />);
    expect(screen.getByText('No image')).toBeInTheDocument();
  });

  it('renders photo gallery when photos are available', () => {
    vi.mocked(useFetchApartmentPhotos).mockReturnValue({
      photos: ['photo1.jpg', 'photo2.jpg'],
      loading: false,
      error: null,
    });

    render(<ApartmentPopup apt={mockApartment} />);
    expect(screen.getByTestId('image-gallery')).toBeInTheDocument();
    expect(screen.getAllByTestId('gallery-item')).toHaveLength(2);
    expect(screen.getByTestId('left-nav')).toBeInTheDocument();
    expect(screen.getByTestId('right-nav')).toBeInTheDocument();
  });

  it('renders link to apartment details with correct URL', () => {
    vi.mocked(useFetchApartmentPhotos).mockReturnValue({
      photos: ['photo1.jpg'],
      loading: false,
      error: null,
    });

    render(<ApartmentPopup apt={mockApartment} />);
    const link = screen.getByText('View Details →');
    expect(link).toBeInTheDocument();
    expect(link.closest('a')).toHaveAttribute('href', '/apartment/123');
  });

  it('displays singular "room" text when apartment has only one room', () => {
    const singleRoomApt = { ...mockApartment, numberOfRooms: 1 };
    vi.mocked(useFetchApartmentPhotos).mockReturnValue({
      photos: ['photo1.jpg'],
      loading: false,
      error: null,
    });

    render(<ApartmentPopup apt={singleRoomApt} />);
    expect(screen.getByText(/1 room/)).toBeInTheDocument();
    expect(screen.queryByText(/1 rooms/)).not.toBeInTheDocument();
  });
});
