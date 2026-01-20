import { describe, expect, it } from 'vitest';
import nextConfig from '../next.config';

describe('nextConfig', () => {
  it('should be defined', () => {
    expect(nextConfig).toBeDefined();
    expect(typeof nextConfig).toBe('object');
  });

  it('should have correct pageExtensions', () => {
    expect(nextConfig.pageExtensions).toEqual([
      'js',
      'jsx',
      'md',
      'mdx',
      'ts',
      'tsx',
    ]);
  });

  it('should have output set to standalone', () => {
    expect(nextConfig.output).toBe('standalone');
  });

  it('should have images.remotePatterns allowing res.cloudinary.com', () => {
    expect(nextConfig.images).toBeDefined();
    expect(Array.isArray(nextConfig.images?.remotePatterns)).toBe(true);
    expect(nextConfig.images?.remotePatterns).toEqual([
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ]);
  });

  it('should not have domains in images', () => {
    expect(nextConfig.images?.domains).toBeUndefined();
  });

  it('should only allow res.cloudinary.com as image remotePattern', () => {
    expect(nextConfig.images?.remotePatterns?.length ?? 0).toBe(1);
    expect(nextConfig.images?.remotePatterns?.[0]).toEqual({
      protocol: 'https',
      hostname: 'res.cloudinary.com',
    });
  });

  it('should not have any unexpected properties', () => {
    const allowedKeys = ['pageExtensions', 'output', 'images'];
    expect(Object.keys(nextConfig).sort()).toEqual(allowedKeys.sort());
  });

  it('should have images property as an object', () => {
    expect(typeof nextConfig.images).toBe('object');
    expect(nextConfig.images).not.toBeNull();
  });
});
