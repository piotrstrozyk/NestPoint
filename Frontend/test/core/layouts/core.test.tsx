import CoreLayout from '@/core/layouts/core';
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';

// Mock components
vi.mock('@/core/components', () => ({
  Navbar: () => <nav data-testid='navbar' />,
  Footer: () => <footer data-testid='footer' />,
}));
vi.mock('@/core/layouts/html', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid='htmllayout'>{children}</div>
  ),
}));
vi.mock('@/core/providers/all', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid='allproviders'>{children}</div>
  ),
}));

describe('CoreLayout', () => {
  it('renders HtmlLayout, AllProviders, Navbar, Footer, and children', () => {
    render(
      <CoreLayout>
        <div data-testid='child'>Test Child</div>
      </CoreLayout>,
    );

    expect(screen.getByTestId('htmllayout')).toBeInTheDocument();
    expect(screen.getByTestId('allproviders')).toBeInTheDocument();
    expect(screen.getByTestId('navbar')).toBeInTheDocument();
    expect(screen.getByTestId('footer')).toBeInTheDocument();
    expect(screen.getByTestId('child')).toHaveTextContent('Test Child');
  });

  it('renders main with correct class names', () => {
    render(
      <CoreLayout>
        <div>Child</div>
      </CoreLayout>,
    );
    const main = screen.getByRole('main');
    expect(main).toHaveClass(
      'bg-background',
      'flex',
      'flex-1',
      'flex-col',
      'bg-cover',
      'bg-center',
      'bg-no-repeat',
    );
  });
});
