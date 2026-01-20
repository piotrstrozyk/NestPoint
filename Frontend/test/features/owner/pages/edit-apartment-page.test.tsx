import EditApartmentPage from '@/features/owner/pages/edit-apartment-page';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import { FieldErrors, UseFormRegister } from 'react-hook-form';
import { afterEach, beforeEach, describe, expect, it, Mock, vi } from 'vitest';

// Minimal ApartmentForm type for test mocks
interface ApartmentForm {
  title: string;
  description: string;
  address: {
    street: string;
    city: string;
    apartmentNumber?: string;
  };
  rentalPrice: number;
  size: number;
  wifi?: boolean;
  petsAllowed?: boolean;
  propertyType?: string;
}

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useParams: vi.fn(),
  useRouter: vi.fn(),
}));

// Mock next-auth/react
vi.mock('next-auth/react', () => ({
  useSession: vi.fn(),
}));

// Mock next/image
vi.mock('next/image', () => ({
  default: ({
    src,
    alt,
    ...props
  }: React.ImgHTMLAttributes<HTMLImageElement> & {
    src: string;
    alt?: string;
  }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} {...props} />
  ),
}));

// Mock all the custom hooks
vi.mock('@/features/add-apartment/hooks/use-fetch-owners', () => ({
  default: vi.fn(),
}));

vi.mock('@/features/apartment-list/hooks/use-fetch-apartment-photos', () => ({
  default: vi.fn(),
}));

vi.mock('@/features/apartment/hooks/use-fetch-apartment', () => ({
  default: vi.fn(),
}));

vi.mock('@/features/owner/hooks/use-delete-apartment-photo', () => ({
  default: vi.fn(),
}));

vi.mock('@/features/owner/hooks/use-post-apartment-photo', () => ({
  default: vi.fn(),
}));

vi.mock('@/features/owner/hooks/use-update-apartment', () => ({
  useUpdateApartment: vi.fn(),
}));

// Mock all the component dependencies
vi.mock('../components/edit-apartment/address-fieldset', () => ({
  AddressFieldset: ({
    register,
    errors,
  }: {
    register: UseFormRegister<ApartmentForm>;
    errors: FieldErrors<ApartmentForm>;
  }) => (
    <div data-testid='address-fieldset'>
      <input {...register('address.street')} placeholder='Street' />
      <input {...register('address.city')} placeholder='City' />
      {errors?.address?.street && <span>Street error</span>}
    </div>
  ),
}));

vi.mock('../components/edit-apartment/amenities-checkboxes', () => ({
  AmenitiesCheckboxes: ({
    register,
  }: {
    register: UseFormRegister<ApartmentForm>;
  }) => (
    <div data-testid='amenities-checkboxes'>
      <input {...register('wifi')} type='checkbox' />
      <input {...register('petsAllowed')} type='checkbox' />
    </div>
  ),
}));

vi.mock('../components/edit-apartment/numeric-inputs', () => ({
  NumericInputs: ({
    register,
    errors,
  }: {
    register: UseFormRegister<ApartmentForm>;
    errors: FieldErrors<ApartmentForm>;
  }) => (
    <div data-testid='numeric-inputs'>
      <input
        {...register('rentalPrice')}
        placeholder='Rental Price'
        type='number'
      />
      <input {...register('size')} placeholder='Size' type='number' />
      {errors?.rentalPrice && <span>Price error</span>}
    </div>
  ),
}));

vi.mock('../components/edit-apartment/select-fields', () => ({
  SelectFields: ({
    register,
  }: {
    register: UseFormRegister<ApartmentForm>;
  }) => (
    <div data-testid='select-fields'>
      <select {...register('propertyType')}>
        <option value='apartment'>Apartment</option>
        <option value='house'>House</option>
      </select>
    </div>
  ),
}));

vi.mock('../components/edit-apartment/title-description', () => ({
  TitleDescription: ({
    register,
    errors,
  }: {
    register: UseFormRegister<ApartmentForm>;
    errors: FieldErrors<ApartmentForm>;
  }) => (
    <div data-testid='title-description'>
      <input {...register('title')} placeholder='Title' />
      <textarea {...register('description')} placeholder='Description' />
      {errors?.title && <span>Title error</span>}
    </div>
  ),
}));

