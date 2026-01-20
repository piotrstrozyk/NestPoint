import { SelectField } from '@/features/register/components/select-field';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

describe('SelectField', () => {
  // Mock options for testing
  const options = [
    { value: 'OWNER', label: 'Property Owner' },
    { value: 'TENANT', label: 'Tenant' },
  ];

  // Mock register function
  const mockRegister = vi.fn().mockReturnValue({
    onChange: vi.fn(),
    onBlur: vi.fn(),
    name: 'role',
  });

  it('renders the select element with provided options', () => {
    render(
      <SelectField register={mockRegister} name='role' options={options} />,
    );

    const selectElement = screen.getByRole('combobox');
    expect(selectElement).toBeInTheDocument();

    // Check if all options are rendered
    expect(screen.getByText('Property Owner')).toBeInTheDocument();
    expect(screen.getByText('Tenant')).toBeInTheDocument();
  });

  it('displays an error message when error prop is provided', () => {
    const errorMessage = 'Please select a role';

    render(
      <SelectField
        register={mockRegister}
        name='role'
        options={options}
        error={errorMessage}
      />,
    );

    const errorElement = screen.getByText(errorMessage);
    expect(errorElement).toBeInTheDocument();
    expect(errorElement.tagName.toLowerCase()).toBe('p');
  });

  it('applies correct styling to error message', () => {
    const errorMessage = 'Please select a role';

    render(
      <SelectField
        register={mockRegister}
        name='role'
        options={options}
        error={errorMessage}
      />,
    );

    const errorElement = screen.getByText(errorMessage);
    expect(errorElement).toHaveClass('text-red-500', 'text-sm', 'mt-1');
  });

  it('does not display an error message when error prop is not provided', () => {
    const { container } = render(
      <SelectField register={mockRegister} name='role' options={options} />,
    );

    // More precise way to check for absence of error message
    expect(
      screen.queryByText(/./i, { selector: 'p.text-red-500' }),
    ).not.toBeInTheDocument();
    // Ensure there are no paragraph elements at all
    expect(container.querySelector('p')).toBeNull();
  });

  it('calls register function with the correct field name', () => {
    render(
      <SelectField register={mockRegister} name='role' options={options} />,
    );

    expect(mockRegister).toHaveBeenCalledWith('role');
  });

  it('applies the correct CSS classes to the select element', () => {
    render(
      <SelectField register={mockRegister} name='role' options={options} />,
    );

    const selectElement = screen.getByRole('combobox');
    expect(selectElement).toHaveClass(
      'w-full',
      'rounded',
      'border',
      'px-3',
      'py-2',
    );
  });

  it('renders correct option values', async () => {
    render(
      <SelectField register={mockRegister} name='role' options={options} />,
    );

    const selectElement = screen.getByRole('combobox');
    const optionElements = selectElement.querySelectorAll('option');

    expect(optionElements.length).toBe(options.length);
    expect(optionElements[0].value).toBe('OWNER');
    expect(optionElements[1].value).toBe('TENANT');
  });

  it('handles empty options array', () => {
    render(<SelectField register={mockRegister} name='role' options={[]} />);

    const selectElement = screen.getByRole('combobox');
    expect(selectElement.children.length).toBe(0);
  });
});
