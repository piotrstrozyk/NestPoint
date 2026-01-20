import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('api/auth/[...nextauth]/route', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('should call NextAuth with authOptions and export GET and POST handlers', async () => {
    const mockHandler = {};
    const mockNextAuth = vi.fn().mockReturnValue(mockHandler);
    vi.doMock('next-auth', () => ({ default: mockNextAuth }));

    // Re-import after mocks
    const routeModule = await import('@/app/api/auth/[...nextauth]/route');

    expect(mockNextAuth).toHaveBeenCalledTimes(1);
    const calledWith = mockNextAuth.mock.calls[0][0];
    expect(calledWith).toHaveProperty('providers');
    expect(calledWith).toHaveProperty('callbacks');
    expect(routeModule.GET).toBe(mockHandler);
    expect(routeModule.POST).toBe(mockHandler);
  });
});
