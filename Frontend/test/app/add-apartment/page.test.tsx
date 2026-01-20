import AddApartmentPageEntry from '@/app/add-apartment/page';
import AddApartmentPage from '@/features/add-apartment/pages/add-apartment-page';
import { describe, expect, it } from 'vitest';

describe('AddApartmentPage Entry Module', () => {
  it('should re-export the AddApartmentPage component', () => {
    expect(AddApartmentPageEntry).toBe(AddApartmentPage);
  });
});
