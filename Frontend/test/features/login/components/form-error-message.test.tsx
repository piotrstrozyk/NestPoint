import { FormErrorMessage } from '@/features/login/components/form-error-message';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('FormErrorMessage', () => {
  it('renders nothing when message is null', () => {
    const { container } = render(<FormErrorMessage message={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders the error message when provided', () => {
    const errorMessage = 'Invalid credentials';
    render(<FormErrorMessage message={errorMessage} />);

    const messageElement = screen.getByText(errorMessage);
    expect(messageElement).toBeInTheDocument();
    expect(messageElement).toHaveClass('text-red-500');
  });

  it('renders with the correct styling', () => {
    render(<FormErrorMessage message='Error message' />);

    const messageElement = screen.getByText('Error message');
    expect(messageElement.tagName).toBe('P');
    expect(messageElement).toHaveClass('text-center');
    expect(messageElement).toHaveClass('text-red-500');
  });
});
