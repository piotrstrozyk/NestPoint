import DateTimePicker from '@/core/components/ui/datetimepicker';
import {
  Control,
  Controller,
  FieldError,
  FieldPath,
  FieldValues,
} from 'react-hook-form';
import { toLocalDateTimeString } from '../../utils/date-utils';

interface DateTimeFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> {
  name: TName;
  label: string;
  control?: Control<TFieldValues>;
  error?: FieldError;
  disabledDateRanges: Array<{ from: Date; to: Date }>;
}

export default function DateTimeField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  name,
  label,
  control,
  error,
  disabledDateRanges,
}: DateTimeFieldProps<TFieldValues, TName>) {
  return (
    <div>
      <label className='block text-sm font-medium'>{label}</label>
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <DateTimePicker
            disabledDateRanges={disabledDateRanges}
            value={field.value ? new Date(field.value) : undefined}
            onChange={(date) =>
              field.onChange(date ? toLocalDateTimeString(date) : undefined)
            }
          />
        )}
      />
      {error && <p className='text-sm text-red-500'>{error.message}</p>}
    </div>
  );
}
