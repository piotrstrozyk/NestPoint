import type { ApartmentForm } from '@/features/add-apartment/schemas/add-apartment';
import { TitleDescription } from '@/features/owner/components/edit-apartment/title-description';
import { render, screen } from '@testing-library/react';
import { FieldErrors } from 'react-hook-form';
import { describe, expect, it } from 'vitest';

function makeRegister() {
  return (name: keyof ApartmentForm) => ({
    name,
    onChange: () => {},
    onBlur: () => {},
    ref: () => {},
  });
}

describe('TitleDescription', () => {
  it('renders title and description fields', () => {
    render(
      <TitleDescription
        register={
          makeRegister() as unknown as import('react-hook-form').UseFormRegister<ApartmentForm>
        }
        errors={{} as FieldErrors<ApartmentForm>}
      />,
    );
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
  });

  it('shows error message for title', () => {
    render(
      <TitleDescription
        register={
          makeRegister() as unknown as import('react-hook-form').UseFormRegister<ApartmentForm>
        }
        errors={
          { title: { message: 'Title error' } } as FieldErrors<ApartmentForm>
        }
      />,
    );
    expect(screen.getByText('Title error')).toBeInTheDocument();
  });

  it('shows error message for description', () => {
    render(
      <TitleDescription
        register={
          makeRegister() as unknown as import('react-hook-form').UseFormRegister<ApartmentForm>
        }
        errors={
          {
            description: { message: 'Description error' },
          } as FieldErrors<ApartmentForm>
        }
      />,
    );
    expect(screen.getByText('Description error')).toBeInTheDocument();
  });
});
