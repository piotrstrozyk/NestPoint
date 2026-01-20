import { AmenitiesCheckboxes } from '@/features/add-apartment/components/amenities-checkboxes';
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';

// amenity keys
const bools = [
  'furnished',
  'wifi',
  'petsAllowed',
  'parkingSpace',
  'disabilityFriendly',
] as const;

describe('AmenitiesCheckboxes', () => {
  let register: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // mock register: returns props for the <input>
    register = vi.fn((fieldName: string) => ({
      'data-testid': `checkbox-${fieldName}`,
      name: fieldName,
      type: 'checkbox',
      // add a dummy onChange so React won't warn
      onChange: () => {},
    }));
  });

  it('renders one checkbox and label for each amenity', () => {
    render(<AmenitiesCheckboxes register={register} errors={{}} />);

    // Expect register called for each field
    expect(register).toHaveBeenCalledTimes(bools.length);
    for (const field of bools) {
      expect(register).toHaveBeenCalledWith(field);

      // Checkbox input
      const checkbox = screen.getByTestId(`checkbox-${field}`);
      expect(checkbox).toBeInTheDocument();
      expect(checkbox).toHaveAttribute('type', 'checkbox');
      expect(checkbox).toHaveAttribute('name', field);

      // Optionally: check that the label text span exists
      const label = checkbox.closest('label');
      expect(label).toBeInTheDocument();
      const spans = label?.querySelectorAll('span');
      // The second span contains the label text
      const labelTextSpan = spans?.[1];
      expect(labelTextSpan).toBeInTheDocument();
      expect(labelTextSpan).toHaveClass('text-sm', 'text-gray-700');
    }
  });

  it('renders a checkbox, icon, and label for each amenity', () => {
    render(<AmenitiesCheckboxes register={register} errors={{}} />);
    for (const field of bools) {
      // Checkbox
      const checkbox = screen.getByTestId(`checkbox-${field}`);
      expect(checkbox).toBeInTheDocument();
      expect(checkbox).toHaveAttribute('type', 'checkbox');
      expect(checkbox).toHaveAttribute('name', field);
      // Icon
      const icon = checkbox.parentElement?.parentElement?.querySelector('svg');
      expect(icon).toBeInTheDocument();
    }
  });

  it('applies correct classes to container and elements', () => {
    const { container } = render(
      <AmenitiesCheckboxes register={register} errors={{}} />,
    );
    // Outer container
    expect(container.firstChild).toHaveClass('space-y-3');
    // Each label
    const labels = container.querySelectorAll('label');
    labels.forEach((label) => {
      expect(label).toHaveClass(
        'flex',
        'cursor-pointer',
        'items-center',
        'rounded',
        'p-2',
        'transition',
        'hover:bg-gray-100',
      );
    });
    // Each input
    const inputs = container.querySelectorAll('input[type="checkbox"]');
    inputs.forEach((input) => {
      expect(input).toHaveClass(
        'text-primary',
        'h-4',
        'w-4',
        'rounded',
        'border-gray-300',
        'focus:ring-indigo-500',
      );
    });
  });

  it('applies the correct classes to the amenity label text', () => {
    render(<AmenitiesCheckboxes register={register} errors={{}} />);
    for (const field of bools) {
      const checkbox = screen.getByTestId(`checkbox-${field}`);
      // The label text is in the second span inside the label
      const label = checkbox.closest('label');
      expect(label).toBeInTheDocument();
      const spans = label?.querySelectorAll('span');
      // The second span contains the label text
      const labelTextSpan = spans?.[1];
      expect(labelTextSpan).toBeInTheDocument();
      expect(labelTextSpan).toHaveClass('text-sm', 'text-gray-700');
      // Optionally, check that it does NOT have 'capitalize'
      expect(labelTextSpan).not.toHaveClass('capitalize');
    }
  });

  it('renders in a container with space between items', () => {
    const { container } = render(
      <AmenitiesCheckboxes register={register} errors={{}} />,
    );

    const outerDiv = container.firstChild;
    expect(outerDiv).toHaveClass('space-y-3');
  });
});
