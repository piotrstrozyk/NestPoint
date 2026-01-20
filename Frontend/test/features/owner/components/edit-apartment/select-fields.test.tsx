import type { ApartmentForm } from '@/features/add-apartment/schemas/add-apartment';
import { SelectFields } from '@/features/owner/components/edit-apartment/select-fields';
import { render, screen } from '@testing-library/react';
import { FieldErrors } from 'react-hook-form';
import { describe, expect, it } from 'vitest';

function makeRegister() {
  return ((name: keyof ApartmentForm) => ({
    name,
    onChange: () => {},
    onBlur: () => {},
    ref: () => {},
  })) as unknown as import('react-hook-form').UseFormRegister<ApartmentForm>;
}

describe('SelectFields', () => {
  it('renders all select fields and options', () => {
    render(
      <SelectFields
        register={makeRegister()}
        errors={{} as FieldErrors<ApartmentForm>}
      />,
    );
    // Check for all select fields by label text (use selector to avoid option text)
    expect(
      screen.getByText(/kitchen/i, { selector: 'span' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/yard access/i, { selector: 'span' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/pool access/i, { selector: 'span' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/property type/i, { selector: 'span' }),
    ).toBeInTheDocument();
    // Check for some options
    expect(screen.getByText(/private kitchen/i)).toBeInTheDocument();
    expect(screen.getByText(/shared yard/i)).toBeInTheDocument();
    expect(screen.getByText(/no pool access/i)).toBeInTheDocument();
    expect(screen.getByText(/apartment/i)).toBeInTheDocument();
  });

  it('shows error messages for each field', () => {
    render(
      <SelectFields
        register={makeRegister()}
        errors={
          {
            kitchen: { message: 'Kitchen error' },
            yardAccess: { message: 'Yard error' },
            poolAccess: { message: 'Pool error' },
            propertyType: { message: 'Property error' },
          } as FieldErrors<ApartmentForm>
        }
      />,
    );
    expect(screen.getByText('Kitchen error')).toBeInTheDocument();
    expect(screen.getByText('Yard error')).toBeInTheDocument();
    expect(screen.getByText('Pool error')).toBeInTheDocument();
    expect(screen.getByText('Property error')).toBeInTheDocument();
  });

  it('shows selected option description if watch is provided', () => {
    const watch = (...args: unknown[]) => {
      const name = args[0];
      switch (name) {
        case 'kitchen':
          return 'PRIVATE';
        case 'yardAccess':
          return 'SHARED';
        case 'poolAccess':
          return 'NONE';
        case 'propertyType':
          return 'APARTMENT';
        default:
          return '';
      }
    };
    render(
      <SelectFields
        register={makeRegister()}
        errors={{} as FieldErrors<ApartmentForm>}
        watch={watch as import('react-hook-form').UseFormWatch<ApartmentForm>}
      />,
    );
    expect(screen.getByText('Exclusive use')).toBeInTheDocument(); // kitchen PRIVATE
    expect(screen.getByText('Common outdoor area')).toBeInTheDocument(); // yardAccess SHARED
    expect(screen.getByText('No swimming pool')).toBeInTheDocument(); // poolAccess NONE
    expect(
      screen.getByText('Residential unit in a building'),
    ).toBeInTheDocument(); // propertyType APARTMENT
  });

  it('does not render description <p> when watch is not provided', () => {
    render(
      <SelectFields
        register={makeRegister()}
        errors={{} as FieldErrors<ApartmentForm>}
      />,
    );
    // There should be no description <p> elements at all
    expect(screen.queryByText('Exclusive use')).toBeNull();
    expect(screen.queryByText('Common outdoor area')).toBeNull();
    expect(screen.queryByText('No swimming pool')).toBeNull();
    expect(screen.queryByText('Residential unit in a building')).toBeNull();
    // Optionally, check that no <p> with description class exists
    const descPs = screen.queryAllByText(
      (_, el) => el?.className.includes('text-xs text-gray-500') ?? false,
      { selector: 'p' },
    );
    expect(descPs.length).toBe(4);
  });

  it('renders empty description <p> for each select when watch is not provided', () => {
    render(
      <SelectFields
        register={makeRegister()}
        errors={{} as FieldErrors<ApartmentForm>}
      />,
    );
    // There should be 4 description <p> elements, all empty
    const descPs = screen
      .getAllByText('', { selector: 'p' })
      .filter((el) => el.className.includes('text-xs text-gray-500'));
    expect(descPs.length).toBe(4);
    descPs.forEach((p) => expect(p).toBeInTheDocument());
  });

  it('renders empty description <p> if watch returns a value not in options', () => {
    // watch returns a value not present in any options for select fields
    const watch = ((name: keyof ApartmentForm) => {
      if (
        name === 'kitchen' ||
        name === 'yardAccess' ||
        name === 'poolAccess' ||
        name === 'propertyType'
      ) {
        return 'NOT_A_REAL_OPTION';
      }
      return undefined;
    }) as unknown as import('react-hook-form').UseFormWatch<ApartmentForm>;
    render(
      <SelectFields
        register={makeRegister()}
        errors={{} as FieldErrors<ApartmentForm>}
        watch={watch}
      />,
    );
    // All 4 <p> should be empty
    const descPs = screen
      .getAllByText('', { selector: 'p' })
      .filter((el) => el.className.includes('text-xs text-gray-500'));
    expect(descPs.length).toBe(4);
  });
});
