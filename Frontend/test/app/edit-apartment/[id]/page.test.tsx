import EditApartmentPage from '@/app/edit-apartment/[id]/page';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useParams: () => ({ id: '1' }), // Provide a fake id
}));

// Mock next-auth/react
vi.mock('next-auth/react', () => ({
  useSession: () => ({
    data: { user: { id: 1, role: 'OWNER' } },
    status: 'authenticated',
  }),
}));

describe('EditApartmentPage (app/edit-apartment/[id]/page)', () => {
  it('renders without crashing', () => {
    const queryClient = new QueryClient();
    expect(() =>
      render(
        <QueryClientProvider client={queryClient}>
          <EditApartmentPage />
        </QueryClientProvider>,
      ),
    ).not.toThrow();
  });
});
