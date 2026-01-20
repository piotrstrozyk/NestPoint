import generateMetadata from '@/core/lib/nextjs-generate-metadata';
import { describe, expect, it } from 'vitest';

describe('generateMetadata', () => {
  it('should be defined', () => {
    expect(generateMetadata).toBeDefined();
    expect(typeof generateMetadata).toBe('function');
  });

  it('should return a Promise', () => {
    const result = generateMetadata();
    expect(result).toBeInstanceOf(Promise);
  });

  it('should resolve to correct metadata object', async () => {
    const metadata = await generateMetadata();
    expect(metadata).toBeDefined();
    expect(typeof metadata).toBe('object');
    expect(metadata.title).toBe('NestPoint');
    expect(metadata.description).toBe('Property rental management system');
    expect(metadata.icons).toBeDefined();
    expect(typeof metadata.icons).toBe('object');
    type Icons = { icon: string; apple: string };
    if (
      typeof metadata.icons === 'object' &&
      metadata.icons !== null &&
      'icon' in metadata.icons
    ) {
      expect((metadata.icons as Icons).icon).toBe('/favicon.ico');
    } else {
      throw new Error("metadata.icons does not have an 'icon' property");
    }
    expect(metadata.icons.apple).toBe('/apple-icon.webp');
  });

  it('should not have unexpected properties', async () => {
    const metadata = await generateMetadata();
    const allowedKeys = ['title', 'description', 'icons'];
    expect(Object.keys(metadata).sort()).toEqual(allowedKeys.sort());
  });

  it('icons should not have unexpected properties', async () => {
    const metadata = await generateMetadata();
    const allowedIconKeys = ['icon', 'apple'];
    expect(
      metadata.icons && typeof metadata.icons === 'object'
        ? Object.keys(metadata.icons).sort()
        : [],
    ).toEqual(allowedIconKeys.sort());
  });
});
