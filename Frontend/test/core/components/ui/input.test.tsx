import { Input } from '@/core/components/ui/input';
import { fireEvent, render, screen } from '@testing-library/react';
import { vi } from 'vitest';

// Pseudocode plan:
// 1. Render Input with default props, check input is rendered with correct classes.
// 2. Render Input with variant="success", check for success span and pr-10 class.
// 3. Render Input with variant="error", check for error span and pr-10 class.
// 4. Render Input with variant="disabled", check for disabled attributes and classes.
// 5. Render Input with custom className, check class is applied.
// 6. Render Input with placeholder, check placeholder is set.
// 7. Render Input with type="password", check type is set.
// 8. Check that additional props (e.g., onChange) are passed to input.

describe('Input', () => {
  it('renders input with default variant', () => {
    render(<Input />);
    const input = screen.getByRole('textbox');
    expect(input).toBeInTheDocument();
    expect(input).toHaveClass('w-full');
  });

  it('renders input with success variant and shows success icon span', () => {
    render(<Input variant='success' />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('border-success');
    expect(input).toHaveClass('pr-10');
    const successSpan = screen.getByText('', { selector: '.text-success' });
    expect(successSpan).toBeInTheDocument();
  });

  it('renders input with error variant and shows error icon span', () => {
    render(<Input variant='error' />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('border-error');
    expect(input).toHaveClass('pr-10');
    const errorSpan = screen.getByText('', { selector: '.text-error' });
    expect(errorSpan).toBeInTheDocument();
  });

  it('renders input with disabled variant and disables input', () => {
    render(<Input variant='disabled' disabled />);
    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();
    expect(input).toHaveClass('border-gray-light');
    expect(input).toHaveClass('bg-gray-light');
  });

  it('applies custom className', () => {
    render(<Input className='custom-class' />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('custom-class');
  });

  it('renders input with placeholder', () => {
    render(<Input placeholder='Test placeholder' />);
    const input = screen.getByPlaceholderText('Test placeholder');
    expect(input).toBeInTheDocument();
  });

  it('passes additional props to input', () => {
    const handleChange = vi.fn();
    render(<Input onChange={handleChange} />);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'abc' } });
    expect(handleChange).toHaveBeenCalled();
  });
});
