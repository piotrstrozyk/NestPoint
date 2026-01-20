import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

Object.defineProperty(window, 'location', {
  writable: true,
  value: {
    href: '',
    assign: vi.fn((url: string) => {
      window.location.href = url;
    }),
    replace: vi.fn((url: string) => {
      window.location.href = url;
    }),
  },
});
