import ApartmentCard from '@/features/apartment-list/components/apartment-card';
import useFetchApartmentPhotos from '@/features/apartment-list/hooks/use-fetch-apartment-photos';
import { Apartment } from '@/features/apartment-list/types/apartment';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the next/image component
vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} data-testid='next-image' />
  ),
}));

// Mock the react-loading-skeleton component
vi.mock('react-loading-skeleton', () => ({
  default: ({ height }: { height: string }) => (
    <div data-testid='skeleton' style={{ height }}>
      Loading...
    </div>
  ),
}));

// Mock the custom hook
vi.mock('@/features/apartment-list/hooks/use-fetch-apartment-photos');

describe('ApartmentCard', () => {
  const mockApartment: Apartment = {
    id: 123,
    title: 'Cozy Apartment',
    description: 'A beautiful apartment in the city center',
    rentalPrice: 2500,
    size: 75,
    numberOfRooms: 2,
    numberOfBeds: 3,
    address: {
      street: 'Main Street',
      apartmentNumber: '42A',
      city: 'Warsaw',
      postalCode: '00-001',
      country: 'Poland',
      fullAddress: 'Main Street 42A, 00-001 Warsaw, Poland',
      latitude: 52.2297,
      longitude: 21.0122,
    },
    furnished: true,
    currentlyOccupied: false,
    ownerId: 123,
    kitchen: 'SHARED',
    petsAllowed: false,
    wifi: true,
    parkingSpace: true,
    yardAccess: 'NONE',
    poolAccess: 'NONE',
    disabilityFriendly: false,
    poolFee: 0,
    propertyType: 'APARTMENT',
    availableDateRanges: [],
    occupiedDateRanges: [],
    photoUrls: null,
    coordinates: {
      lat: 52.2297,
      lng: 21.0122,
    },
  };

  // Mock refetch function
  const mockRefetch = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should show skeleton loader when photos are loading', () => {
    vi.mocked(useFetchApartmentPhotos).mockReturnValue({
      photos: null,
      photoObjects: null,
      loading: true,
      error: null,
      refetch: mockRefetch,
    });

    render(<ApartmentCard apt={mockApartment} />);

    expect(screen.getByTestId('skeleton')).toBeInTheDocument();
  });

  it('should show error state', () => {
    vi.mocked(useFetchApartmentPhotos).mockReturnValue({
      photos: null,
      photoObjects: null,
      loading: false,
      error: new Error('Failed to load'),
      refetch: mockRefetch,
    });

    render(<ApartmentCard apt={mockApartment} />);

    expect(screen.getByText('Error loading photo')).toBeInTheDocument();
  });

  it('should show "No photo" when no photos are available', () => {
    vi.mocked(useFetchApartmentPhotos).mockReturnValue({
      photos: [],
      photoObjects: [],
      loading: false,
      error: null,
      refetch: mockRefetch,
    });

    render(<ApartmentCard apt={mockApartment} />);

    expect(screen.getByText('No photo')).toBeInTheDocument();
  });

  it('should render apartment photo when available', () => {
    const mockPhotoUrl = 'https://example.com/photo.jpg';
    vi.mocked(useFetchApartmentPhotos).mockReturnValue({
      photos: [mockPhotoUrl],
      photoObjects: [{ id: 1, url: mockPhotoUrl }],
      loading: false,
      error: null,
      refetch: mockRefetch,
    });

    render(<ApartmentCard apt={mockApartment} />);

    const image = screen.getByTestId('next-image');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', mockPhotoUrl);
    expect(image).toHaveAttribute('alt', mockApartment.title);
  });

  it('should render apartment details correctly', () => {
    vi.mocked(useFetchApartmentPhotos).mockReturnValue({
      photos: ['https://example.com/photo.jpg'],
      photoObjects: [{ id: 1, url: 'https://example.com/photo.jpg' }],
      loading: false,
      error: null,
      refetch: mockRefetch,
    });

    render(<ApartmentCard apt={mockApartment} />);

    // Test title and description
    expect(screen.getByText(mockApartment.title)).toBeInTheDocument();
    expect(screen.getByText(mockApartment.description)).toBeInTheDocument();

    // Test apartment details - fix price unit from zł/mo to zł/day
    expect(
      screen.getByText(`${mockApartment.rentalPrice} zł/day`),
    ).toBeInTheDocument();
    expect(screen.getByText(`${mockApartment.size} m²`)).toBeInTheDocument();

    // Test rooms and beds, which are now on the same line
    expect(screen.getByText(/Rooms:/)).toBeInTheDocument();
    expect(screen.getByText(/Beds:/)).toBeInTheDocument();

    // Test address
    const addressLine1 = screen.getByText(
      `${mockApartment.address.street}, ${mockApartment.address.apartmentNumber}`,
    );
    expect(addressLine1).toBeInTheDocument();

    const addressLine2 = screen.getByText(
      `${mockApartment.address.city}, ${mockApartment.address.postalCode}`,
    );
    expect(addressLine2).toBeInTheDocument();
  });

  it('should call useFetchApartmentPhotos with correct apartment ID', () => {
    vi.mocked(useFetchApartmentPhotos).mockReturnValue({
      photos: [],
      photoObjects: [],
      loading: false,
      error: null,
      refetch: mockRefetch,
    });

    render(<ApartmentCard apt={mockApartment} />);

    expect(useFetchApartmentPhotos).toHaveBeenCalledWith(mockApartment.id);
  });

  it('should render skeleton loader when isLoading prop is true', () => {
    render(<ApartmentCard apt={mockApartment} isLoading={true} />);

    // Should find multiple skeletons for all the placeholder elements
    const skeletons = screen.getAllByTestId('skeleton');
    expect(skeletons.length).toBeGreaterThan(1);

    // Should not call the useFetchApartmentPhotos hook when isLoading is true
    expect(useFetchApartmentPhotos).not.toHaveBeenCalled();
  });

  it('should apply hover effect to non-loading cards', () => {
    vi.mocked(useFetchApartmentPhotos).mockReturnValue({
      photos: [],
      photoObjects: [],
      loading: false,
      error: null,
      refetch: mockRefetch,
    });

    const { container } = render(<ApartmentCard apt={mockApartment} />);
    const card = container.querySelector('li');

    expect(card).toHaveClass('hover:shadow-lg');
    expect(card).toHaveClass('transition');
  });

  it('should not apply hover effect to loading skeleton cards', () => {
    const { container } = render(
      <ApartmentCard apt={mockApartment} isLoading={true} />,
    );
    const card = container.querySelector('li');

    expect(card).not.toHaveClass('hover:shadow-lg');
    expect(card).not.toHaveClass('transition');
  });
});
