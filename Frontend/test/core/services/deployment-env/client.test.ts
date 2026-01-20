import { afterEach, describe, expect, it, vi } from 'vitest';

// 1) Mock the createEnv import
vi.mock('@t3-oss/env-nextjs', () => ({
  createEnv: vi.fn(),
}));

describe('clientEnv', () => {
  // Clean up between tests
  afterEach(() => {
    delete process.env.CI;
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('passes skipValidation: true when CI is set', async () => {
    // Arrange: set CI
    process.env.CI = '1';

    // Act: import our module, which will invoke createEnv
    const { createEnv } = await import('@t3-oss/env-nextjs');
    await import('@/core/services/deployment-env/client');

    // Assert: skipValidation must be true
    expect(createEnv).toHaveBeenCalledWith(
      expect.objectContaining({ skipValidation: true }),
    );
  });

  it('passes skipValidation: false when CI is not set', async () => {
    // Arrange: ensure CI is unset (or empty)
    delete process.env.CI;

    // Act
    const { createEnv } = await import('@t3-oss/env-nextjs');
    await import('@/core/services/deployment-env/client');

    // Assert: skipValidation must be false
    expect(createEnv).toHaveBeenCalledWith(
      expect.objectContaining({ skipValidation: false }),
    );
  });
});
