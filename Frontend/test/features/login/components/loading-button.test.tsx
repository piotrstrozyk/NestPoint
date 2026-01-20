import { LoadingButton } from '@/features/login/components/loading-button';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('LoadingButton', () => {
  const defaultProps = {
    isLoading: false,
    disabled: false,
    loadingText: 'Loading...',
    text: 'Submit',
  };

  it('renders with the correct text when not loading', () => {
    render(<LoadingButton {...defaultProps} />);

    expect(screen.getByText('Submit')).toBeInTheDocument();
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
  });

  it('renders with the loading text when loading', () => {
    render(<LoadingButton {...defaultProps} isLoading={true} />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.queryByText('Submit')).not.toBeInTheDocument();
  });

  it('has submit type by default', () => {
    render(<LoadingButton {...defaultProps} />);

    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
  });

  it('accepts custom button type', () => {
    render(<LoadingButton {...defaultProps} type='button' />);

    expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
  });

  it('is not disabled by default', () => {
    render(<LoadingButton {...defaultProps} />);

    expect(screen.getByRole('button')).not.toBeDisabled();
  });

  it('is disabled when disabled prop is true', () => {
    render(<LoadingButton {...defaultProps} disabled={true} />);

    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('is disabled when isLoading prop is true', () => {
    render(<LoadingButton {...defaultProps} isLoading={true} />);

    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('has the correct CSS classes', () => {
    render(<LoadingButton {...defaultProps} />);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('w-full');
    expect(button).toHaveClass('rounded');
    expect(button).toHaveClass('bg-indigo-600');
    expect(button).toHaveClass('text-white');
  });
});
