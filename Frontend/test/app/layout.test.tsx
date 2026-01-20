import RootLayout, { generateMetadata } from '@/app/layout';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/core/components/sonner', () => ({
  Toaster: () => <div data-testid='toaster' />,
}));
vi.mock('@/core/layouts/core', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid='core-layout'>{children}</div>
  ),
}));
vi.mock('@/core/lib/nextjs-generate-metadata', () => ({
  __esModule: true,
  default: vi.fn(),
}));

describe('RootLayout', () => {
  it('renders children inside CoreLayout', () => {
    render(
      <RootLayout>
        <div data-testid='child'>Hello</div>
      </RootLayout>,
    );
    const layout = screen.getByTestId('core-layout');
    expect(layout).toBeInTheDocument();
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('renders Toaster inside CoreLayout', () => {
    render(
      <RootLayout>
        <div>Test</div>
      </RootLayout>,
    );
    expect(screen.getByTestId('toaster')).toBeInTheDocument();
  });
});

describe('generateMetadata', () => {
  it('should be exported', () => {
    expect(generateMetadata).toBeDefined();
    expect(typeof generateMetadata).toBe('function');
  });
});
