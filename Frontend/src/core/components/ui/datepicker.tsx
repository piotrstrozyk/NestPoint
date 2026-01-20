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

export interface DatePickerProps {
  selected?: Date;
  onSelect?: (date: Date | undefined) => void;
  placeholder?: string;
  disabledDateRanges?: Array<{ from: Date; to: Date }>;
}

export default function DatePicker({
  selected: controlledDate,
  onSelect: controlledOnSelect,
  placeholder = 'Pick a date',
  disabledDateRanges = [],
}: DatePickerProps) {
  const [internalDate, setInternalDate] = useState<Date | undefined>(undefined);
  const selectedDate = controlledDate ?? internalDate;

  const isDisabled = (day: Date) =>
    disabledDateRanges.some((range) => day >= range.from && day <= range.to);

  const handleSelect = (date: Date | undefined) => {
    if (!date || isDisabled(date)) return;
    if (controlledOnSelect) {
      controlledOnSelect(date);
    } else {
      setInternalDate(date);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          className='focus:ring-primary flex w-48 items-center justify-between rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-shadow hover:bg-gray-50 hover:text-gray-100 hover:shadow-md focus:ring-2'
        >
          <span className={selectedDate ? 'text-gray-500' : 'text-gray-400'}>
            {selectedDate ? format(selectedDate, 'PPP') : placeholder}
          </span>
          <CalendarIcon className='h-5 w-5 text-gray-500' />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align='start'
        className='w-auto rounded-lg border border-gray-200 bg-white p-4 shadow-lg'
      >
        <Calendar
          mode='single'
          selected={selectedDate}
          onSelect={handleSelect}
          disabled={isDisabled}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  );
}
