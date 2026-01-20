import tsconfigPaths from 'vitest-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [tsconfigPaths()],
  esbuild: {
    jsxInject: `import React from 'react'`,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './test/setup.ts',
    mockReset: true,
    include: ['**/*.test.{ts,tsx,mjs}'],
    deps: {
      inline: [/^next\//, /^@?testing-library\//],
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
    },
  },
});
