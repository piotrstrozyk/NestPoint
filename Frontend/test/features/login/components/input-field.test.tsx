import { InputField } from '@/features/login/components/input-field';
import { render, screen } from '@testing-library/react';
import { UseFormRegisterReturn } from 'react-hook-form';
import { describe, expect, it } from 'vitest';

describe('InputField', () => {
  // Mock the registration object returned by useForm's register function
  const mockRegistration: UseFormRegisterReturn = {
    name: 'email',
    onChange: async () => {},
    onBlur: async () => {},
    ref: () => {},
  };

  it('renders input with correct type and placeholder', () => {
    render(
      <InputField
        type='email'
        placeholder='Email address'
        registration={mockRegistration}
      />,
    );

    const inputElement = screen.getByPlaceholderText('Email address');
    expect(inputElement).toBeInTheDocument();
    expect(inputElement).toHaveAttribute('type', 'email');
  });

  it('applies the registration props to the input', () => {
    render(
      <InputField
        type='text'
        placeholder='Username'
        registration={mockRegistration}
      />,
    );

    const inputElement = screen.getByPlaceholderText('Username');
    expect(inputElement).toHaveAttribute('name', 'email');
  });

  it('displays error message when error is provided', () => {
    const error = {
      type: 'required',
      message: 'This field is required',
    };

    render(
      <InputField
        type='password'
        placeholder='Password'
        registration={mockRegistration}
        error={error}
      />,
    );

    expect(screen.getByText('This field is required')).toBeInTheDocument();
    expect(screen.getByText('This field is required')).toHaveClass(
      'text-red-500',
    );
  });

  it('does not display error message when no error is provided', () => {
    render(
      <InputField
        type='text'
        placeholder='Username'
        registration={mockRegistration}
      />,
    );

    const errorElements = document.querySelectorAll('.text-red-500');
    expect(errorElements.length).toBe(0);
  });

  it('applies the correct styling to the input', () => {
    render(
      <InputField
        type='text'
        placeholder='Username'
        registration={mockRegistration}
      />,
    );

    const inputElement = screen.getByPlaceholderText('Username');
    expect(inputElement).toHaveClass('w-full');
    expect(inputElement).toHaveClass('rounded');
    expect(inputElement).toHaveClass('border');
  });
});
