import * as dateUtils from '@/features/auctions/utils/date-utils';
import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// 1) Updated mock to handle the null/undefined case
vi.mock('@/core/components/ui/datetimepicker', () => ({
  default: ({
    value,
    onChange,
    disabledDateRanges,
  }: {
    value?: Date;
    onChange: (date: Date | undefined) => void;
    disabledDateRanges: unknown[];
  }) => (
    <div>
      <input
        data-testid='datetime-picker'
        value={value ? (value as Date).toISOString() : ''}
        onChange={(e) =>
          onChange(e.target.value ? new Date(e.target.value) : undefined)
        }
        disabled={disabledDateRanges.length > 0}
      />
      <button data-testid='clear-date-btn' onClick={() => onChange(undefined)}>
        Clear
      </button>
      <button
        data-testid='set-date-btn'
        onClick={() => onChange(new Date('2025-06-22T10:00:00.000Z'))}
      >
        Set Date
      </button>
    </div>
  ),
}));

// Mock implementation with fixed return value matching what we expect
const MOCK_FORMATTED_DATE = '2025-06-22T12:00:00';
const toLocalDateTimeStringSpy = vi
  .spyOn(dateUtils, 'toLocalDateTimeString')
  .mockImplementation(() => MOCK_FORMATTED_DATE);

import DateTimeField from '@/features/auctions/components/form-fields/date-time-field';

type TestFormValues = {
  foo?: string;
  myDate?: string;
  errDate?: string;
  setDateTest?: string;
  clearableDate?: string;
};

function renderWithForm<T extends Record<string, unknown> = TestFormValues>(
  ui: React.ReactElement,
  defaultValues: T,
) {
  let methodsReturn: ReturnType<typeof useForm<T>>;

  function Wrapper() {
    const methods = useForm<T>({
      defaultValues:
        defaultValues as import('react-hook-form').DefaultValues<T>,
    });
    methodsReturn = methods;
    return (
      <FormProvider {...methods}>
        {React.isValidElement(ui)
          ? React.cloneElement(
              ui as React.ReactElement<Record<string, unknown>>,
              {
                ...(ui.props || {}),
                control: methods.control,
              },
            )
          : ui}
      </FormProvider>
    );
  }

  render(<Wrapper />);
  return methodsReturn!;
}

describe('DateTimeField', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    toLocalDateTimeStringSpy.mockClear();
  });

  it('renders the label and an empty picker when no default value', () => {
    renderWithForm(
      <DateTimeField name='foo' label='Test Label' disabledDateRanges={[]} />,
      {},
    );
    expect(screen.getByText('Test Label')).toBeInTheDocument();
    const input = screen.getByTestId('datetime-picker') as HTMLInputElement;
    expect(input.value).toBe('');
    expect(input).not.toBeDisabled();
  });

  it('renders the initial value from react-hook-form as a Date', () => {
    const iso = '2025-06-22T10:00:00.000Z';
    renderWithForm(
      <DateTimeField name='myDate' label='My Date' disabledDateRanges={[]} />,
      { myDate: iso },
    );
    const input = screen.getByTestId('datetime-picker') as HTMLInputElement;
    // Our mock DateTimePicker prints value.toISOString()
    expect(input.value).toBe(new Date(iso).toISOString());
  });

  it('displays the error message when error prop is passed', () => {
    renderWithForm(
      <DateTimeField
        name='errDate'
        label='Err'
        error={
          {
            message: 'Something went wrong',
          } as import('react-hook-form').FieldError
        }
        disabledDateRanges={[]}
      />,
      { errDate: undefined },
    );
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  // Explicit test of the truthy branch of the ternary operator
  it('calls toLocalDateTimeString when setting a date value', () => {
    const methods = renderWithForm<TestFormValues>(
      <DateTimeField
        name='setDateTest'
        label='Set Date Test'
        disabledDateRanges={[]}
      />,
      {},
    );

    // Trigger the date setting
    fireEvent.click(screen.getByTestId('set-date-btn'));

    // Verify toLocalDateTimeString was called with the date
    expect(toLocalDateTimeStringSpy).toHaveBeenCalledWith(expect.any(Date));

    // Check that the form value now has the formatted date from our mock
    expect(methods.getValues('setDateTest')).toBe(MOCK_FORMATTED_DATE);
  });

  // Explicit test of the falsy branch of the ternary operator
  it('handles clearing the date value', () => {
    const methods = renderWithForm<TestFormValues>(
      <DateTimeField
        name='clearableDate'
        label='Clearable Date'
        disabledDateRanges={[]}
      />,
      { clearableDate: '2025-06-22T10:00:00.000Z' },
    );

    // Initially has a value
    const input = screen.getByTestId('datetime-picker') as HTMLInputElement;
    expect(input.value).not.toBe('');

    // Clear the date
    fireEvent.click(screen.getByTestId('clear-date-btn'));

    // Verify toLocalDateTimeString was NOT called (because date was undefined)
    expect(toLocalDateTimeStringSpy).not.toHaveBeenCalled();

    // Check that the form value is now undefined
    expect(methods.getValues('clearableDate')).toBeUndefined();
  });
});
