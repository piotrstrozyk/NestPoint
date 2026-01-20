'use client';

import { CreditCard } from 'lucide-react';
import React, { useState } from 'react';
import { FieldError, Path, UseFormRegister } from 'react-hook-form';

interface CreditCardFieldProps<T extends Record<string, unknown>> {
  name: Path<T>;
  label: string;
  register: UseFormRegister<T>;
  error?: FieldError;
}

export default function CreditCardField<T extends Record<string, unknown>>({
  name,
  label,
  register,
  error,
}: CreditCardFieldProps<T>) {
  const [displayValue, setDisplayValue] = useState('');
  const [digitCount, setDigitCount] = useState(0);

  // Format input as groups of up to 4 digits, for total of 10 digits maximum
  const formatCardNumber = (value: string) => {
    const trimmed = value.replace(/\D/g, '').slice(0, 10);
    return trimmed.match(/.{1,4}/g)?.join(' ') || trimmed;
  };

  // Register with the form without any transformation to avoid validation conflicts
  const { onChange, onBlur, ref } = register(name);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
    setDisplayValue(formatCardNumber(digits));
    setDigitCount(digits.length);

    // Pass the raw digits to the form
    onChange({
      ...e,
      target: { ...e.target, value: digits },
    });
  };

  const handleBlur = () => {
    // ensure display matches raw digits on blur
    const raw = displayValue.replace(/\D/g, '');
    setDisplayValue(formatCardNumber(raw));
    setDigitCount(raw.length);

    onBlur({
      target: { name: name as string, value: raw },
    } as React.FocusEvent<HTMLInputElement>);
  };

  return (
    <div className='flex flex-col'>
      <label
        htmlFor={name as string}
        className='mb-2 text-sm font-semibold text-gray-700'
      >
        {label}
      </label>
      <div className='relative w-full max-w-md'>
        <CreditCard className='absolute top-1/2 left-3 -translate-y-1/2 text-gray-400' />
        <input
          id={name as string}
          type='text'
          inputMode='numeric'
          autoComplete='cc-number'
          maxLength={13}
          onChange={handleChange}
          onBlur={handleBlur}
          ref={ref}
          value={displayValue}
          placeholder='1234 5678 90'
          className={`w-full rounded-xl bg-white py-3 pr-4 pl-10 font-mono tracking-widest shadow-inner focus:ring-2 focus:ring-indigo-500 focus:outline-none ${
            error
              ? 'border border-red-500'
              : digitCount === 10
                ? 'border border-green-500'
                : 'border border-gray-200'
          } transition-shadow duration-200 ease-in-out`}
        />
        <div className='absolute top-1/2 right-3 -translate-y-1/2 text-xs font-medium'>
          <span
            className={
              digitCount === 10
                ? 'text-green-600'
                : digitCount > 0
                  ? 'text-amber-600'
                  : 'text-gray-400'
            }
          >
            {digitCount}/10
          </span>
        </div>
      </div>
      {error && <p className='mt-1 text-sm text-red-600'>{error.message}</p>}
      {!error && digitCount > 0 && digitCount < 10 && (
        <p className='mt-1 text-sm text-amber-600'>
          Card number must be exactly 10 digits
        </p>
      )}
    </div>
  );
}
