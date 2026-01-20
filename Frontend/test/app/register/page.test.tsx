import RegistrationPageEntry from '@/app/register/page';
import RegistrationPage from '@/features/register/pages/registration-page';
import { describe, expect, it } from 'vitest';

describe('RegistrationPage Entry Module', () => {
  it('should re-export the RegistrationPage component', () => {
    expect(RegistrationPageEntry).toBe(RegistrationPage);
  });
});
