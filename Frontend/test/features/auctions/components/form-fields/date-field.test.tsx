import DatePicker from '@/core/components/ui/datepicker';
import DateField from '@/features/auctions/components/form-fields/date-field';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { Control } from 'react-hook-form';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the DatePicker component
vi.mock('@/core/components/ui/datepicker', () => ({
  default: vi.fn(({ selected, onSelect, placeholder }) => (
    <div data-testid='mock-datepicker'>
      <input
        type='text'
        value={selected ? selected.toISOString() : ''}
        onChange={(e) =>
          onSelect(e.target.value ? new Date(e.target.value) : null)
        }
        placeholder={placeholder}
      />
    </div>
  )),
}));

// Mock the Controller component from react-hook-form
vi.mock('react-hook-form', () => ({
  Controller: ({
    render,
    name,
  }: {
    render: (props: {
      field: {
        value: string;
        onChange: (value: unknown) => void;
        onBlur: () => void;
        name: string;
      };
    }) => React.ReactNode;
    name: string;
    control: Control<Record<string, unknown>>;
  }) => {
    const field = {
      value: '',
      onChange: vi.fn(),
      onBlur: vi.fn(),
      name,
    };
    return render({ field });
  },
}));

describe('DateField', () => {
  const mockControl = {} as Control<Record<string, unknown>>;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with the correct label', () => {
    render(
      <DateField name='testDate' label='Test Date' control={mockControl} />,
    );

    expect(screen.getByText('Test Date')).toBeInTheDocument();
  });

  it('renders the DatePicker component', () => {
    render(
      <DateField name='testDate' label='Test Date' control={mockControl} />,
    );

    expect(screen.getByTestId('mock-datepicker')).toBeInTheDocument();
  });

  it('passes correct placeholder to DatePicker', () => {
    render(
      <DateField name='testDate' label='Test Date' control={mockControl} />,
    );

    // Check if DatePicker has been called
    expect(DatePicker).toHaveBeenCalled();

    // Get the first call arguments
    const callArgs = vi.mocked(DatePicker).mock.calls[0][0];

    // Assert on the specific property
    expect(callArgs.placeholder).toBe('Pick a date');
  });

  it('passes disabled date ranges to DatePicker', () => {
    const disabledRanges = [
      { from: new Date('2023-01-01'), to: new Date('2023-01-10') },
    ];

    render(
      <DateField
        name='testDate'
        label='Test Date'
        control={mockControl}
        disabledDateRanges={disabledRanges}
      />,
    );

    // Check if DatePicker has been called
    expect(DatePicker).toHaveBeenCalled();

    // Get the first call arguments
    const callArgs = vi.mocked(DatePicker).mock.calls[0][0];

    // Assert on the specific property
    expect(callArgs.disabledDateRanges).toEqual(disabledRanges);
  });

  it('displays error message when error is provided', () => {
    const errorMessage = 'This field is required';

    render(
      <DateField
        name='testDate'
        label='Test Date'
        control={mockControl}
        error={{ message: errorMessage, type: 'required' }}
      />,
    );

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('does not display error message when no error is provided', () => {
    const { container } = render(
      <DateField name='testDate' label='Test Date' control={mockControl} />,
    );

    expect(container.querySelector('.text-red-600')).not.toBeInTheDocument();
  });
});
