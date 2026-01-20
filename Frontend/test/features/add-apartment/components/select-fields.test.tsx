import { SelectFields } from '@/features/add-apartment/components/select-fields';
import { ApartmentForm } from '@/features/add-apartment/schemas/add-apartment';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { UseFormRegister, UseFormWatch } from 'react-hook-form';
import { describe, expect, it, vi } from 'vitest';

// Mock register function from react-hook-form
const register = vi.fn().mockReturnValue({
  name: 'mock',
  onChange: vi.fn(),
  onBlur: vi.fn(),
  ref: vi.fn(),
});

describe('SelectFields', () => {
  it('renders all select fields with correct labels', () => {
    render(
      <SelectFields
        register={register as unknown as UseFormRegister<ApartmentForm>}
        errors={{}}
      />,
    );

    // Check for all labels - now they have spaces between camelCase parts
    expect(screen.getByText('kitchen')).toBeInTheDocument();
    expect(screen.getByText('yard Access')).toBeInTheDocument();
    expect(screen.getByText('pool Access')).toBeInTheDocument();
    expect(screen.getByText('property Type')).toBeInTheDocument();
  });

  it('renders all select fields with the correct options', () => {
    render(
      <SelectFields
        register={register as unknown as UseFormRegister<ApartmentForm>}
        errors={{}}
      />,
    );

    // Check for options using their label text, not value
    expect(screen.getByText('Private Kitchen')).toBeInTheDocument();
    expect(screen.getByText('Shared Kitchen')).toBeInTheDocument();

    expect(screen.getByText('No Yard Access')).toBeInTheDocument();
    expect(screen.getByText('Shared Yard')).toBeInTheDocument();
    expect(screen.getByText('Private Yard')).toBeInTheDocument();

    expect(screen.getByText('No Pool Access')).toBeInTheDocument();
    expect(screen.getByText('Shared Pool')).toBeInTheDocument();
    expect(screen.getByText('Private Pool')).toBeInTheDocument();

    expect(screen.getByText('Apartment')).toBeInTheDocument();
    expect(screen.getByText('Room')).toBeInTheDocument();
    expect(screen.getByText('Full Property')).toBeInTheDocument();
  });

  it('shows error messages for fields with errors', () => {
    const errors = {
      kitchen: { message: 'Kitchen error' },
      propertyType: { message: 'Property type error' },
    };
    render(
      <SelectFields
        register={register as unknown as UseFormRegister<ApartmentForm>}
        errors={errors as Record<string, { message: string }>}
      />,
    );
    expect(screen.getByText('Kitchen error')).toBeInTheDocument();
    expect(screen.getByText('Property type error')).toBeInTheDocument();
  });

  it('does not show descriptions when watch prop is not provided', () => {
    render(
      <SelectFields
        register={register as unknown as UseFormRegister<ApartmentForm>}
        errors={{}}
      />,
    );

    // Descriptions should not be present
    expect(screen.queryByText('Exclusive use')).not.toBeInTheDocument();
    expect(screen.queryByText('Common outdoor area')).not.toBeInTheDocument();
    expect(screen.queryByText('No swimming pool')).not.toBeInTheDocument();
    expect(
      screen.queryByText('Residential unit in a building'),
    ).not.toBeInTheDocument();
  });

  it('renders icons for each field', () => {
    const { container } = render(
      <SelectFields
        register={register as unknown as UseFormRegister<ApartmentForm>}
        errors={{}}
      />,
    );

    // Check that icons are rendered (these are SVGs, so we can count them)
    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThanOrEqual(4); // At least one per field
  });

  it('applies proper styling to select elements', () => {
    const { container } = render(
      <SelectFields
        register={register as unknown as UseFormRegister<ApartmentForm>}
        errors={{}}
      />,
    );

    const selects = container.querySelectorAll('select');
    expect(selects.length).toBe(4);

    selects.forEach((select) => {
      expect(select).toHaveClass(
        'mt-1',
        'block',
        'w-full',
        'rounded-md',
        'border',
        'border-gray-300',
        'bg-white',
        'px-3',
        'py-2',
      );
    });
  });

  it('does not show error messages for fields without errors', () => {
    render(
      <SelectFields
        register={register as unknown as UseFormRegister<ApartmentForm>}
        errors={{}}
      />,
    );
    expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
  });

  it('shows descriptions for selected options when watch prop is provided', () => {
    // Simulate watch returning a value for each field
    const watch = (name: string) => {
      switch (name) {
        case 'kitchen':
          return 'PRIVATE';
        case 'yardAccess':
          return 'SHARED';
        case 'poolAccess':
          return 'NONE';
        case 'propertyType':
          return 'APARTMENT';
        default:
          return '';
      }
    };
    // UseFormWatch is already imported at the top

    render(
      <SelectFields
        register={register as unknown as UseFormRegister<ApartmentForm>}
        errors={{}}
        watch={watch as UseFormWatch<ApartmentForm>}
      />,
    );
    expect(screen.getByText('Exclusive use')).toBeInTheDocument(); // kitchen
    expect(screen.getByText('Common outdoor area')).toBeInTheDocument(); // yardAccess
    expect(screen.getByText('No swimming pool')).toBeInTheDocument(); // poolAccess
    expect(
      screen.getByText('Residential unit in a building'),
    ).toBeInTheDocument(); // propertyType
  });

  it('returns empty string from getOptionDescription if watch returns unknown value', () => {
    // Simulate watch returning a value not present in options
    const watch = (name: string) => {
      if (name === 'kitchen') return 'UNKNOWN';
      return '';
    };
    render(
      <SelectFields
        register={register as unknown as UseFormRegister<ApartmentForm>}
        errors={{}}
        watch={watch as UseFormWatch<ApartmentForm>}
      />,
    );
    // Should not render any description for kitchen
    // (the description for 'UNKNOWN' does not exist)
    const kitchenField = screen.getByText('kitchen').closest('div');
    expect(kitchenField?.textContent).not.toContain('Exclusive use');
    expect(kitchenField?.textContent).not.toContain('Shared with others');
  });

  it('returns empty string from getOptionDescription if watch is not provided', () => {
    // Render without watch prop
    render(
      <SelectFields
        register={register as unknown as UseFormRegister<ApartmentForm>}
        errors={{}}
      />,
    );
    // There should be no descriptions rendered at all
    expect(screen.queryByText('Exclusive use')).not.toBeInTheDocument();
    expect(screen.queryByText('Common outdoor area')).not.toBeInTheDocument();
    expect(screen.queryByText('No swimming pool')).not.toBeInTheDocument();
    expect(
      screen.queryByText('Residential unit in a building'),
    ).not.toBeInTheDocument();
  });
  it('renders an empty description <p> when watch returns unknown value', () => {
    const watch = (name: string) => (name === 'kitchen' ? 'UNKNOWN' : '');
    render(
      <SelectFields
        register={register as unknown as UseFormRegister<ApartmentForm>}
        errors={{}}
        watch={watch as UseFormWatch<ApartmentForm>}
      />,
    );
    // Find the description <p> for kitchen (should be present but empty)
    const kitchenField = screen.getByText('kitchen').closest('div');
    const descP = kitchenField?.querySelector('p.mt-1.text-xs.text-gray-500');
    expect(descP).toBeInTheDocument();
    expect(descP?.textContent).toBe('');
  });
});
