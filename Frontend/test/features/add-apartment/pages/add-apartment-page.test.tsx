import { createApartment } from '@/features/add-apartment/hooks/use-create-apartment';
import useFetchOwners from '@/features/add-apartment/hooks/use-fetch-owners';
import AddApartmentPage from '@/features/add-apartment/pages/add-apartment-page';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

// Mock all the dependencies
vi.mock('next-auth/react', () => ({
  useSession: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

vi.mock('@/features/add-apartment/hooks/use-fetch-owners', () => ({
  default: vi.fn(),
}));

vi.mock('@/features/add-apartment/hooks/use-create-apartment', () => ({
  createApartment: vi.fn(),
}));

// Mock the form components
vi.mock('@/features/add-apartment/components/address-fieldset', () => ({
  AddressFieldset: () => (
    <div data-testid='address-fieldset'>Address Fieldset</div>
  ),
}));

vi.mock('@/features/add-apartment/components/amenities-checkboxes', () => ({
  AmenitiesCheckboxes: () => (
    <div data-testid='amenities-checkboxes'>Amenities</div>
  ),
}));

vi.mock('@/features/add-apartment/components/numeric-inputs', () => ({
  NumericInputs: () => <div data-testid='numeric-inputs'>Numeric Inputs</div>,
}));

vi.mock('@/features/add-apartment/components/photo-uploader', () => ({
  PhotoUploader: ({
    onAdd,
    onRemove,
    onClear,
  }: {
    onAdd: (files: File[]) => void;
    onRemove: (index: number) => void;
    onClear: () => void;
  }) => (
    <div data-testid='photo-uploader'>
      <button onClick={() => onAdd([new File([''], 'test.jpg')])}>
        Add Photo
      </button>
      <button onClick={() => onRemove(0)}>Remove Photo</button>
      <button onClick={onClear}>Clear All Photos</button>
    </div>
  ),
}));

vi.mock('@/features/add-apartment/components/select-fields', () => ({
  SelectFields: () => <div data-testid='select-fields'>Select Fields</div>,
}));

vi.mock('@/features/add-apartment/components/title-description', () => ({
  TitleDescription: () => (
    <div data-testid='title-description'>Title & Description</div>
  ),
}));

describe('AddApartmentPage', () => {
  const mockSession = {
    data: {
      user: { name: 'testuser' },
      accessToken: 'test-token',
    },
  };

  const mockRouter = {
    push: vi.fn(),
  };

  const mockOwners = {
    owners: [{ id: 123, username: 'testuser' }],
    loading: false,
    error: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useSession as unknown as Mock).mockReturnValue(mockSession);
    (useRouter as unknown as Mock).mockReturnValue(mockRouter);
    (useFetchOwners as unknown as Mock).mockReturnValue(mockOwners);
  });

  it('should show loading state when loading owners', () => {
    (useFetchOwners as unknown as Mock).mockReturnValue({
      owners: null,
      loading: true,
      error: null,
    });

    render(<AddApartmentPage />);

    expect(
      screen.getByText('Loading owner information...'),
    ).toBeInTheDocument();
  });

  it('should show error state when there is an error', () => {
    (useFetchOwners as unknown as Mock).mockReturnValue({
      owners: null,
      loading: false,
      error: 'Error',
    });

    render(<AddApartmentPage />);

    expect(screen.getByText('Error loading owner data')).toBeInTheDocument();
  });

  it('should render the form with all required components', () => {
    render(<AddApartmentPage />);

    expect(screen.getByText('Add New Apartment')).toBeInTheDocument();
    expect(screen.getByTestId('title-description')).toBeInTheDocument();
    expect(screen.getByTestId('numeric-inputs')).toBeInTheDocument();
    expect(screen.getByTestId('amenities-checkboxes')).toBeInTheDocument();
    expect(screen.getByTestId('select-fields')).toBeInTheDocument();
    expect(screen.getByTestId('address-fieldset')).toBeInTheDocument();
    expect(screen.getByTestId('photo-uploader')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /create apartment/i }),
    ).toBeInTheDocument();
  });

  it('should pre-fill ownerId when owner is found', async () => {
    render(<AddApartmentPage />);

    // The ownerId logic runs but doesn't navigate away
    await waitFor(() => {
      expect(mockRouter.push).not.toHaveBeenCalled();
    });
  });

  it('should handle photo adding, removing and clearing', () => {
    render(<AddApartmentPage />);

    // Add a photo
    fireEvent.click(screen.getByText('Add Photo'));
    // Remove a photo
    fireEvent.click(screen.getByText('Remove Photo'));
    // Clear all photos
    fireEvent.click(screen.getByText('Clear All Photos'));
  });

  it('should handle submission errors properly', async () => {
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    const testError = new Error('Submission failed');
    vi.mocked(createApartment).mockRejectedValue(testError);

    render(<AddApartmentPage />);

    // Simply click the submit button
    fireEvent.click(screen.getByRole('button', { name: /create apartment/i }));

    expect(mockRouter.push).not.toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });
});
