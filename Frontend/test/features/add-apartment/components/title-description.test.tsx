import { TitleDescription } from '@/features/add-apartment/components/title-description';
import { ApartmentForm } from '@/features/add-apartment/schemas/add-apartment';
import { render, screen } from '@testing-library/react';
import { UseFormRegister } from 'react-hook-form';
import { describe, expect, it } from 'vitest';

describe('TitleDescription', () => {
  // Mocking UseFormRegister return type as expected by React Hook Form
  const register: UseFormRegister<ApartmentForm> = (name) => ({
    name,
    onChange: async () => {},
    onBlur: async () => {},
    ref: () => {},
  });

  it('shows error messages when errors are present', () => {
    render(
      <TitleDescription
        register={register}
        errors={{
          title: { type: 'manual', message: 'Title error' },
          description: { type: 'manual', message: 'Description error' },
        }}
      />,
    );

    expect(screen.getByText('Title error')).toBeInTheDocument();
    expect(screen.getByText('Description error')).toBeInTheDocument();
  });
});
