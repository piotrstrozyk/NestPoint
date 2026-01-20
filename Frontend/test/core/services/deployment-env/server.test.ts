import { afterEach, describe, expect, it, vi } from 'vitest';

// 1) Mock the createEnv import
vi.mock('@t3-oss/env-nextjs', () => ({
  createEnv: vi.fn(),
}));

describe('serverEnv', () => {
  // Clean up between tests
  afterEach(() => {
    delete process.env.CI;
    vi.resetModules(); // clear module cache so imports re‑run with new env
    vi.clearAllMocks();
  });

  it('passes skipValidation: true when CI is set', async () => {
    // Arrange
    process.env.CI = 'true';

    // Act
    const { createEnv } = await import('@t3-oss/env-nextjs');
    await import('@/core/services/deployment-env/server');

    // Assert
    expect(createEnv).toHaveBeenCalledWith(
      expect.objectContaining({ skipValidation: true }),
    );
  });

  it('passes skipValidation: false when CI is not set', async () => {
    // Arrange
    delete process.env.CI;

    // Act
    const { createEnv } = await import('@t3-oss/env-nextjs');
    await import('@/core/services/deployment-env/server');

    // Assert
    expect(createEnv).toHaveBeenCalledWith(
      expect.objectContaining({ skipValidation: false }),
    );
  });
});
