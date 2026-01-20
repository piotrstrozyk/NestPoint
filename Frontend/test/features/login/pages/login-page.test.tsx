import LoginPage from '@/features/login/pages/login-page';
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock all imported components
vi.mock('@/features/login/components/auth-container', () => ({
  AuthContainer: ({
    children,
    title,
  }: {
    children: React.ReactNode;
    title: string;
  }) => (
    <div data-testid='auth-container'>
      <h2>{title}</h2>
      <div>{children}</div>
    </div>
  ),
}));

vi.mock('@/features/login/components/auth-footer', () => ({
  AuthFooter: () => <div data-testid='auth-footer' />,
}));

vi.mock('@/features/login/components/form-error-message', () => ({
  FormErrorMessage: ({ message }: { message: string }) =>
    message ? <div data-testid='error-message'>{message}</div> : null,
}));

vi.mock('@/features/login/components/input-field', () => ({
  InputField: () => <div data-testid='input-field' />,
}));

vi.mock('@/features/login/components/loading-button', () => ({
  LoadingButton: ({ isLoading }: { isLoading: boolean }) => (
    <button data-testid='loading-button' data-loading={String(isLoading)} />
  ),
}));

// Mock Next.js hooks
const pushMock = vi.fn();
const mockParams = { get: vi.fn().mockReturnValue(null) };

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
  useSearchParams: () => mockParams,
}));

// Mock NextAuth
const signInMock = vi.fn();
interface SignInMock {
  (...args: unknown[]): Promise<{ error: string | null }>;
}

vi.mock('next-auth/react', () => ({
  signIn: (...args: Parameters<SignInMock>) => signInMock(...args),
}));

// Mock React Hook Form
let formSubmitHandler: (data: {
  username: string;
  password: string;
}) => Promise<void> | void;
interface MockFormValues {
  username: string;
  password: string;
}

interface MockFormState {
  errors: Record<string, unknown>;
  isValid: boolean;
}

interface MockUseFormReturn {
  register: () => Record<string, unknown>;
  handleSubmit: (
    fn: (data: MockFormValues) => Promise<void> | void,
  ) => (e?: { preventDefault?: () => void }) => Promise<void> | void;
  formState: MockFormState;
}

vi.mock('react-hook-form', () => ({
  useForm: (): MockUseFormReturn => ({
    register: (): Record<string, unknown> => ({}),
    handleSubmit: (fn: (data: MockFormValues) => Promise<void> | void) => {
      formSubmitHandler = fn;
      return (e?: { preventDefault?: () => void }) => {
        e?.preventDefault?.();
        return fn({ username: 'testuser', password: 'testpass' });
      };
    },
    formState: { errors: {}, isValid: true },
  }),
}));

// Mock Zod resolver
vi.mock('@hookform/resolvers/zod', () => ({
  zodResolver: () => ({}),
}));

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockParams.get.mockReturnValue(null);
    signInMock.mockReset();
    signInMock.mockResolvedValue({ error: null });
  });

  it('renders the login form correctly', () => {
    render(<LoginPage />);

    expect(screen.getByTestId('auth-container')).toBeInTheDocument();
    expect(screen.getByText('Sign in')).toBeInTheDocument();
    expect(screen.getAllByTestId('input-field')).toHaveLength(2);
    expect(screen.getByTestId('loading-button')).toBeInTheDocument();
    expect(screen.getByTestId('auth-footer')).toBeInTheDocument();
  });

  it('shows error message from URL parameter', () => {
    mockParams.get.mockReturnValue('session_expired');

    render(<LoginPage />);

    expect(screen.getByTestId('error-message')).toBeInTheDocument();
    expect(
      screen.getByText('Session expired, please sign in again.'),
    ).toBeInTheDocument();
  });

  it('calls signIn with correct credentials on form submission', async () => {
    render(<LoginPage />);

    // Trigger form submission manually
    await formSubmitHandler({ username: 'testuser', password: 'testpass' });

    expect(signInMock).toHaveBeenCalledWith('credentials', {
      redirect: false,
      username: 'testuser',
      password: 'testpass',
    });
  });

  it('redirects to home page after successful login', async () => {
    render(<LoginPage />);

    // Trigger form submission
    await formSubmitHandler({ username: 'testuser', password: 'testpass' });

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith('/');
    });
  });

  it('shows error message on failed login', async () => {
    signInMock.mockResolvedValueOnce({ error: 'Invalid credentials' });

    render(<LoginPage />);

    // Trigger form submission
    await formSubmitHandler({ username: 'testuser', password: 'testpass' });

    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toBeInTheDocument();
      expect(
        screen.getByText('Invalid username or password'),
      ).toBeInTheDocument();
    });
  });
});
