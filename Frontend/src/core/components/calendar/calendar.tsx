import { useState } from 'react';
import type { DateRange } from 'react-day-picker';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/style.css';

interface DayRangePickerProps {
  disabledRanges?: { from: Date; to: Date }[];
  highlightedRanges?: { from: Date; to: Date }[];
  initialRange?: DateRange;
  selectedRange?: DateRange;
  onRangeChange?: (range: DateRange | undefined) => void;
  onConfirm?: (range: DateRange) => void;
  onDayClick?: (date: Date) => void;
  userRole?: 'OWNER' | 'TENANT' | 'ADMIN';
  readOnly?: boolean;
}

function doesRangeOverlap(a: DateRange, ranges: { from: Date; to: Date }[]) {
  if (!a.from || !a.to) return false;
  const start = a.from < a.to ? a.from : a.to;
  const end = a.from < a.to ? a.to : a.from;
  return ranges.some(({ from, to }) => start <= to && end >= from);
}

function normalizeRange(range: { from: Date; to: Date }) {
  // Normalize both ends to midnight for consistent matching
  const from = new Date(range.from);
  from.setHours(0, 0, 0, 0);
  const to = new Date(range.to);
  to.setHours(0, 0, 0, 0);
  return { from, to };
}

export default function DayRangePicker({
  disabledRanges = [],
  highlightedRanges = [],
  initialRange,
  selectedRange,
  onRangeChange,
  onConfirm,
  onDayClick,
  userRole,
  readOnly = false,
}: DayRangePickerProps) {
  // If controlled, use selectedRange; otherwise, use internal state
  const [uncontrolledRange, setUncontrolledRange] = useState<DateRange | undefined>(initialRange);
  const [error, setError] = useState<string | null>(null);

  const normalizedHighlighted = highlightedRanges.map(normalizeRange);
  const normalizedDisabled = disabledRanges.map(normalizeRange);
  const allBlockedRanges = [...normalizedHighlighted, ...normalizedDisabled];

  const modifiers = {
    highlighted: normalizedHighlighted,
    highlighted_start: normalizedHighlighted.map(r => r.from),
    highlighted_end: normalizedHighlighted.map(r => r.to),
  } as Record<string, Date[] | { from: Date; to: Date }[]>;

  const modifiersStyles = {
    highlighted: {
      backgroundColor: '#893e43',
      color: 'white',
    },
    highlighted_start: {
      borderTopLeftRadius: '50%',
      borderBottomLeftRadius: '50%',
    },
    highlighted_end: {
      borderTopRightRadius: '50%',
      borderBottomRightRadius: '50%',
    },
  };

  const range = selectedRange !== undefined ? selectedRange : uncontrolledRange;

  const handleSelect = readOnly ? undefined : (selected: DateRange | undefined) => {
    setError(null);
    if (selected) {
      if (selected.from && !selected.to) {
        const check = new Date(selected.from);
        check.setHours(0, 0, 0, 0);
        const isBlocked = allBlockedRanges.some(
          ({ from, to }) => check >= from && check <= to,
        );
        if (isBlocked) {
          setError(
            'You cannot start a selection on or just before a blocked date.',
          );
          return;
        }
      }
      if (selected.from && selected.to) {
        if (doesRangeOverlap(selected, allBlockedRanges)) {
          setError('You cannot select dates that overlap with blocked dates.');
          return;
        }
      }
    }
    if (onRangeChange) {
      onRangeChange(selected);
    } else {
      setUncontrolledRange(selected);
    }
  };

  const handleConfirm = readOnly ? undefined : () => {
    if (onConfirm && range?.from && range?.to) {
      onConfirm(range);
    }
  };

  return (
    <div className="day-range-picker mx-auto max-w-md">
      <DayPicker
        mode="range"
        selected={range}
        onSelect={handleSelect}
        disabled={disabledRanges}
        modifiers={modifiers}
        modifiersStyles={modifiersStyles}
        styles={{
          caption: { color: '#893e43' },
          nav_button: { color: '#893e43' },
          nav_button_previous: { color: '#893e43' },
          nav_button_next: { color: '#893e43' },
          day_selected: { backgroundColor: '#893e43', color: 'white' },
        }}
        className="rounded-2xl p-4 shadow-lg"
        onDayClick={readOnly ? undefined : onDayClick}
      />
      {error && <div className="mt-2 text-sm text-red-600">{error}</div>}
      {!readOnly && userRole !== 'TENANT' && (
        <button
          type="button"
          onClick={handleConfirm}
          disabled={!range?.from || !range?.to || !!error}
          className={`mt-4 w-full rounded-2xl py-2 transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
            range?.from && range?.to && !error
              ? 'bg-[#893e43] text-white hover:bg-[#7a333b]'
              : 'bg-gray-200 text-gray-500'
          }`}
        >
          {userRole === 'OWNER' ? 'Start Auction On Selected Date' : 'Confirm'}
        </button>
      )}
    </div>
  );
}
