import { Button } from '@/core/components/ui/button';
import { Calendar } from '@/core/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/core/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { useState } from 'react';

export interface DateRange {
  from?: Date;
  to?: Date;
}

export interface DateRangePickerProps {
  /** Controlled selected range */
  selected?: DateRange;
  /** Callback when a range is selected */
  onSelect?: (range: DateRange) => void;
  /** Placeholder text when no date is selected */
  placeholder?: string;
  /** Ranges of dates to disable */
  disabledDateRanges?: Array<{ from: Date; to: Date }>;
}

export default function DateRangePicker({
  selected: controlledRange,
  onSelect: controlledOnSelect,
  placeholder = 'Pick a date range',
  disabledDateRanges = [],
}: DateRangePickerProps) {
  const [internalRange, setInternalRange] = useState<DateRange>({});
  const selectedRange = controlledRange ?? internalRange;

  const isDisabled = (day: Date) =>
    disabledDateRanges.some((range) => day >= range.from && day <= range.to);

  const handleSelect = (range: DateRange | undefined) => {
    if (!range) {
      setInternalRange({});
      return;
    }
    const { from, to } = range;
    if (from && to) {
      // Only finalize when both from and to are selected
      if (controlledOnSelect) {
        controlledOnSelect(range);
      } else {
        setInternalRange(range);
      }
    } else {
      // Update intermediate selection
      setInternalRange(range);
    }
  };

  const renderLabel = () => {
    const { from, to } = selectedRange;
    if (from && to) {
      return `${format(from, 'PPP')} – ${format(to, 'PPP')}`;
    }
    return placeholder;
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          className='focus:ring-primary flex w-64 items-center justify-between rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-shadow hover:bg-gray-50 hover:shadow-md focus:ring-2'
        >
          <span
            className={
              selectedRange.from && selectedRange.to
                ? 'text-gray-700'
                : 'text-gray-400'
            }
          >
            {renderLabel()}
          </span>
          <CalendarIcon className='h-5 w-5 text-gray-500' />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align='start'
        className='w-auto rounded-lg border border-gray-200 bg-white p-4 shadow-lg'
      >
        <Calendar
          mode='range'
          selected={
            selectedRange.from
              ? (selectedRange as { from: Date; to?: Date })
              : undefined
          }
          onSelect={handleSelect}
          disabled={isDisabled}
          autoFocus
          required={false}
        />
      </PopoverContent>
    </Popover>
  );
}
