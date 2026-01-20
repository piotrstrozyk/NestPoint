import TenantProfilePage from '@/app/tenant-profile/page';
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
    data: { user: { id: 1, role: 'TENANT' } },
    status: 'authenticated',
  }),
}));

describe('TenantProfilePage (app/tenant-profile/page)', () => {
  it('renders without crashing', () => {
    const queryClient = new QueryClient();
    expect(() =>
      render(
        <QueryClientProvider client={queryClient}>
          <TenantProfilePage />
        </QueryClientProvider>,
      ),
    ).not.toThrow();
  });
});
