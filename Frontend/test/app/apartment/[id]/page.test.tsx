import ApartmentDetailPageEntry from '@/app/apartment/[id]/page';
import ApartmentDetailPage from '@/features/apartment/pages/apartment-page';
import { describe, expect, it } from 'vitest';

describe('ApartmentDetailPage Entry Module', () => {
  it('should re-export the ApartmentDetailPage component', () => {
    expect(ApartmentDetailPageEntry).toBe(ApartmentDetailPage);
  });
});
