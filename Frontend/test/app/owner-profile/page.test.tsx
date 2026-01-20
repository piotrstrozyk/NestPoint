import OwnerProfilePage from '@/app/owner-profile/page';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useParams: () => ({}),
}));

// Mock next-auth/react
vi.mock('next-auth/react', () => ({
  useSession: () => ({
    data: { user: { id: 1, role: 'OWNER' } },
    status: 'authenticated',
  }),
}));

describe('OwnerProfilePage (app/owner-profile/page)', () => {
  it('renders without crashing', () => {
    const queryClient = new QueryClient();
    expect(() =>
      render(
        <QueryClientProvider client={queryClient}>
          <OwnerProfilePage />
        </QueryClientProvider>,
      ),
    ).not.toThrow();
  });
});
