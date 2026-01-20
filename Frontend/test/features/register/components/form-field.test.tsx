import { FormField } from '@/features/register/components/form-field';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

describe('FormField', () => {
  // Mock the register function from react-hook-form
  const mockRegister = vi.fn().mockReturnValue({
    onChange: vi.fn(),
    onBlur: vi.fn(),
    name: 'email',
  });

  it('renders an input with the correct type and placeholder', () => {
    render(
      <FormField
        type='email'
        placeholder='Enter your email'
        register={mockRegister}
        name='email'
      />,
    );

    const inputElement = screen.getByPlaceholderText('Enter your email');
    expect(inputElement).toBeInTheDocument();
    expect(inputElement).toHaveAttribute('type', 'email');
  });

  it('displays an error message when error prop is provided', () => {
    const errorMessage = 'Email is required';

    render(
      <FormField
        type='email'
        placeholder='Enter your email'
        register={mockRegister}
        name='email'
        error={errorMessage}
      />,
    );

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('does not display an error message when error prop is not provided', () => {
    render(
      <FormField
        type='email'
        placeholder='Enter your email'
        register={mockRegister}
        name='email'
      />,
    );

    const errorElements = screen.queryAllByText(/./);
    const errorParagraphs = errorElements.filter(
      (el) => el.tagName.toLowerCase() === 'p',
    );
    expect(errorParagraphs.length).toBe(0);
  });

  it('calls register function with the correct field name', () => {
    render(
      <FormField
        type='password'
        placeholder='Enter your password'
        register={mockRegister}
        name='password'
      />,
    );

    expect(mockRegister).toHaveBeenCalledWith('password');
  });

  it('renders different input types correctly', () => {
    render(
      <FormField
        type='tel'
        placeholder='Enter your phone number'
        register={mockRegister}
        name='phone'
      />,
    );

    const inputElement = screen.getByPlaceholderText('Enter your phone number');
    expect(inputElement).toHaveAttribute('type', 'tel');
  });

  it('applies the correct CSS classes to the input', () => {
    render(
      <FormField
        type='text'
        placeholder='Enter your username'
        register={mockRegister}
        name='username'
      />,
    );

    const inputElement = screen.getByPlaceholderText('Enter your username');
    expect(inputElement).toHaveClass(
      'w-full',
      'rounded',
      'border',
      'px-3',
      'py-2',
    );
  });
});
