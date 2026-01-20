import DateRangePicker, {
  DateRange,
} from '@/core/components/ui/date-range-picker';
import {
  Control,
  Controller,
  FieldError,
  FieldPath,
  FieldValues,
} from 'react-hook-form';
import { toLocalDateTimeString } from '../../utils/date-utils';

interface DisabledRange {
  from: Date;
  to: Date;
}

export interface DateRangeFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> {
  name: TName;
  label: string;
  control: Control<TFieldValues>;
  error?: FieldError;
  disabledDateRanges?: DisabledRange[];
  placeholder?: string;
}

export default function DateRangeField<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
>({
  name,
  label,
  control,
  error,
  disabledDateRanges = [],
  placeholder = 'Pick a date range',
}: DateRangeFieldProps<TFieldValues, TName>) {
  return (
    <div className='mb-4'>
      <label
        htmlFor={String(name)}
        className='mb-2 block text-sm font-semibold text-gray-700'
      >
        {label}
      </label>
      <Controller
        name={name}
        control={control}
        render={({ field }) => {
          // parse existing value into DateRange
          const parsedRange: DateRange = {
            from: field.value?.from ? new Date(field.value.from) : undefined,
            to: field.value?.to ? new Date(field.value.to) : undefined,
          };

          return (
            <DateRangePicker
              selected={parsedRange}
              onSelect={(range) => {
                const value = {
                  from: range.from
                    ? toLocalDateTimeString(range.from)
                    : undefined,
                  to: range.to ? toLocalDateTimeString(range.to) : undefined,
                };
                field.onChange(value);
              }}
              placeholder={placeholder}
              disabledDateRanges={disabledDateRanges}
            />
          );
        }}
      />
      {error && <p className='mt-1 text-sm text-red-600'>{error.message}</p>}
    </div>
  );
}
