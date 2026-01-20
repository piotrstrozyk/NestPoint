import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DayRangePicker from '../../../../src/core/components/calendar/calendar';
import { describe, it, expect, vi } from 'vitest';

function getDate(daysFromToday: number) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + daysFromToday);
  return d;
}

describe('DayRangePicker', () => {
  it('renders without crashing', () => {
    render(<DayRangePicker />);
    expect(screen.getByRole('grid')).toBeInTheDocument();
  });

  it('renders highlighted and disabled ranges', () => {
    const highlighted = [{ from: getDate(2), to: getDate(4) }];
    const disabled = [{ from: getDate(6), to: getDate(8) }];
    render(
      <DayRangePicker highlightedRanges={highlighted} disabledRanges={disabled} />
    );
    // Just check the calendar renders, visual styles are not tested here
    expect(screen.getByRole('grid')).toBeInTheDocument();
  });

  it('calls onRangeChange when selecting a valid range', async () => {
    const onRangeChange = vi.fn();
    render(<DayRangePicker onRangeChange={onRangeChange} />);
    // Find two enabled days by their accessible label
    const day1 = screen.getByLabelText(/july 10th, 2025/i);
    const day2 = screen.getByLabelText(/july 12th, 2025/i);
    await userEvent.click(day1);
    await userEvent.click(day2);
    expect(onRangeChange).toHaveBeenCalled();
  });

  it('confirm button is disabled if range is incomplete or error', () => {
    render(<DayRangePicker userRole="OWNER" />);
    const button = screen.getByRole('button', { name: /auction/i });
    expect(button).toBeDisabled();
  });

  it('confirm button label changes for OWNER', () => {
    render(<DayRangePicker userRole="OWNER" />);
    expect(screen.getByRole('button', { name: /auction/i }).textContent).toMatch(/auction/i);
  });

  it('confirm button label is generic for ADMIN', () => {
    render(<DayRangePicker userRole="ADMIN" />);
    expect(screen.getByRole('button', { name: /confirm/i }).textContent).toMatch(/confirm/i);
  });

  it('confirm button does not render for TENANT', () => {
    render(<DayRangePicker userRole="TENANT" />);
    expect(screen.queryByRole('button', { name: /auction/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /confirm/i })).toBeNull();
  });

  it('readOnly disables selection and confirm', async () => {
    const onRangeChange = vi.fn();
    render(<DayRangePicker readOnly onRangeChange={onRangeChange} userRole="OWNER" />);
    const days = screen.getAllByRole('gridcell');
    await userEvent.click(days[10]);
    expect(onRangeChange).not.toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: /auction/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /confirm/i })).toBeNull();
  });
});
