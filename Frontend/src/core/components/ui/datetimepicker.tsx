'use client';

import { CalendarIcon } from '@radix-ui/react-icons';
import { format } from 'date-fns';
import * as React from 'react';

import { Button } from '@/core/components/ui/button';
import { Calendar } from '@/core/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/core/components/ui/popover';
import { ScrollArea, ScrollBar } from '@/core/components/ui/scroll-area';
import { cn } from '@/core/lib/utils';

export interface DateTimePickerProps {
  value?: Date;
  onChange: (date?: Date) => void;
  /**
   * Optional ranges of dates to disable (gray out).
   */
  disabledDateRanges?: Array<{ from: Date; to: Date }>;
  showTime?: boolean;
}

export default function DateTimePicker({
  value: date,
  onChange,
  disabledDateRanges = [],
  showTime = true,
}: DateTimePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const hours = React.useMemo(
    () => Array.from({ length: 24 }, (_, i) => i),
    [],
  );

  const handleDateSelect = (selected: Date | undefined) => {
    if (!selected) return;
    const isDisabled = disabledDateRanges.some(
      (range) => selected >= range.from && selected <= range.to,
    );
    if (isDisabled) return;

    let newDate: Date;
    if (date && showTime) {
      newDate = new Date(selected);
      newDate.setHours(date.getHours(), date.getMinutes(), 0, 0);
    } else {
      newDate = new Date(selected);
      if (!showTime) {
        newDate.setHours(0, 0, 0, 0);
      }
    }
    onChange(newDate);
  };

  const handleTimeChange = (unit: 'hour' | 'minute', val: number) => {
    if (!date) return;
    const d = new Date(date);
    if (unit === 'hour') d.setHours(val);
    else d.setMinutes(val);
    onChange(d);
  };

  const disabledDate = (day: Date) =>
    disabledDateRanges.some((range) => day >= range.from && day <= range.to);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          className={cn(
            'w-full justify-start text-left font-normal',
            !date && 'text-muted-foreground bg-zinc-100',
          )}
        >
          <CalendarIcon className='mr-2 h-4 w-4' />
          {date ? (
            showTime ? (
              format(date, 'MM/dd/yyyy HH:mm')
            ) : (
              format(date, 'MM/dd/yyyy')
            )
          ) : (
            <span>{showTime ? 'MM/DD/YYYY HH:mm' : 'MM/DD/YYYY'}</span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className='w-auto p-0'>
        <div className='sm:flex'>
          <Calendar
            classNames={{
              table: 'bg-primary',
              today: 'bg-indigo-600 text-white rounded-md',
              day: 'relative w-full h-full p-0 text-center group/day',
              day_selected: 'bg-indigo-600 text-white',
              range_start: 'rounded-l-md bg-indigo-600 text-white',
              range_end: 'rounded-r-md bg-indigo-600 text-white',
              button_previous:
                'p-0 select-none text-indigo-600 hover:text-indigo-800',
              button_next:
                'p-0 select-none text-indigo-600 hover:text-indigo-800',
              day_disabled: 'text-gray-400 bg-zinc-100 pointer-events-none',
            }}
            mode='single'
            selected={date}
            onSelect={handleDateSelect}
            disabled={disabledDate}
            autoFocus
          />

          {showTime && (
            <div className='flex flex-col divide-y sm:h-[300px] sm:flex-row sm:divide-x sm:divide-y-0'>
              <ScrollArea className='w-64 sm:w-auto'>
                <div className='flex p-2 sm:flex-col'>
                  {hours
                    .slice()
                    .reverse()
                    .map((hr) => (
                      <Button
                        key={hr}
                        size='icon'
                        variant={date?.getHours() === hr ? 'default' : 'ghost'}
                        className='aspect-square shrink-0 sm:w-full'
                        onClick={() => handleTimeChange('hour', hr)}
                      >
                        {String(hr).padStart(2, '0')}
                      </Button>
                    ))}
                </div>
                <ScrollBar orientation='horizontal' className='sm:hidden' />
              </ScrollArea>

              <ScrollArea className='w-64 sm:w-auto'>
                <div className='flex p-2 sm:flex-col'>
                  {Array.from({ length: 60 }, (_, i) => i).map((min) => (
                    <Button
                      key={min}
                      size='icon'
                      variant={date?.getMinutes() === min ? 'default' : 'ghost'}
                      className='aspect-square shrink-0 sm:w-full'
                      onClick={() => handleTimeChange('minute', min)}
                    >
                      {String(min).padStart(2, '0')}
                    </Button>
                  ))}
                </div>
                <ScrollBar orientation='horizontal' className='sm:hidden' />
              </ScrollArea>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
