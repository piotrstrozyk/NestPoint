import { cn } from '@/core/lib/utils/index';
import { describe, expect, it } from 'vitest';

// Mock implementation for demonstration if needed
// Remove if '@/core/lib/utils/html-classname' is available and tested separately
describe('cn', () => {
  it('should be defined', () => {
    expect(cn).toBeDefined();
  });

  it('should be a function', () => {
    expect(typeof cn).toBe('function');
  });

  // Example usage test, adjust based on actual cn implementation
  it('should return a string when called', () => {
    const result = cn('foo', 'bar');
    expect(typeof result).toBe('string');
  });
});
