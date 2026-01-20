import { Suspense } from 'react';
import LoginPage from '@/features/login/pages/login-page';

export default function LoginPageWithSuspense() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginPage />
    </Suspense>
  );
}