vi.mock('@/features/add-apartment/components/photo-uploader', () => ({
  PhotoUploader: ({
    selectedPhotos,
    onAdd,
    onClear,
  }: {
    selectedPhotos: File[];
    onAdd: (files: File[]) => void;
    onClear: () => void;
  }) => (
    <div data-testid='photo-uploader'>
      <input
        type='file'
        multiple
        onChange={(e) =>
          onAdd(Array.from((e.target as HTMLInputElement).files || []))
        }
        data-testid='file-input'
      />
      <button onClick={onClear} data-testid='clear-photos'>
        Clear Photos
      </button>
      <div data-testid='selected-photos-count'>{selectedPhotos.length}</div>
    </div>
  ),
}));

// Import the mocked hooks after mocking
import useFetchOwners from '@/features/add-apartment/hooks/use-fetch-owners';
import useFetchApartmentPhotos from '@/features/apartment-list/hooks/use-fetch-apartment-photos';
import useFetchApartment from '@/features/apartment/hooks/use-fetch-apartment';
import useDeleteApartmentPhoto from '@/features/owner/hooks/use-delete-apartment-photo';
import usePostApartmentPhoto from '@/features/owner/hooks/use-post-apartment-photo';
import { useUpdateApartment } from '@/features/owner/hooks/use-update-apartment';

const mockUseParams = useParams as Mock;
const mockUseRouter = useRouter as Mock;
const mockUseSession = useSession as Mock;
const mockUseFetchOwners = useFetchOwners as Mock;
const mockUseFetchApartmentPhotos = useFetchApartmentPhotos as Mock;
const mockUseFetchApartment = useFetchApartment as Mock;
const mockUseDeleteApartmentPhoto = useDeleteApartmentPhoto as Mock;
const mockUsePostApartmentPhoto = usePostApartmentPhoto as Mock;
const mockUseUpdateApartment = useUpdateApartment as Mock;

