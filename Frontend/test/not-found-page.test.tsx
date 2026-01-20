import NotFoundPage from '@/features/not-found/pages/not-found-page';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { vi } from 'vitest';

// Mock out the SVG icon so we can assert on its “alt” or role
vi.mock('@/core/components/svg/not-found', () => {
  return {
    __esModule: true,
    default: () => <svg data-testid='mock-icon' />,
  };
});

// Mock Next.js Link to just render an <a>
vi.mock('next/link', () => {
  return {
    __esModule: true,
    default: ({
      href,
      children,
    }: {
      href: string;
      children: React.ReactNode;
    }) => <a href={href}>{children}</a>,
  };
});

describe('NotFoundPage', () => {
  beforeEach(() => {
    render(<NotFoundPage />);
  });

  it('renders the not‐found icon', () => {
    const icon = screen.getByTestId('mock-icon');
    expect(icon).toBeInTheDocument();
  });

  it('shows the correct heading and message', () => {
    expect(
      screen.getByRole('heading', { level: 1, name: /page not found/i }),
    ).toBeInTheDocument();

    expect(
      screen.getByText(/the page you are looking for does not exist/i),
    ).toBeInTheDocument();
  });

  it('has a Return to Home link pointing at “/”', () => {
    const link = screen.getByRole('link', { name: /return to home/i });
    expect(link).toHaveAttribute('href', '/');
  });
});
