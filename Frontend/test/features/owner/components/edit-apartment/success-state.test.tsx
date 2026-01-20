import SuccessState, {
  SuccessState as NamedSuccessState,
} from '@/features/owner/components/edit-apartment/success-state';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', async (importActual) => {
  const actual = await importActual<typeof import('next/navigation')>();
  return {
    ...actual,
    useRouter: vi.fn(),
  };
});

import { useRouter } from 'next/navigation';

type MockRouter = {
  push: (url: string) => void;
  replace: (url: string) => void;
  back: () => void;
  forward: () => void;
  refresh: () => void;
  prefetch: (url: string) => Promise<void>;
};

describe('SuccessState', () => {
  const aptId = 123;
  let push: ReturnType<typeof vi.fn>;
  let mockRouter: MockRouter;

  beforeEach(() => {
    push = vi.fn();
    mockRouter = {
      push,
      replace: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
      prefetch: vi.fn().mockResolvedValue(undefined),
    };
  });

  afterEach(() => {
    // Restore useRouter mock if it exists
    (useRouter as unknown as { mockRestore?: () => void }).mockRestore?.();
  });

  it('renders the success message and both navigation buttons', () => {
    render(<SuccessState aptId={aptId} router={mockRouter} />);
    expect(screen.getByText(/success!/i)).toBeInTheDocument();
    expect(
      screen.getByText(/your apartment has been successfully updated/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /view apartment/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /my apartments/i }),
    ).toBeInTheDocument();
  });

  it('navigates to the apartment page when "View Apartment" is clicked', async () => {
    render(<SuccessState aptId={aptId} router={mockRouter} />);
    await userEvent.click(
      screen.getByRole('button', { name: /view apartment/i }),
    );
    expect(push).toHaveBeenCalledWith(`/apartment/${aptId}`);
  });

  it('navigates to the apartments list when "My Apartments" is clicked', async () => {
    render(<SuccessState aptId={aptId} router={mockRouter} />);
    await userEvent.click(
      screen.getByRole('button', { name: /my apartments/i }),
    );
    expect(push).toHaveBeenCalledWith('/owner/apartments');
  });

  it('works with the named export as well', () => {
    render(<NamedSuccessState aptId={aptId} router={mockRouter} />);
    expect(screen.getByText(/success!/i)).toBeInTheDocument();
  });

  it('uses the internal router if no router prop is provided', async () => {
    const mockPush = vi.fn();
    (
      useRouter as unknown as { mockReturnValue: (v: unknown) => void }
    ).mockReturnValue({
      push: mockPush,
      replace: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
      prefetch: vi.fn().mockResolvedValue(undefined),
    });
    render(<SuccessState aptId={aptId} />);
    await userEvent.click(
      screen.getByRole('button', { name: /view apartment/i }),
    );
    expect(mockPush).toHaveBeenCalledWith(`/apartment/${aptId}`);
  });
});
