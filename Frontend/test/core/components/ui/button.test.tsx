import { Button } from '@/core/components/ui/button';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

describe('Button', () => {
  it('renders with default props', () => {
    render(<Button>Click me</Button>);
    const btn = screen.getByRole('button');
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveTextContent('Click me');
    expect(btn).toHaveAttribute('data-slot', 'button');
  });

  it('renders children', () => {
    render(<Button>Test Child</Button>);
    expect(screen.getByText('Test Child')).toBeInTheDocument();
  });

  it('applies variant and size classes', () => {
    render(
      <Button variant='destructive' size='lg'>
        Destructive
      </Button>,
    );
    const btn = screen.getByRole('button');
    expect(btn.className).toMatch(/bg-red-500/);
    expect(btn.className).toMatch(/px-6/);
  });

  it('is disabled when disabled prop is set', () => {
    render(<Button disabled>Disabled</Button>);
    const btn = screen.getByRole('button');
    expect(btn).toBeDisabled();
  });

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click</Button>);
    const btn = screen.getByRole('button');
    fireEvent.click(btn);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('renders as a different element with asChild', () => {
    render(
      <Button asChild>
        <a href='/test'>Link</a>
      </Button>,
    );
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/test');
    expect(link).toHaveAttribute('data-slot', 'button');
  });

  it('has data-slot="button" attribute', () => {
    render(<Button>Slot Test</Button>);
    const btn = screen.getByRole('button');
    expect(btn).toHaveAttribute('data-slot', 'button');
  });
});