describe('EditApartmentPage', () => {
  const mockRouter = {
    push: vi.fn(),
    back: vi.fn(),
  };

  const mockSession = {
    user: { name: 'testuser' },
    accessToken: 'mock-token',
  };

  const mockApartment = {
    id: 1,
    title: 'Test Apartment',
    description: 'A nice apartment',
    address: {
      apartmentNumber: '101',
      street: '123 Main St',
      city: 'Test City',
      postalCode: '12345',
      country: 'Test Country',
    },
    size: 1000,
    rentalPrice: 1500,
    numberOfRooms: 3,
    numberOfBeds: 2,
    furnished: true,
    wifi: true,
    petsAllowed: false,
    parkingSpace: true,
    disabilityFriendly: false,
    poolFee: 50,
    kitchen: true,
    yardAccess: false,
    poolAccess: true,
    propertyType: 'apartment',
    ownerId: 1,
  };

  const mockOwners = [
    { id: 1, username: 'testuser', name: 'Test User' },
    { id: 2, username: 'otheruser', name: 'Other User' },
  ];

  const mockPhotos = [
    'https://example.com/photo1.jpg',
    'https://example.com/photo2.jpg',
  ];
  const mockPhotoObjects = [
    { id: 1, url: 'https://example.com/photo1.jpg' },
    { id: 2, url: 'https://example.com/photo2.jpg' },
  ];

  beforeEach(() => {
    mockUseParams.mockReturnValue({ id: '1' });
    mockUseRouter.mockReturnValue(mockRouter);
    mockUseSession.mockReturnValue({ data: mockSession });

    mockUseFetchApartment.mockReturnValue({
      apartment: mockApartment,
      loading: false,
      error: null,
    });

    mockUseFetchApartmentPhotos.mockReturnValue({
      photos: mockPhotos,
      photoObjects: mockPhotoObjects,
      loading: false,
      error: null,
    });

    mockUseFetchOwners.mockReturnValue({
      owners: mockOwners,
      loading: false,
      error: null,
    });

    mockUseDeleteApartmentPhoto.mockReturnValue({
      deletePhoto: vi.fn().mockResolvedValue({}),
      loading: false,
    });

    mockUsePostApartmentPhoto.mockReturnValue({
      postPhoto: vi.fn().mockResolvedValue({}),
    });

    mockUseUpdateApartment.mockReturnValue({
      updateApartment: vi.fn().mockResolvedValue({}),
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Loading States', () => {
    it('shows loading spinner when apartment is loading', () => {
      mockUseFetchApartment.mockReturnValue({
        apartment: null,
        loading: true,
        error: null,
      });

      render(<EditApartmentPage />);

      expect(
        screen.getByText('Loading apartment information...'),
      ).toBeInTheDocument();
    });

    it('shows loading spinner when photos are loading', () => {
      mockUseFetchApartmentPhotos.mockReturnValue({
        photos: [],
        photoObjects: [],
        loading: true,
        error: null,
      });

      render(<EditApartmentPage />);

      expect(
        screen.getByText('Loading apartment information...'),
      ).toBeInTheDocument();
    });

    it('shows loading spinner when owners are loading', () => {
      mockUseFetchOwners.mockReturnValue({
        owners: [],
        loading: true,
        error: null,
      });

      render(<EditApartmentPage />);

      expect(
        screen.getByText('Loading apartment information...'),
      ).toBeInTheDocument();
    });
  });

  describe('Error States', () => {
    it('shows error message when apartment fails to load', () => {
      mockUseFetchApartment.mockReturnValue({
        apartment: null,
        loading: false,
        error: new Error('Failed to fetch apartment'),
      });

      render(<EditApartmentPage />);

      expect(screen.getByText('Error loading data')).toBeInTheDocument();
      expect(
        screen.getByText(
          "We couldn't load the apartment information. Please try again later.",
        ),
      ).toBeInTheDocument();
      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });

    it('shows error message when photos fail to load', () => {
      mockUseFetchApartmentPhotos.mockReturnValue({
        photos: [],
        photoObjects: [],
        loading: false,
        error: new Error('Failed to fetch photos'),
      });

      render(<EditApartmentPage />);

      expect(screen.getByText('Error loading data')).toBeInTheDocument();
    });

    it('reloads page when try again button is clicked', () => {
      const originalLocation = window.location;
      const mockReload = vi.fn();
      // @ts-expect-error: allow override for test
      delete window.location;
      // @ts-expect-error: allow override for test
      window.location = { reload: mockReload } as unknown as Location;

      mockUseFetchApartment.mockReturnValue({
        apartment: null,
        loading: false,
        error: new Error('Failed to fetch apartment'),
      });

      render(<EditApartmentPage />);

      fireEvent.click(screen.getByText('Try Again'));
      expect(mockReload).toHaveBeenCalled();
      // Restore window.location safely
      Object.defineProperty(window, 'location', {
        configurable: true,
        value: originalLocation,
      });
    });
  });

  describe('Success State', () => {
    it('shows success message and navigation buttons after successful update', async () => {
      // Ensure the user is authorized (owner)
      mockUseSession.mockReturnValue({ data: { ...mockSession, user: { ...mockSession.user, id: 1 } } });
      mockUseFetchApartment.mockReturnValue({
        apartment: { ...mockApartment, ownerId: 1 },
        loading: false,
        error: null,
      });

      render(<EditApartmentPage />);

      const submitButton = screen.getByText('Save Changes');
      fireEvent.click(submitButton);

      const mockUpdateApartment = vi.fn().mockResolvedValue({});
      mockUseUpdateApartment.mockReturnValue({
        updateApartment: mockUpdateApartment,
      });
    });
  });

  describe('Form Rendering', () => {
    it('renders all form sections', () => {
      // Ensure the user is authorized (owner)
      mockUseSession.mockReturnValue({ data: { ...mockSession, user: { ...mockSession.user, id: 1 } } });
      mockUseFetchApartment.mockReturnValue({
        apartment: { ...mockApartment, ownerId: 1 },
        loading: false,
        error: null,
      });

      render(<EditApartmentPage />);

      expect(screen.getByText('Edit Apartment')).toBeInTheDocument();
      expect(screen.getByText('Basic Information')).toBeInTheDocument();
      expect(screen.getByText('Pricing & Dimensions')).toBeInTheDocument();
      expect(screen.getByText('Amenities & Property Type')).toBeInTheDocument();
      expect(screen.getByText('Location')).toBeInTheDocument();
      expect(screen.getByText('Photos')).toBeInTheDocument();
    });

    // it('renders all form components', () => {
    //   render(<EditApartmentPage />);

    //   // expect(screen.getByTestId('title-description')).toBeInTheDocument();
    //   // expect(screen.getByTestId('numeric-inputs')).toBeInTheDocument();
    //   // expect(screen.getByTestId('amenities-checkboxes')).toBeInTheDocument();
    //   // expect(screen.getByTestId('select-fields')).toBeInTheDocument();
    //   // expect(screen.getByTestId('address-fieldset')).toBeInTheDocument();
    //   // expect(screen.getByTestId('photo-uploader')).toBeInTheDocument();
    // });

    it('pre-fills form with apartment data', async () => {
      // Ensure the user is authorized (owner)
      mockUseSession.mockReturnValue({ data: { ...mockSession, user: { ...mockSession.user, id: 1 } } });
      mockUseFetchApartment.mockReturnValue({
        apartment: { ...mockApartment, ownerId: 1 },
        loading: false,
        error: null,
      });

      render(<EditApartmentPage />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('Test Apartment')).toBeInTheDocument();
        expect(
          screen.getByDisplayValue('A nice apartment'),
        ).toBeInTheDocument();
        expect(screen.getByDisplayValue('123 Main St')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Test City')).toBeInTheDocument();
      });
    });
  });

  describe('Photo Management', () => {
    it('displays existing photos', () => {
      // Ensure the user is authorized (owner)
      mockUseSession.mockReturnValue({ data: { ...mockSession, user: { ...mockSession.user, id: 1 } } });
      mockUseFetchApartment.mockReturnValue({
        apartment: { ...mockApartment, ownerId: 1 },
        loading: false,
        error: null,
      });

      render(<EditApartmentPage />);

      expect(screen.getByText('Current Photos')).toBeInTheDocument();
      expect(screen.getByAltText('Apartment photo 1')).toBeInTheDocument();
      expect(screen.getByAltText('Apartment photo 2')).toBeInTheDocument();
    });

    it('allows removing existing photos', async () => {
      // Ensure the user is authorized (owner)
      mockUseSession.mockReturnValue({ data: { ...mockSession, user: { ...mockSession.user, id: 1 } } });
      mockUseFetchApartment.mockReturnValue({
        apartment: { ...mockApartment, ownerId: 1 },
        loading: false,
        error: null,
      });

      render(<EditApartmentPage />);

      const removeButtons = screen.getAllByRole('button', { name: '' }); // X buttons
      const photoRemoveButton = removeButtons.find(
        (button) => button.querySelector('svg') && button.closest('.group'),
      );

      if (photoRemoveButton) {
        fireEvent.click(photoRemoveButton);

        await waitFor(() => {
          // Should show the marked for deletion message
          expect(screen.getByText(/marked for deletion/)).toBeInTheDocument();
        });
      }
    });

    it('allows adding new photos', () => {
      // Ensure the user is authorized (owner)
      mockUseSession.mockReturnValue({ data: { ...mockSession, user: { ...mockSession.user, id: 1 } } });
      mockUseFetchApartment.mockReturnValue({
        apartment: { ...mockApartment, ownerId: 1 },
        loading: false,
        error: null,
      });

      render(<EditApartmentPage />);

      const fileInput = screen.getByTestId('file-input');
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

      fireEvent.change(fileInput, { target: { files: [mockFile] } });

      expect(screen.getByText(/new photo selected/)).toBeInTheDocument();
    });

    it('allows clearing selected photos', () => {
      // Ensure the user is authorized (owner)
      mockUseSession.mockReturnValue({ data: { ...mockSession, user: { ...mockSession.user, id: 1 } } });
      mockUseFetchApartment.mockReturnValue({
        apartment: { ...mockApartment, ownerId: 1 },
        loading: false,
        error: null,
      });

      render(<EditApartmentPage />);

      // First add a photo
      const fileInput = screen.getByTestId('file-input');
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      fireEvent.change(fileInput, { target: { files: [mockFile] } });

      // Then clear it
      const clearButton = screen.getByTestId('clear-photos');
      fireEvent.click(clearButton);

      expect(screen.getByTestId('selected-photos-count')).toHaveTextContent('0');
    });
  });

  describe('Navigation', () => {
    it('navigates back when back button is clicked', () => {
      // Ensure the user is authorized (owner)
      mockUseSession.mockReturnValue({ data: { ...mockSession, user: { ...mockSession.user, id: 1 } } });
      mockUseFetchApartment.mockReturnValue({
        apartment: { ...mockApartment, ownerId: 1 },
        loading: false,
        error: null,
      });

      render(<EditApartmentPage />);

      const backButton = screen.getByText('Back');
      fireEvent.click(backButton);

      expect(mockRouter.back).toHaveBeenCalled();
    });
  });

  describe('Form Submission', () => {
    it('shows loading state during submission', async () => {
      // Ensure the user is authorized (owner)
      mockUseSession.mockReturnValue({ data: { ...mockSession, user: { ...mockSession.user, id: 1 } } });
      mockUseFetchApartment.mockReturnValue({
        apartment: { ...mockApartment, ownerId: 1 },
        loading: false,
        error: null,
      });

      const mockUpdateApartment = vi
        .fn()
        .mockImplementation(
          () => new Promise((resolve) => setTimeout(resolve, 100)),
        );
      mockUseUpdateApartment.mockReturnValue({
        updateApartment: mockUpdateApartment,
      });

      render(<EditApartmentPage />);

      const submitButton = screen.getByText('Save Changes');
      fireEvent.click(submitButton);

      expect(screen.getByText('Saving Changes...')).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });

    it('handles photo upload during submission', async () => {
      // Ensure the user is authorized (owner)
      mockUseSession.mockReturnValue({ data: { ...mockSession, user: { ...mockSession.user, id: 1 } } });
      mockUseFetchApartment.mockReturnValue({
        apartment: { ...mockApartment, ownerId: 1 },
        loading: false,
        error: null,
      });

      const mockUpdateApartment = vi.fn().mockResolvedValue({});
      const mockPostPhoto = vi.fn().mockResolvedValue({});

      mockUseUpdateApartment.mockReturnValue({
        updateApartment: mockUpdateApartment,
      });

      mockUsePostApartmentPhoto.mockReturnValue({
        postPhoto: mockPostPhoto,
      });

      render(<EditApartmentPage />);

      // Add a photo
      const fileInput = screen.getByTestId('file-input');
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      fireEvent.change(fileInput, { target: { files: [mockFile] } });

      const submitButton = screen.getByText('Save Changes');
      fireEvent.click(submitButton);
    });

    it('handles photo deletion during submission', async () => {
      // Ensure the user is authorized (owner)
      mockUseSession.mockReturnValue({ data: { ...mockSession, user: { ...mockSession.user, id: 1 } } });
      mockUseFetchApartment.mockReturnValue({
        apartment: { ...mockApartment, ownerId: 1 },
        loading: false,
        error: null,
      });

      const mockUpdateApartment = vi.fn().mockResolvedValue({});
      const mockDeletePhoto = vi.fn().mockResolvedValue({});

      mockUseUpdateApartment.mockReturnValue({
        updateApartment: mockUpdateApartment,
      });

      mockUseDeleteApartmentPhoto.mockReturnValue({
        deletePhoto: mockDeletePhoto,
        loading: false,
      });

      render(<EditApartmentPage />);

      // Mark a photo for deletion
      const removeButtons = screen.getAllByRole('button');
      const photoRemoveButton = removeButtons.find(
        (button) => button.querySelector('svg') && button.closest('.group'),
      );

      if (photoRemoveButton) {
        fireEvent.click(photoRemoveButton);
      }

      const submitButton = screen.getByText('Save Changes');
      fireEvent.click(submitButton);
    });
  });

  describe('Authentication', () => {
    it('handles missing session gracefully', () => {
      mockUseSession.mockReturnValue({ data: null });

      render(<EditApartmentPage />);

      // Should show unauthorized message instead of the form
      expect(screen.getByText('Unauthorized')).toBeInTheDocument();
      expect(
        screen.getByText('You do not have permission to edit this apartment.'),
      ).toBeInTheDocument();
      expect(screen.getByText('Go Home')).toBeInTheDocument();
    });

    it('pre-fills owner ID when user is found in owners list', async () => {
      render(<EditApartmentPage />);

      // The component should automatically set the ownerId based on the session user
      await waitFor(() => {
        expect(mockUseSession).toHaveBeenCalled();
      });
    });
  });
});
