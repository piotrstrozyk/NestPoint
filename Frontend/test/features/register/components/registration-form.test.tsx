import { FormField } from '@/features/register/components/form-field';
import { RegistrationForm } from '@/features/register/components/registration-form';
import { SelectField } from '@/features/register/components/select-field';
import { zodResolver } from '@hookform/resolvers/zod';
import { fireEvent, render, screen } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

// Mock dependencies
vi.mock('react-hook-form', () => ({
  useForm: vi.fn(),
}));

vi.mock('@hookform/resolvers/zod', () => ({
  zodResolver: vi.fn(() => 'mockedResolver'),
}));

vi.mock('@/features/register/components/form-field', () => ({
  FormField: vi.fn(() => <div data-testid='mocked-form-field' />),
}));

vi.mock('@/features/register/components/select-field', () => ({
  SelectField: vi.fn(() => <div data-testid='mocked-select-field' />),
}));

describe('RegistrationForm', () => {
  const mockOnSubmit = vi.fn();
  interface RegistrationFormData {
    username: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone: string;
    role: string;
  }

  interface MockEvent {
    preventDefault: () => void;
  }

  type SubmitCallback = (data: RegistrationFormData) => void;

  const mockHandleSubmit = vi.fn(
    (callback: SubmitCallback) => (e: MockEvent) => {
      e.preventDefault();
      callback({
        username: 'testuser',
        email: 'test@example.com',
        password: 'Password123!',
        firstName: 'Test',
        lastName: 'User',
        phone: '123-456-7890',
        role: 'TENANT',
      });
    },
  );

  const mockRegister = vi.fn((name) => ({ name }));

  beforeEach(() => {
    vi.clearAllMocks();

    (useForm as unknown as Mock).mockReturnValue({
      register: mockRegister,
      handleSubmit: mockHandleSubmit,
      formState: {
        errors: {},
        isValid: true,
      },
    });
  });

  it('renders the form with all required fields', () => {
    render(<RegistrationForm onSubmit={mockOnSubmit} isLoading={false} />);

    // Check if all form fields are rendered
    expect(FormField).toHaveBeenCalledTimes(6);
    expect(SelectField).toHaveBeenCalledTimes(1);

    // Verify the submit button is rendered
    expect(screen.getByRole('button')).toBeInTheDocument();
    expect(screen.getByText('Register')).toBeInTheDocument();
  });

  it('initializes useForm with correct parameters', () => {
    render(<RegistrationForm onSubmit={mockOnSubmit} isLoading={false} />);

    expect(useForm).toHaveBeenCalledWith({
      resolver: 'mockedResolver',
      mode: 'onChange',
      reValidateMode: 'onChange',
      defaultValues: { role: 'TENANT' },
    });

    expect(zodResolver).toHaveBeenCalled();
  });

  it('passes form errors to the form fields', () => {
    (useForm as unknown as Mock).mockReturnValue({
      register: mockRegister,
      handleSubmit: mockHandleSubmit,
      formState: {
        errors: {
          email: { message: 'Invalid email' },
          password: { message: 'Password is required' },
        },
        isValid: false,
      },
    });

    render(<RegistrationForm onSubmit={mockOnSubmit} isLoading={false} />);

    // Get all calls to FormField
    const formFieldCalls = (FormField as unknown as Mock).mock.calls;

    // Find the call for email field
    const emailFieldCall = formFieldCalls.find(
      (call) => call[0].name === 'email',
    );
    expect(emailFieldCall).toBeDefined();
    expect(emailFieldCall && emailFieldCall[0].error).toBe('Invalid email');

    // Find the call for password field
    const passwordFieldCall = formFieldCalls.find(
      (call) => call[0].name === 'password',
    );
    expect(passwordFieldCall).toBeDefined();
    expect(passwordFieldCall && passwordFieldCall[0].error).toBe(
      'Password is required',
    );

    // Verify other fields don't have errors
    const usernameFieldCall = formFieldCalls.find(
      (call) => call[0].name === 'username',
    );
    expect(usernameFieldCall).toBeDefined();
    expect(usernameFieldCall && usernameFieldCall[0].error).toBeUndefined();
  });

  it('handles form submission', () => {
    render(<RegistrationForm onSubmit={mockOnSubmit} isLoading={false} />);

    // Use querySelector to directly get the form element
    const form = document.querySelector('form');
    expect(form).toBeInTheDocument();

    fireEvent.submit(form!);

    expect(mockHandleSubmit).toHaveBeenCalled();
    expect(mockOnSubmit).toHaveBeenCalledWith({
      username: 'testuser',
      email: 'test@example.com',
      password: 'Password123!',
      firstName: 'Test',
      lastName: 'User',
      phone: '123-456-7890',
      role: 'TENANT',
    });
  });

  it('disables submit button when form is invalid', () => {
    (useForm as unknown as Mock).mockReturnValue({
      register: mockRegister,
      handleSubmit: mockHandleSubmit,
      formState: {
        errors: {},
        isValid: false,
      },
    });

    render(<RegistrationForm onSubmit={mockOnSubmit} isLoading={false} />);

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('disables submit button and shows loading text when isLoading is true', () => {
    render(<RegistrationForm onSubmit={mockOnSubmit} isLoading={true} />);

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(screen.getByText('Registering…')).toBeInTheDocument();
  });

  it('configures role options correctly for the SelectField', () => {
    render(<RegistrationForm onSubmit={mockOnSubmit} isLoading={false} />);

    // Get the first (and only) call to SelectField
    const selectFieldCall = (SelectField as unknown as Mock).mock.calls[0][0];

    // Check that the options array matches what we expect
    expect(selectFieldCall.options).toEqual([
      { value: 'OWNER', label: 'Owner' },
      { value: 'TENANT', label: 'Tenant' },
    ]);
  });
  it('passes correct props to firstName, lastName, and phone fields', () => {
    render(<RegistrationForm onSubmit={mockOnSubmit} isLoading={false} />);

    const formFieldCalls = (FormField as unknown as Mock).mock.calls;

    // Check firstName field props
    const firstNameField = formFieldCalls.find(
      (call) => call[0].name === 'firstName',
    );
    expect(firstNameField).toBeDefined();
    expect(firstNameField?.[0]).toMatchObject({
      type: 'text',
      placeholder: 'First Name',
      name: 'firstName',
      error: undefined,
    });

    // Check lastName field props
    const lastNameField = formFieldCalls.find(
      (call) => call[0].name === 'lastName',
    );
    expect(lastNameField).toBeDefined();
    expect(lastNameField?.[0]).toMatchObject({
      type: 'text',
      placeholder: 'Last Name',
      name: 'lastName',
      error: undefined,
    });

    // Check phone field props
    const phoneField = formFieldCalls.find((call) => call[0].name === 'phone');
    expect(phoneField).toBeDefined();
    expect(phoneField?.[0]).toMatchObject({
      type: 'text',
      placeholder: 'Phone (xxx-xxx-xxxx)',
      name: 'phone',
      error: undefined,
    });
  });

  it('passes errors for firstName, lastName, and phone fields when they exist', () => {
    (useForm as unknown as Mock).mockReturnValue({
      register: mockRegister,
      handleSubmit: mockHandleSubmit,
      formState: {
        errors: {
          firstName: { message: 'First name is required' },
          lastName: { message: 'Last name is required' },
          phone: { message: 'Invalid phone format' },
        },
        isValid: false,
      },
    });

    render(<RegistrationForm onSubmit={mockOnSubmit} isLoading={false} />);

    const formFieldCalls = (FormField as unknown as Mock).mock.calls;

    // Check error messages are passed to the fields
    const firstNameField = formFieldCalls.find(
      (call) => call[0].name === 'firstName',
    );
    expect(firstNameField?.[0].error).toBe('First name is required');

    const lastNameField = formFieldCalls.find(
      (call) => call[0].name === 'lastName',
    );
    expect(lastNameField?.[0].error).toBe('Last name is required');

    const phoneField = formFieldCalls.find((call) => call[0].name === 'phone');
    expect(phoneField?.[0].error).toBe('Invalid phone format');
  });

  it('passes the correct register function to each field', () => {
    render(<RegistrationForm onSubmit={mockOnSubmit} isLoading={false} />);

    const formFieldCalls = (FormField as unknown as Mock).mock.calls;
    const selectFieldCall = (SelectField as unknown as Mock).mock.calls[0][0];

    // Check register prop is passed to all fields
    const fieldsToCheck = ['firstName', 'lastName', 'phone'];
    fieldsToCheck.forEach((fieldName) => {
      const field = formFieldCalls.find((call) => call[0].name === fieldName);
      expect(field?.[0].register).toBe(mockRegister);
    });

    // Check register prop is passed to role field
    expect(selectFieldCall.register).toBe(mockRegister);
    expect(selectFieldCall.name).toBe('role');
  });

  it('handles error state for role field', () => {
    (useForm as unknown as Mock).mockReturnValue({
      register: mockRegister,
      handleSubmit: mockHandleSubmit,
      formState: {
        errors: {
          role: { message: 'Role selection is required' },
        },
        isValid: false,
      },
    });

    render(<RegistrationForm onSubmit={mockOnSubmit} isLoading={false} />);

    const selectFieldCall = (SelectField as unknown as Mock).mock.calls[0][0];
    expect(selectFieldCall.error).toBe('Role selection is required');
  });
  it('passes username error to the FormField component when it exists', () => {
    // Mock useForm to return an error for the username field
    (useForm as unknown as Mock).mockReturnValue({
      register: mockRegister,
      handleSubmit: mockHandleSubmit,
      formState: {
        errors: {
          username: { message: 'Username is required' },
        },
        isValid: false,
      },
    });

    render(<RegistrationForm onSubmit={mockOnSubmit} isLoading={false} />);

    const formFieldCalls = (FormField as unknown as Mock).mock.calls;

    // Find the call for username field
    const usernameFieldCall = formFieldCalls.find(
      (call) => call[0].name === 'username',
    );
    expect(usernameFieldCall).toBeDefined();
    expect(usernameFieldCall && usernameFieldCall[0].error).toBe(
      'Username is required',
    );
  });
});
