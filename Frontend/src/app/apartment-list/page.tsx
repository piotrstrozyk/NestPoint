import { Suspense } from 'react';
import ApartmentsPage from '@/features/apartment-list/pages/apartment-list-page';

export default function ApartmentListPageWithSuspense() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ApartmentsPage />
    </Suspense>
  );
}
