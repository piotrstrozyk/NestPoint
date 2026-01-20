import FAQPageEntry from '@/app/faq/page';
import FAQPage from '@/features/faq/pages/faq-page';
import { describe, expect, it } from 'vitest';

describe('FAQPage Entry Module', () => {
  it('should re-export the FAQPage component', () => {
    // Ensure that the entry module exports exactly the FAQPage component
    expect(FAQPageEntry).toBe(FAQPage);
  });
});
