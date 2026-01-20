import { AddressFieldset } from '@/features/add-apartment/components/address-fieldset';
import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock out the PickerMapModal so we can drive its onSelectAddress callback easily
vi.mock('@/features/add-apartment/components/picker-map-modal', () => {
  return {
    __esModule: true,
    default: ({
      onSelectAddress,
    }: {
      onSelectAddress: (addr: {
        street: string;
        apartmentNumber?: string;
        city: string;
        postalCode: string;
        country: string;
      }) => void;
    }) => (
      <button
        data-testid='map-btn'
        onClick={() =>
          onSelectAddress({
            street: 'Main St',
            apartmentNumber: '12B',
            city: 'Townsville',
            postalCode: '12345',
            country: 'Utopia',
          })
        }
      >
        Open Map
      </button>
    ),
  };
});

describe('AddressFieldset', () => {
  const fields = ['street', 'apartmentNumber', 'city', 'postalCode', 'country'];
  const placeholders = [
    'Street name',
    'Apt. number (optional)',
    'City name',
    'Postal code',
    'Country',
  ];

  let register: ReturnType<typeof vi.fn>;
  let setValue: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    register = vi.fn((fieldName: string) => ({
      'data-testid': `input-${fieldName}`,
      name: fieldName,
    }));
    setValue = vi.fn();
  });

  it('renders an input for each address field with correct placeholders', () => {
    render(
      <AddressFieldset register={register} errors={{}} setValue={setValue} />,
    );

    // Check that all fields are rendered with correct placeholders
    fields.forEach((field, index) => {
      const input = screen.getByTestId(`input-address.${field}`);
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('placeholder', placeholders[index]);
    });
  });

  it('renders icons for each input field', () => {
    const { container } = render(
      <AddressFieldset register={register} errors={{}} setValue={setValue} />,
    );

    // There should be at least 5 icons (one per field)
    const svgs = container.querySelectorAll('svg');
    // We expect at least one SVG per field plus additional icons for the info box
    expect(svgs.length).toBeGreaterThanOrEqual(fields.length);
  });

  it('calls setValue for each sub-field when PickerMapModal is clicked', () => {
    render(
      <AddressFieldset register={register} errors={{}} setValue={setValue} />,
    );

    fireEvent.click(screen.getByTestId('map-btn'));

    // Expect street + apartmentNumber concatenated
    expect(setValue).toHaveBeenCalledWith('address.street', 'Main St 12B');

    // apartmentNumber is not set separately as it's concatenated with street
    expect(setValue).not.toHaveBeenCalledWith(
      'address.apartmentNumber',
      expect.anything(),
    );

    expect(setValue).toHaveBeenCalledWith('address.city', 'Townsville');
    expect(setValue).toHaveBeenCalledWith('address.postalCode', '12345');
    expect(setValue).toHaveBeenCalledWith('address.country', 'Utopia');

    // total calls = 4
    expect(setValue).toHaveBeenCalledTimes(4);
  });

  it('calls setValue with only street when apartmentNumber is missing', async () => {
    vi.resetModules();
    vi.doMock('@/features/add-apartment/components/picker-map-modal', () => {
      return {
        __esModule: true,
        default: ({
          onSelectAddress,
        }: {
          onSelectAddress: (addr: {
            street: string;
            apartmentNumber?: string;
            city: string;
            postalCode: string;
            country: string;
          }) => void;
        }) => (
          <button
            data-testid='map-btn-no-apt'
            onClick={() =>
              onSelectAddress({
                street: 'Main St',
                // apartmentNumber omitted
                city: 'Townsville',
                postalCode: '12345',
                country: 'Utopia',
              })
            }
          >
            Open Map No Apt
          </button>
        ),
      };
    });
    const { AddressFieldset: AddressFieldsetNoApt } = await import(
      '@/features/add-apartment/components/address-fieldset'
    );
    render(
      <AddressFieldsetNoApt
        register={register}
        errors={{}}
        setValue={setValue}
      />,
    );
    fireEvent.click(screen.getByTestId('map-btn-no-apt'));
    expect(setValue).toHaveBeenCalledWith('address.street', 'Main St');
  });

  it('applies correct styling to input fields', () => {
    const { container } = render(
      <AddressFieldset register={register} errors={{}} setValue={setValue} />,
    );

    const inputs = container.querySelectorAll('input');
    expect(inputs.length).toBe(fields.length);

    inputs.forEach((input) => {
      expect(input).toHaveClass(
        'block',
        'w-full',
        'rounded-md',
        'border',
        'border-gray-300',
        'py-2',
        'pr-3',
        'pl-10',
      );
    });
  });

  it('renders the inputs in a responsive grid layout', () => {
    const { container } = render(
      <AddressFieldset register={register} errors={{}} setValue={setValue} />,
    );

    const inputsGrid = container.querySelector('.grid');
    expect(inputsGrid).toHaveClass('grid-cols-1', 'gap-4', 'sm:grid-cols-2');
  });

  it('renders error message and icon when there is a field error', () => {
    const errorMessage = 'Street is required';
    const errors: Record<string, { type: string; message: string }> = {
      street: { type: 'required', message: errorMessage },
    };
    render(
      <AddressFieldset
        register={register}
        errors={errors}
        setValue={setValue}
      />,
    );
    // The error message should be visible
    const errorNode = screen.getByText(errorMessage);
    expect(errorNode).toBeInTheDocument();
    // The error icon (AlertCircle) should be present inside the error message container
    const svg = errorNode.closest('p')?.querySelector('svg');
    expect(svg?.tagName.toLowerCase()).toBe('svg');
  });
});
