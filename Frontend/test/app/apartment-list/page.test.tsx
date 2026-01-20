import { Suspense, ReactElement } from 'react';
import { describe, expect, it } from 'vitest';
import ApartmentListPageEntry from '@/app/apartment-list/page';
import ApartmentsPage from '@/features/apartment-list/pages/apartment-list-page';

describe('ApartmentListPage Entry Module', () => {
  it('should export a component named ApartmentListPageWithSuspense', () => {
    expect(ApartmentListPageEntry.name).toBe('ApartmentListPageWithSuspense');
  });

  it('should render a <Suspense> with ApartmentsPage as its child', () => {
    const tree = ApartmentListPageEntry() as ReactElement;

    expect(tree.type).toBe(Suspense);

    const child = (tree.props as { children: ReactElement }).children as ReactElement;
    expect(child.type).toBe(ApartmentsPage);
  });
});
