import SubmitButton from '@/features/auctions/components/form-fields/submit-button';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('SubmitButton', () => {
  it('renders with the correct label when not submitting', () => {
    render(
      <SubmitButton
        isValid={true}
        isSubmitting={false}
        label='Submit'
        submittingLabel='Submitting...'
      />,
    );

    expect(screen.getByText('Submit')).toBeInTheDocument();
    expect(screen.queryByText('Submitting...')).not.toBeInTheDocument();
  });

  it('renders with the correct label when submitting', () => {
    render(
      <SubmitButton
        isValid={true}
        isSubmitting={true}
        label='Submit'
        submittingLabel='Submitting...'
      />,
    );

    expect(screen.getByText('Submitting...')).toBeInTheDocument();
    expect(screen.queryByText('Submit')).not.toBeInTheDocument();
  });

  it('is disabled when form is invalid', () => {
    render(
      <SubmitButton
        isValid={false}
        isSubmitting={false}
        label='Submit'
        submittingLabel='Submitting...'
      />,
    );

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('is disabled when form is submitting', () => {
    render(
      <SubmitButton
        isValid={true}
        isSubmitting={true}
        label='Submit'
        submittingLabel='Submitting...'
      />,
    );

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('is enabled when form is valid and not submitting', () => {
    render(
      <SubmitButton
        isValid={true}
        isSubmitting={false}
        label='Submit'
        submittingLabel='Submitting...'
      />,
    );

    const button = screen.getByRole('button');
    expect(button).not.toBeDisabled();
  });

  it('has type="submit"', () => {
    render(
      <SubmitButton
        isValid={true}
        isSubmitting={false}
        label='Submit'
        submittingLabel='Submitting...'
      />,
    );

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('type', 'submit');
  });

  it('has the correct CSS classes', () => {
    render(
      <SubmitButton
        isValid={true}
        isSubmitting={false}
        label='Submit'
        submittingLabel='Submitting...'
      />,
    );

    const button = screen.getByRole('button');
    expect(button).toHaveClass(
      'ml-30',
      'rounded',
      'bg-indigo-600',
      'px-4',
      'py-2',
      'text-white',
      'disabled:opacity-50',
    );
  });
});
