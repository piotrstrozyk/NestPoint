import FAQPage from '@/features/faq/pages/faq-page';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

// Mock the imported components
vi.mock('@/core/components/svg/faq', () => ({
  default: ({ className }: { className?: string }) => (
    <div data-testid='faq-icon' className={className} />
  ),
}));

vi.mock('@/features/faq/components/faq', () => ({
  default: () => <div data-testid='faq-component' />,
}));

describe('FAQPage', () => {
  it('renders the FAQ page with icon and FAQ component', () => {
    render(<FAQPage />);

    expect(screen.getByTestId('faq-icon')).toBeInTheDocument();
    expect(screen.getByTestId('faq-component')).toBeInTheDocument();
  });

  it('passes the correct className to FAQIcon', () => {
    render(<FAQPage />);
    const icon = screen.getByTestId('faq-icon');
    expect(icon).toHaveClass('mx-auto');
    expect(icon).toHaveClass('flex');
    expect(icon).toHaveClass('w-full');
  });

  it('renders with proper container structure', () => {
    const { container } = render(<FAQPage />);
    const mainDiv = container.firstChild;

    expect(mainDiv).toHaveClass('mx-auto');
    expect(mainDiv).toHaveClass('my-24');
    expect(mainDiv).toHaveClass('flex');
    expect(mainDiv).toHaveClass('w-1/2');
    expect(mainDiv).toHaveClass('flex-col');
    expect(mainDiv).toHaveClass('justify-center');
  });
});
