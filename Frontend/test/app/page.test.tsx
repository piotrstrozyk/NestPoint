import LandingPageEntry from '@/app/page';
import LandingPage from '@/features/landing-page/pages/landing-page';
import { describe, expect, it } from 'vitest';

describe('LandingPage Entry Module', () => {
  it('should re-export the LandingPage component', () => {
    expect(LandingPageEntry).toBe(LandingPage);
  });
});
