import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

// Mock next-auth/react
vi.mock('next-auth/react', () => ({
  SessionProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

import AllProviders from '@/core/providers/all';

describe('AllProviders', () => {
  it('renders children', () => {
    const { getByText } = render(
      <AllProviders>
        <div>Test Child</div>
      </AllProviders>,
    );
    expect(getByText('Test Child')).toBeInTheDocument();
  });
});
