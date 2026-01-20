import { AuthFooter } from '@/features/login/components/auth-footer';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

// Mock Next.js Link component
vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    className,
  }: {
    children: React.ReactNode;
    href: string;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

describe('AuthFooter', () => {
  const defaultProps = {
    text: 'Already have an account?',
    linkText: 'Sign in',
    linkHref: '/login',
  };

  it('renders the text correctly', () => {
    render(<AuthFooter {...defaultProps} />);
    expect(screen.getByText(/Already have an account\?/)).toBeInTheDocument();
  });

  it('renders the link with correct text and href', () => {
    render(<AuthFooter {...defaultProps} />);
    const link = screen.getByText('Sign in');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/login');
    expect(link).toHaveClass('text-indigo-600');
  });

  it('renders with different props correctly', () => {
    const customProps = {
      text: 'Need an account?',
      linkText: 'Sign up',
      linkHref: '/register',
    };

    render(<AuthFooter {...customProps} />);
    expect(screen.getByText(/Need an account\?/)).toBeInTheDocument();
    const link = screen.getByText('Sign up');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/register');
  });
});
