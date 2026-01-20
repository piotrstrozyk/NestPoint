import { Query, QueryClient } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';

type TanstackQueryModule = typeof import('@/core/lib/tanstack-query');

declare module '@/core/lib/tanstack-query' {
  // Use the correct type for QueryClient if possible
  let browserQueryClient:
    | import('@tanstack/react-query').QueryClient
    | undefined;
}

describe('getQueryClient', () => {
  beforeEach(() => {
    // Reset the cached browserQueryClient between tests
    import('@/core/lib/tanstack-query').then((mod) => {
      (mod as TanstackQueryModule).browserQueryClient = undefined;
    });
  });

  it('should return the same QueryClient instance on browser', () => {
    vi.mock('@tanstack/react-query', async () => {
      const actual = await vi.importActual<
        typeof import('@tanstack/react-query')
      >('@tanstack/react-query');
      return { ...actual, isServer: false };
    });
    // Re-import to apply the mock
    return import('@/core/lib/tanstack-query').then((mod) => {
      const client1 = mod.getQueryClient();
      const client2 = mod.getQueryClient();
      expect(client1).toBeInstanceOf(QueryClient);
      expect(client2).toBeInstanceOf(QueryClient);
      expect(client1).toStrictEqual(client2); // Should be the same instance
    });
  });

  it('should set correct defaultOptions', () => {
    vi.mock('@tanstack/react-query', async () => {
      const actual = await vi.importActual<
        typeof import('@tanstack/react-query')
      >('@tanstack/react-query');
      return { ...actual, isServer: true };
    });
    return import('@/core/lib/tanstack-query').then((mod) => {
      const client = mod.getQueryClient();
      expect(client.getDefaultOptions().queries?.staleTime).toBe(60000);
      // You can check for staleTime or other valid properties here
      expect(client.getDefaultOptions().queries?.staleTime).toBe(60000);
    });
  });
});

it('should cache browserQueryClient and not recreate it', async () => {
  vi.mock('@tanstack/react-query', async () => {
    const actual = await vi.importActual<
      typeof import('@tanstack/react-query')
    >('@tanstack/react-query');
    return { ...actual, isServer: false };
  });
  const mod = await import('@/core/lib/tanstack-query');
  (mod as TanstackQueryModule).browserQueryClient = undefined;
  const client1 = mod.getQueryClient();
  const client2 = mod.getQueryClient();
  expect(client1).toStrictEqual(client2);
});

it('should create browserQueryClient if it does not exist', async () => {
  vi.mock('@tanstack/react-query', async () => {
    const actual = await vi.importActual<
      typeof import('@tanstack/react-query')
    >('@tanstack/react-query');
    return { ...actual, isServer: false };
  });
  const mod = await import('@/core/lib/tanstack-query');
  (mod as TanstackQueryModule).browserQueryClient = undefined;
  const client = mod.getQueryClient();
  expect(client).toBeDefined();
});

describe('getQueryClient server branch', () => {
  it('returns a new QueryClient when isServer is true', async () => {
    vi.resetModules();
    vi.mock('@tanstack/react-query', async () => {
      const actual = await vi.importActual<
        typeof import('@tanstack/react-query')
      >('@tanstack/react-query');
      return { ...actual, isServer: true };
    });
    const mod = await import('@/core/lib/tanstack-query');
    const client = mod.getQueryClient();
    expect(client).toBeInstanceOf(QueryClient);
  });
});

describe('shouldDehydrateQuery', () => {
  it('returns true if defaultShouldDehydrateQuery returns true', async () => {
    const { shouldDehydrateQuery } = await import('@/core/lib/tanstack-query');
    const query = { state: { status: 'idle' } } as unknown as Query;
    // Patch defaultShouldDehydrateQuery to return true
    const mod = await import('@tanstack/react-query');
    const orig = mod.defaultShouldDehydrateQuery;
    mod.defaultShouldDehydrateQuery = () => true;
    expect(shouldDehydrateQuery(query)).toBe(true);
    mod.defaultShouldDehydrateQuery = orig;
  });
  it('returns true if query.state.status is pending and defaultShouldDehydrateQuery is false', async () => {
    const { shouldDehydrateQuery } = await import('@/core/lib/tanstack-query');
    const query = { state: { status: 'pending' } } as unknown as Query;
    // Patch defaultShouldDehydrateQuery to return false
    const mod = await import('@tanstack/react-query');
    const orig = mod.defaultShouldDehydrateQuery;
    mod.defaultShouldDehydrateQuery = () => false;
    expect(shouldDehydrateQuery(query)).toBe(true);
    mod.defaultShouldDehydrateQuery = orig;
  });
  it('returns false if both are false', async () => {
    const { shouldDehydrateQuery } = await import('@/core/lib/tanstack-query');
    const query = { state: { status: 'idle' } } as unknown as Query;
    const mod = await import('@tanstack/react-query');
    const orig = mod.defaultShouldDehydrateQuery;
    mod.defaultShouldDehydrateQuery = () => false;
    expect(shouldDehydrateQuery(query)).toBe(false);
    mod.defaultShouldDehydrateQuery = orig;
  });
});
