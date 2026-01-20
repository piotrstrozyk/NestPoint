import { Toaster } from '@/core/components/sonner';
import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

// Mock next-themes useTheme
vi.mock('next-themes', () => ({
  useTheme: () => ({ theme: 'dark' }),
}));

// Mock sonner Toaster
vi.mock('sonner', () => ({
  Toaster: ({
    theme,
    ...props
  }: { theme?: string } & React.ComponentProps<'div'>) => (
    <div data-testid='sonner-toaster' {...props}>
      {theme}
    </div>
  ),
}));

describe('Toaster', () => {
  it('renders Sonner Toaster with correct theme and class', () => {
    const { getByTestId } = render(<Toaster />);
    const sonner = getByTestId('sonner-toaster');
    expect(sonner).toBeInTheDocument();
    expect(sonner).toHaveClass('toaster', 'group');
    expect(sonner.textContent).toBe('dark');
  });

  it('passes custom props to Sonner Toaster', () => {
    const { getByTestId } = render(<Toaster data-custom='test' />);
    const sonner = getByTestId('sonner-toaster');
    expect(sonner.getAttribute('data-custom')).toBe('test');
  });
});
