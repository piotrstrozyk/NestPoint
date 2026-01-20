import { RegistrationForm } from '@/features/register/components/registration-form';
import { useRegister } from '@/features/register/hooks/use-register';
import RegistrationPage from '@/features/register/pages/registration-page';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the hooks and components
vi.mock('@/features/register/hooks/use-register');
vi.mock('@/features/register/components/registration-form', () => ({
  RegistrationForm: vi.fn(() => <div data-testid='registration-form' />),
}));
vi.mock('next/link', () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

describe('RegistrationPage', () => {
  const mockRegister = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useRegister as jest.Mock).mockReturnValue({
      register: mockRegister,
      isLoading: false,
      error: null,
    });
  });

  it('renders the registration page with correct title', () => {
    render(<RegistrationPage />);
    expect(screen.getByText('Create an Account')).toBeInTheDocument();
  });

  it('displays error message when there is an error', () => {
    (useRegister as jest.Mock).mockReturnValue({
      register: mockRegister,
      isLoading: false,
      error: 'Registration failed',
    });

    render(<RegistrationPage />);
    expect(screen.getByText('Registration failed')).toBeInTheDocument();
  });

  it('calls registerUser when form is submitted', () => {
    render(<RegistrationPage />);

    // Extract the onSubmit prop passed to RegistrationForm
    const formProps = (
      RegistrationForm as unknown as { mock: { calls: unknown[][] } }
    ).mock.calls[0][0] as {
      onSubmit: (data: { email: string; password: string }) => void;
    };
    const testData = { email: 'test@example.com', password: 'password' };

    // Call the onSubmit handler
    formProps.onSubmit(testData);

    // Verify register was called with correct data
    expect(mockRegister).toHaveBeenCalledWith(testData);
  });

  it('renders the sign in link correctly', () => {
    render(<RegistrationPage />);
    const loginLink = screen.getByText('Sign in');
    expect(loginLink).toBeInTheDocument();
    expect(loginLink.getAttribute('href')).toBe('/login');
  });
});
