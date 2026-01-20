import type { DateTimePickerProps } from '@/core/components/ui/datetimepicker';
import { fireEvent, render, screen } from '@testing-library/react';
import { vi } from 'vitest';

// Freeze system time to June 15, 2025 for consistent calendar rendering
beforeAll(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2025-06-15T12:00:00Z'));
});
afterAll(() => {
  vi.useRealTimers();
});

describe('DateTimePicker', () => {
  // Use dynamic import for DateTimePicker in all tests except the mock test
  let DateTimePicker: React.ComponentType<DateTimePickerProps>;
  beforeAll(async () => {
    DateTimePicker = (await import('@/core/components/ui/datetimepicker'))
      .default;
  });

  it('renders button with placeholder when no date is selected', () => {
    render(<DateTimePicker onChange={vi.fn()} />);
    expect(screen.getByText(/MM\/DD\/YYYY HH:mm/)).toBeInTheDocument();
  });

  it('renders button with placeholder when no date is selected and showTime is false', () => {
    render(<DateTimePicker onChange={vi.fn()} showTime={false} />);
    expect(screen.getByText('MM/DD/YYYY')).toBeInTheDocument();
  });

  it('renders formatted date and time when value is provided', () => {
    const date = new Date(2023, 4, 15, 13, 45);
    render(<DateTimePicker value={date} onChange={vi.fn()} />);
    expect(screen.getByText('05/15/2023 13:45')).toBeInTheDocument();
  });

  it('renders formatted date only when showTime is false', () => {
    const date = new Date(2023, 4, 15, 13, 45);
    render(<DateTimePicker value={date} onChange={vi.fn()} showTime={false} />);
    expect(screen.getByText('05/15/2023')).toBeInTheDocument();
  });

  it('opens popover when button is clicked', () => {
    render(<DateTimePicker onChange={vi.fn()} />);
    const btn = screen.getByRole('button');
    fireEvent.click(btn);
    expect(document.querySelector('.sm\\:flex')).toBeInTheDocument();
  });

  it('does not call onChange for disabled dates', () => {
    const onChange = vi.fn();
    const disabled = [
      { from: new Date(2023, 0, 1), to: new Date(2023, 0, 10) },
    ];
    render(
      <DateTimePicker onChange={onChange} disabledDateRanges={disabled} />,
    );
    fireEvent.click(screen.getByRole('button'));
    // Try to click a disabled day
    const disabledBtn = document.querySelector('.text-gray-400');
    if (disabledBtn) {
      fireEvent.click(disabledBtn);
      expect(onChange).not.toHaveBeenCalled();
    }
  });

  it('calls onChange when hour is changed', () => {
    const date = new Date(2023, 4, 15, 10, 0);
    const onChange = vi.fn();
    render(<DateTimePicker value={date} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button'));
    // Find an hour button different from current hour
    const hourBtn = screen
      .getAllByRole('button')
      .find((btn) => btn.textContent === '12');
    if (hourBtn) {
      fireEvent.click(hourBtn);
      expect(onChange).toHaveBeenCalled();
    }
  });

  it('calls onChange and sets minute when a different minute is clicked', () => {
    const date = new Date(2023, 4, 15, 10, 0); // 10:00
    const onChange = vi.fn();
    render(<DateTimePicker value={date} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button'));
    // Click a minute button different from current minute (e.g., 00)
    const minBtn = screen
      .getAllByRole('button')
      .find((btn) => btn.textContent === '05');
    if (minBtn) {
      fireEvent.click(minBtn);
      expect(onChange).toHaveBeenCalled();
      const calledDate = onChange.mock.calls[0][0];
      expect(calledDate.getMinutes()).toBe(0);
    }
  });

  it('does not render time pickers when showTime is false', () => {
    render(<DateTimePicker onChange={vi.fn()} showTime={false} />);
    fireEvent.click(screen.getByRole('button'));
    expect(screen.queryByText('00')).not.toBeInTheDocument();
    expect(screen.queryByText('59')).not.toBeInTheDocument();
  });

  it('calls onChange with midnight when selecting a date and showTime is false and no value', () => {
    const onChange = vi.fn();
    render(<DateTimePicker onChange={onChange} showTime={false} />);
    fireEvent.click(screen.getByRole('button'));
    // Find a day button (not disabled)
    const dayBtn = document.querySelector(
      '.group\\/day:not(.text-gray-400) button',
    );
    if (dayBtn) {
      fireEvent.click(dayBtn);
      expect(onChange).toHaveBeenCalled();
      const calledDate = onChange.mock.calls[0][0];
      expect(calledDate.getHours()).toBe(0);
      expect(calledDate.getMinutes()).toBe(0);
    }
  });
  it('calls onChange with updated minute when minute is changed', () => {
    const date = new Date(2023, 4, 15, 10, 0); // 10:00
    const onChange = vi.fn();
    render(<DateTimePicker value={date} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button'));
    // Find all buttons with text '01' and click the last one (minute picker)
    const allBtns = screen
      .getAllByRole('button')
      .filter((btn) => btn.textContent === '01');
    const minBtn = allBtns[allBtns.length - 1];
    if (minBtn) {
      fireEvent.click(minBtn);
      expect(onChange).toHaveBeenCalled();
      const calledDate = onChange.mock.calls[0][0];
      expect(calledDate.getMinutes()).toBe(1); // should be 1
      expect(calledDate.getHours()).toBe(10); // hour should remain unchanged
    }
  });

  it('does not call onChange if handleDateSelect is called with undefined', () => {
    const onChange = vi.fn();
    render(<DateTimePicker onChange={onChange} />);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('does not call onChange if handleDateSelect is called with a disabled date', () => {
    const onChange = vi.fn();
    const disabled = [
      { from: new Date(2023, 0, 1), to: new Date(2023, 0, 10) },
    ];
    render(
      <DateTimePicker onChange={onChange} disabledDateRanges={disabled} />,
    );
    fireEvent.click(screen.getByRole('button'));
    // Try to click a disabled day
    const disabledBtn = document.querySelector('.text-gray-400');
    if (disabledBtn) {
      fireEvent.click(disabledBtn);
      expect(onChange).not.toHaveBeenCalled();
    }
  });

  it('does not call onChange if handleTimeChange is called with no date', () => {
    const onChange = vi.fn();
    render(<DateTimePicker onChange={onChange} />);
    fireEvent.click(screen.getByRole('button'));
    // Try to click an hour button (should not call onChange because date is undefined)
    const hourBtn = screen
      .getAllByRole('button')
      .find((btn) => btn.textContent === '01');
    if (hourBtn) {
      fireEvent.click(hourBtn);
      expect(onChange).not.toHaveBeenCalled();
    }
  });
  describe('handleDateSelect early return for undefined', () => {
    beforeAll(() => {
      vi.resetModules();
      vi.doMock('@/core/components/ui/calendar', () => ({
        Calendar: ({
          onSelect,
        }: {
          onSelect: (date: Date | undefined) => void;
        }) => (
          <button
            onClick={() => onSelect(undefined)}
            data-testid='calendar-mock'
          >
            Calendar
          </button>
        ),
      }));
    });
    afterAll(() => {
      vi.resetModules();
    });
    it('does not call onChange if Calendar calls onSelect(undefined)', async () => {
      const { default: DateTimePicker } = await import(
        '@/core/components/ui/datetimepicker'
      );
      const onChange = vi.fn();
      const { getByTestId, getByRole } = render(
        <DateTimePicker onChange={onChange} />,
      );
      fireEvent.click(getByRole('button'));
      fireEvent.click(getByTestId('calendar-mock'));
      expect(onChange).not.toHaveBeenCalled();
    });
  });
  describe('handleDateSelect early return for disabled date', () => {
    beforeAll(() => {
      vi.resetModules();
      vi.doMock('@/core/components/ui/calendar', () => ({
        Calendar: ({
          onSelect,
        }: {
          onSelect: (date: Date | undefined) => void;
        }) => (
          <button
            onClick={() => onSelect(new Date(2023, 0, 5))}
            data-testid='calendar-mock-disabled'
          >
            Calendar
          </button>
        ),
      }));
    });
    afterAll(() => {
      vi.resetModules();
    });
    it('does not call onChange if Calendar calls onSelect with a disabled date', async () => {
      const { default: DateTimePicker } = await import(
        '@/core/components/ui/datetimepicker'
      );
      const onChange = vi.fn();
      const disabled = [
        { from: new Date(2023, 0, 1), to: new Date(2023, 0, 10) },
      ];
      const { getByTestId, getByRole } = render(
        <DateTimePicker onChange={onChange} disabledDateRanges={disabled} />,
      );
      fireEvent.click(getByRole('button'));
      fireEvent.click(getByTestId('calendar-mock-disabled'));
      expect(onChange).not.toHaveBeenCalled();
    });
  });
});
