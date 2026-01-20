import { Calendar, CalendarDayButton } from '@/core/components/ui/calendar';
import { fireEvent, render, screen } from '@testing-library/react';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';

describe('Calendar', () => {
  it('renders Calendar root with data-slot', () => {
    render(<Calendar />);
    const root = document.querySelector('[data-slot="calendar"]');
    expect(root).toBeInTheDocument();
  });

  it('renders navigation buttons', () => {
    render(<Calendar />);
    const prevBtn = document.querySelector('.rdp-button_previous');
    const nextBtn = document.querySelector('.rdp-button_next');
    expect(prevBtn).toBeInTheDocument();
    expect(nextBtn).toBeInTheDocument();
  });

  it('renders days as buttons', () => {
    render(<Calendar />);
    const dayButtons = screen.getAllByRole('button');
    expect(dayButtons.length).toBeGreaterThan(0);
  });

  it('applies custom className', () => {
    render(<Calendar className='test-calendar' />);
    const root = document.querySelector('.test-calendar');
    expect(root).toBeInTheDocument();
  });

  it('applies custom classNames', () => {
    render(<Calendar classNames={{ root: 'custom-root' }} />);
    const root = document.querySelector('.custom-root');
    expect(root).toBeInTheDocument();
  });

  it('renders with different buttonVariant', () => {
    render(<Calendar buttonVariant='destructive' />);
    const prevBtn = document.querySelector('.rdp-button_previous');
    expect(prevBtn?.className).toMatch(/bg-red-500/);
  });

  it('calls onDayClick if provided', () => {
    const onDayClick = vi.fn();
    render(<Calendar onDayClick={onDayClick} />);
    const dayBtn = screen
      .getAllByRole('button')
      .find((btn) => btn.getAttribute('data-day'));
    if (dayBtn) {
      fireEvent.click(dayBtn);
      expect(onDayClick).toHaveBeenCalled();
    }
  });

  it('renders with custom captionLayout', () => {
    render(<Calendar captionLayout='dropdown' />);
    const dropdowns = document.querySelectorAll(
      '.w-full.flex.items-center.text-sm.font-medium.justify-center',
    );
    expect(dropdowns.length).toBeGreaterThan(0);
  });

  it('renders today with today class', () => {
    render(<Calendar />);
    const today = document.querySelector('.bg-zinc-100');
    expect(today).toBeTruthy();
  });

  it('renders week numbers if showWeekNumber is true', () => {
    render(<Calendar showWeekNumber />);
    // Week numbers are rendered as <td> with a div inside
    const weekNumberCells = screen.getAllByText(
      (_, el) =>
        el?.parentElement?.tagName === 'TD' && el.className.includes('flex'),
    );
    expect(weekNumberCells.length).toBeGreaterThan(0);
  });

  it('renders outside days if showOutsideDays is true', () => {
    render(<Calendar showOutsideDays />);
    // Outside days have a className including "text-zinc-500"
    const outsideDays = document.querySelectorAll('.text-zinc-500');
    expect(outsideDays.length).toBeGreaterThan(0);
  });

  it('renders custom components', () => {
    const CustomRoot = (props: React.HTMLAttributes<HTMLDivElement>) => (
      <div data-testid='custom-root' {...props} />
    );
    render(<Calendar components={{ Root: CustomRoot }} />);
    expect(screen.getByTestId('custom-root')).toBeInTheDocument();
  });
});

describe('CalendarDayButton', () => {
  it('renders a Button with correct data-day attribute', () => {
    const day = { date: new Date(2023, 4, 15) };
    const modifiers = {};
    render(
      // @ts-expect-error Testing: CalendarDayButton props may not match expected types in test
      <CalendarDayButton day={day} modifiers={modifiers}>
        15
      </CalendarDayButton>,
    );
    const btn = screen.getByRole('button');
    expect(btn).toHaveAttribute('data-day', day.date.toLocaleDateString());
  });

  it('sets data-selected-single when only selected is true', () => {
    const day = { date: new Date(2023, 4, 15) };
    const modifiers = { selected: true };
    render(
      // @ts-expect-error Testing: CalendarDayButton props may not match expected types in test
      <CalendarDayButton day={day} modifiers={modifiers}>
        15
      </CalendarDayButton>,
    );
    const btn = screen.getByRole('button');
    expect(btn.getAttribute('data-selected-single')).toBe('true');
  });

  it('does not set data-selected-single when range modifiers are present', () => {
    const day = { date: new Date(2023, 4, 15) };
    const modifiers = { selected: true, range_start: true };
    render(
      // @ts-expect-error Testing: CalendarDayButton props may not match expected types in test
      <CalendarDayButton day={day} modifiers={modifiers}>
        15
      </CalendarDayButton>,
    );
    const btn = screen.getByRole('button');
    expect(btn.getAttribute('data-selected-single')).toBe('false');
  });

  it('sets data-range-start, data-range-middle, data-range-end correctly', () => {
    const day = { date: new Date(2023, 4, 15) };
    const modifiers = {
      range_start: true,
      range_middle: false,
      range_end: false,
    };
    render(
      // @ts-expect-error Testing: CalendarDayButton props may not match expected types in test
      <CalendarDayButton day={day} modifiers={modifiers}>
        15
      </CalendarDayButton>,
    );
    const btn = screen.getByRole('button');
    expect(btn.getAttribute('data-range-start')).toBe('true');
    expect(btn.getAttribute('data-range-middle')).toBe('false');
    expect(btn.getAttribute('data-range-end')).toBe('false');
  });

  it('forwards className and children', () => {
    const day = { date: new Date(2023, 4, 15) };
    const modifiers = {};
    render(
      // @ts-expect-error Testing: CalendarDayButton props may not match expected types in test
      <CalendarDayButton
        day={day}
        modifiers={modifiers}
        className='custom-class'
      >
        <span>child</span>
      </CalendarDayButton>,
    );
    const btn = screen.getByRole('button');
    expect(btn).toHaveClass('custom-class');
    expect(screen.getByText('child')).toBeInTheDocument();
  });
});
