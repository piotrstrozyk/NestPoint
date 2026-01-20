import DatePicker from '@/core/components/ui/datepicker';
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

interface DateFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> {
  name: TName;
  label: string;
  control: Control<TFieldValues>;
  error?: FieldError;
  disabledDateRanges?: DisabledRange[];
  onChange?: (value: string) => void;
}

export default function DateField<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
>({
  name,
  label,
  control,
  error,
  disabledDateRanges = [],
  onChange,
}: DateFieldProps<TFieldValues, TName>) {
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
          const selectedDate = field.value ? new Date(field.value) : undefined;
          return (
            <DatePicker
              selected={selectedDate}
              onSelect={(date) => {
                const isoValue = date ? toLocalDateTimeString(date) : undefined;
                field.onChange(isoValue);
                if (onChange && isoValue) {
                  onChange(isoValue);
                }
              }}
              placeholder='Pick a date'
              disabledDateRanges={disabledDateRanges}
            />
          );
        }}
      />
      {error && <p className='mt-1 text-sm text-red-600'>{error.message}</p>}
    </div>
  );
}
