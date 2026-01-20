import HeroSection from '@/features/landing-page/components/hero-section';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

// Mock the SVG icon component
vi.mock('@/core/components/svg/nest-1', () => ({
  default: ({ className, fill }: { className?: string; fill?: string }) => (
    <svg
      data-testid='nest-1-icon'
      className={className}
      fill={fill || 'currentColor'}
    />
  ),
}));

describe('HeroSection', () => {
  it('renders the main content correctly', () => {
    render(<HeroSection />);

    // Check if the main title is rendered
    const mainTitle = screen.getByText('NestPoint');
    expect(mainTitle).toBeInTheDocument();
    expect(mainTitle).toHaveClass('font-serif');
    expect(mainTitle).toHaveClass('text-white');

    // Check if the tagline is rendered
    const tagline = screen.getByText('Shelter For The Masses');
    expect(tagline).toBeInTheDocument();
    expect(tagline).toHaveClass('text-white');

    // Check if the SVG icon is rendered with correct props
    const icon = screen.getByTestId('nest-1-icon');
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveAttribute('fill', 'white');
  });

  it('contains responsive layout elements', () => {
    render(<HeroSection />);

    // Just verify that the container is rendered
    expect(document.querySelector('section')).toBeInTheDocument();

    // Check heading elements exist
    expect(document.querySelector('h1')).toBeInTheDocument();
    expect(document.querySelector('h2')).toBeInTheDocument();

    // Verify the icon exists without checking specific classes
    expect(screen.getByTestId('nest-1-icon')).toBeInTheDocument();
  });
});
