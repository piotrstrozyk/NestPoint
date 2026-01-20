import DatePicker from '@/core/components/ui/datepicker';
import { fireEvent, render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Dynamic value for Calendar mock
let calendarSelectValue: Date | undefined = undefined;

vi.mock('@/core/components/ui/calendar', () => ({
  Calendar: ({ onSelect }: { onSelect: (date: Date | undefined) => void }) => (
    <button
      onClick={() => onSelect(calendarSelectValue)}
      data-testid='calendar-mock'
    >
      Calendar
    </button>
  ),
}));

const mockDate = new Date(2025, 5, 30); // June 30, 2025
const disabledDate = new Date(2025, 5, 28); // June 28, 2025

describe('DatePicker handleSelect logic', () => {
  beforeEach(() => {
    calendarSelectValue = undefined;
  });

  it('does not call onSelect if date is undefined', () => {
    const onSelect = vi.fn();
    calendarSelectValue = undefined;
    const { getByTestId, getByRole } = render(
      <DatePicker onSelect={onSelect} />,
    );
    fireEvent.click(getByRole('button'));
    fireEvent.click(getByTestId('calendar-mock'));
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('does not call onSelect if date is disabled', () => {
    const onSelect = vi.fn();
    const disabledDateRanges = [{ from: disabledDate, to: disabledDate }];
    calendarSelectValue = disabledDate;
    const { getByTestId, getByRole } = render(
      <DatePicker
        onSelect={onSelect}
        disabledDateRanges={disabledDateRanges}
      />,
    );
    fireEvent.click(getByRole('button'));
    fireEvent.click(getByTestId('calendar-mock'));
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('calls onSelect if provided and date is valid', () => {
    const onSelect = vi.fn();
    calendarSelectValue = mockDate;
    const { getByTestId, getByRole } = render(
      <DatePicker onSelect={onSelect} />,
    );
    fireEvent.click(getByRole('button'));
    fireEvent.click(getByTestId('calendar-mock'));
    expect(onSelect).toHaveBeenCalledWith(mockDate);
  });

  it('sets internal date if uncontrolled and date is valid', () => {
    calendarSelectValue = mockDate;
    const { getByTestId, getByRole, getByText } = render(<DatePicker />);
    fireEvent.click(getByRole('button'));
    fireEvent.click(getByTestId('calendar-mock'));
    expect(getByText('June 30th, 2025')).toBeTruthy();
  });
});
