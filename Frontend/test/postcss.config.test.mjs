import { describe, expect, it } from 'vitest';
import config from '../postcss.config';

describe('postcss.config', () => {
  it('should be defined', () => {
    expect(config).toBeDefined();
    expect(typeof config).toBe('object');
  });

  it('should have plugins property as an object', () => {
    expect(config.plugins).toBeDefined();
    expect(typeof config.plugins).toBe('object');
  });

  it('should include @tailwindcss/postcss as a plugin', () => {
    expect(Object.keys(config.plugins)).toContain('@tailwindcss/postcss');
    expect(typeof config.plugins['@tailwindcss/postcss']).toBe('object');
  });
});
