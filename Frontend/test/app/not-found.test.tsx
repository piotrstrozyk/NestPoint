import NotFoundPageEntry from '@/app/not-found';
import NotFoundPage from '@/features/not-found/pages/not-found-page';
import { describe, expect, it } from 'vitest';

describe('Page Entry Module', () => {
  it('should re-export the NotFoundPage component', () => {
    expect(NotFoundPageEntry).toBe(NotFoundPage);
  });
});
